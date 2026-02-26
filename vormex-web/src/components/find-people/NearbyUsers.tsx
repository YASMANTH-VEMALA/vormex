'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  MapPin,
  Loader2,
  RefreshCw,
  Users,
  AlertCircle,
  UserPlus,
  X,
  Search,
  Filter,
} from 'lucide-react';
import {
  getNearbyUsers,
  updateLocation,
  type NearbyUser,
  type NearbyUsersResponse,
} from '@/lib/api/location';
import { updateLocation as emitLocationUpdate } from '@/lib/socket';
import { sendConnectionRequest } from '@/lib/api/connections';
import ConnectionSentToast from '@/components/engagement/ConnectionSentToast';

// Dynamically import the map component (no SSR for Leaflet)
const LocationMap = dynamic(
  () => import('./LocationMap').then((mod) => mod.LocationMap),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-neutral-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    ),
  }
);

interface NearbyUsersProps {
  onBack?: () => void;
}

export function NearbyUsers({ onBack }: NearbyUsersProps) {
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(50);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [connectingUserId, setConnectingUserId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastName, setToastName] = useState('');

  // Radius options in km
  const radiusOptions = [10, 25, 50, 100, 200];

  // Get current location from browser (prompts for permission)
  const getCurrentLocation = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0, // Always get fresh location for initial request
      });
    });
  }, []);

  // Watch position for real-time location updates
  const watchPositionIdRef = useRef<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Fetch nearby users - pass device lat/lng for real-time accuracy
  const fetchNearbyUsers = useCallback(
    async (lat?: number, lng?: number, search?: string, radiusKm?: number) => {
      try {
        const centerLat = lat ?? myLocation?.lat;
        const centerLng = lng ?? myLocation?.lng;
        const effectiveRadius = radiusKm ?? radius;
        if (!centerLat || !centerLng) {
          setNearbyUsers([]);
          return;
        }
        const result = await getNearbyUsers(
          effectiveRadius,
          50,
          centerLat,
          centerLng,
          (search ?? debouncedSearch) || undefined
        );
        if (result.locationRequired) {
          setNearbyUsers([]);
          return;
        }
        setNearbyUsers(result.users || []);
        if (result.userLocation && (!lat || !lng)) {
          setMyLocation({ lat: result.userLocation.lat, lng: result.userLocation.lng });
        }
      } catch (error) {
        console.error('[NearbyUsers] Failed to fetch nearby users:', error);
      }
    },
    [radius, myLocation?.lat, myLocation?.lng, debouncedSearch]
  );

  // Update location and fetch nearby users
  const refreshLocation = useCallback(async () => {
    setRefreshing(true);
    setLocationError(null);

    try {
      const position = await getCurrentLocation();
      const { latitude, longitude, accuracy } = position.coords;

      setMyLocation({ lat: latitude, lng: longitude });

      // Try to update server location (don't fail if it errors)
      try {
        await updateLocation(latitude, longitude, accuracy);
      } catch (err) {
        console.warn('Could not update server location:', err);
      }

      // Fetch nearby users with device's real-time location
      await fetchNearbyUsers(latitude, longitude);
    } catch (error: any) {
      console.error('Location error:', error);
      if (error.code === 1) {
        setLocationError('Location permission denied. Please enable location access.');
      } else if (error.code === 2) {
        setLocationError('Unable to determine your location. Please try again.');
      } else if (error.code === 3) {
        setLocationError('Location request timed out. Please try again.');
      } else {
        setLocationError(error.message || 'Failed to get location');
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [getCurrentLocation, fetchNearbyUsers]);

  // Initial load - request location permission and fetch
  useEffect(() => {
    refreshLocation();
  }, []);

  // Real-time location sharing: watch position and update server + broadcast via socket
  useEffect(() => {
    if (!myLocation || locationError) return;

    const watchId = navigator.geolocation?.watchPosition?.(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setMyLocation({ lat: latitude, lng: longitude });
        updateLocation(latitude, longitude, accuracy).catch(console.warn);
        emitLocationUpdate({ lat: latitude, lng: longitude, accuracy });
      },
      (err) => {
        if (err.code === 1) setLocationError('Location permission denied.');
      },
      { enableHighAccuracy: true, maximumAge: 30000 }
    );

    watchPositionIdRef.current = watchId ?? null;
    return () => {
      if (watchPositionIdRef.current != null) {
        navigator.geolocation?.clearWatch?.(watchPositionIdRef.current);
      }
    };
  }, [!!myLocation, !!locationError]);

  // Re-fetch when radius or search change
  useEffect(() => {
    if (!loading && myLocation && !locationError) {
      fetchNearbyUsers(myLocation.lat, myLocation.lng, searchQuery, radius);
    }
  }, [radius, debouncedSearch, myLocation?.lat, myLocation?.lng]);

  // Handle connection
  const handleConnect = async (userId: string) => {
    setConnectingUserId(userId);
    try {
      await sendConnectionRequest(userId);
      // Find user name for toast
      const user = nearbyUsers?.find((u: NearbyUser) => u.id === userId);
      setToastName(user?.name || '');
      setShowToast(true);
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setConnectingUserId(null);
    }
  };

  // User Profile Card Component
  const UserProfileCard = ({ user, onClose }: { user: NearbyUser; onClose: () => void }) => (
    <div 
      className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Banner */}
        <div className="h-24 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 relative">
          {user.bannerImage && (
            <img
              src={user.bannerImage}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Avatar */}
        <div className="px-4 -mt-10 relative z-10">
          <div className="w-20 h-20 rounded-full border-4 border-white dark:border-neutral-900 overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-2xl">
                {user.name?.charAt(0) || '?'}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-6 pt-3">
          {/* Name & Username */}
          <div className="mb-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {user.name}
            </h2>
            <p className="text-gray-500 dark:text-neutral-400">
              @{user.username}
            </p>
          </div>

          {/* Distance Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
              <MapPin className="w-3.5 h-3.5" />
              {user.distance < 1
                ? `${Math.round(user.distance * 1000)}m away`
                : `${user.distance.toFixed(1)}km away`}
            </span>
            {user.location?.city && (
              <span className="text-sm text-gray-500 dark:text-neutral-400">
                {user.location.city}
              </span>
            )}
            {user.isOnline && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Online
              </span>
            )}
          </div>

          {/* Headline */}
          {user.headline && (
            <p className="text-gray-700 dark:text-neutral-300 mb-4">
              {user.headline}
            </p>
          )}

          {/* Skills */}
          {user.skills && user.skills.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-neutral-500 uppercase mb-2">
                Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {user.skills.slice(0, 6).map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-full text-xs"
                  >
                    {skill}
                  </span>
                ))}
                {user.skills.length > 6 && (
                  <span className="px-2.5 py-1 text-gray-500 text-xs">
                    +{user.skills.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-neutral-500 uppercase mb-2">
                Interests
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {user.interests.slice(0, 6).map((interest, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs"
                  >
                    {interest}
                  </span>
                ))}
                {user.interests.length > 6 && (
                  <span className="px-2.5 py-1 text-gray-500 text-xs">
                    +{user.interests.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <Link
              href={`/profile/${user.username}`}
              className="flex-1 py-2.5 text-center bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            >
              View Profile
            </Link>
            <button
              onClick={() => handleConnect(user.id)}
              disabled={connectingUserId === user.id}
              className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {connectingUserId === user.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Connect
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );

  return (
    <div className="h-[calc(100vh-200px)] min-h-[500px] flex flex-col bg-gray-50 dark:bg-neutral-950 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                People Nearby
              </h2>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                {myLocation && (
                  <>Your location: {myLocation.lat.toFixed(4)}, {myLocation.lng.toFixed(4)} · </>
                )}
                {nearbyUsers.length} people within {radius}km
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-lg text-sm border-0 focus:ring-2 focus:ring-blue-500"
            >
              {radiusOptions.map((r) => (
                <option key={r} value={r}>
                  {r} km
                </option>
              ))}
            </select>
            <button
              onClick={refreshLocation}
              disabled={refreshing}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              title="Refresh location"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 dark:text-neutral-400 ${
                  refreshing ? 'animate-spin' : ''
                }`}
              />
            </button>
          </div>
        </div>
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, username, college, skills..."
            className="w-full pl-9 pr-16 py-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-full transition-colors ${
                showFilters ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-700'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-neutral-300 block">
              Search radius
            </label>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg text-sm"
            >
              {radiusOptions.map((r) => (
                <option key={r} value={r}>
                  Within {r} km
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Map or Loading/Error */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-neutral-900 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-500 dark:text-neutral-400">
              Finding people near you...
            </p>
          </div>
        )}

        {!loading && locationError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-neutral-900 z-10 p-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 dark:text-red-400 font-medium">
                    Location Error
                  </p>
                  <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                    {locationError}
                  </p>
                  <button
                    onClick={refreshLocation}
                    className="mt-3 text-sm text-red-600 dark:text-red-400 hover:underline font-medium"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !locationError && myLocation && (
          <LocationMap
            center={myLocation}
            radius={radius}
            users={nearbyUsers}
            onUserClick={(user) => setSelectedUser(user)}
          />
        )}

        {/* Users List (Bottom Sheet) */}
        {!loading && !locationError && nearbyUsers.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 rounded-t-2xl max-h-48 overflow-hidden z-[500]">
            <div className="p-2">
              <div className="w-12 h-1 bg-gray-300 dark:bg-neutral-700 rounded-full mx-auto mb-2" />
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {nearbyUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="flex-shrink-0 flex items-center gap-2 p-2 bg-gray-50 dark:bg-neutral-800 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {user.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[100px]">
                        {user.name}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {user.distance < 1
                          ? `${Math.round(user.distance * 1000)}m`
                          : `${user.distance.toFixed(1)}km`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !locationError && nearbyUsers.length === 0 && myLocation && (
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 rounded-t-2xl p-6 z-[500]">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-300 dark:text-neutral-700 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                No one nearby
              </h3>
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                Try increasing the search radius to find more people
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Selected User Card Modal - rendered via portal */}
      {selectedUser && typeof document !== 'undefined' && createPortal(
        <UserProfileCard
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />,
        document.body
      )}

      <ConnectionSentToast
        show={showToast}
        recipientName={toastName}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
