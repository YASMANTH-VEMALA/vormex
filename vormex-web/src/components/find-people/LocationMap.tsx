'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface NearbyUser {
  id: string;
  name: string;
  username: string;
  profileImage: string | null;
  bannerImage: string | null;
  headline: string | null;
  skills: string[];
  interests: string[];
  distance: number;
  isOnline: boolean;
  location: {
    lat: number;
    lng: number;
    city: string | null;
    state: string | null;
    country: string | null;
  };
}

interface LocationMapProps {
  center: { lat: number; lng: number };
  radius: number;
  users: NearbyUser[];
  onUserClick: (user: NearbyUser) => void;
}

export function LocationMap({ center, radius, users, onUserClick }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkersRef = useRef<L.Marker[]>([]);
  const circleRef = useRef<L.Circle | null>(null);
  const myMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    console.log('[LocationMap] Initializing map at', center.lat, center.lng);
    
    // Initialize map
    const map = L.map(mapRef.current).setView([center.lat, center.lng], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center, circle, and my location marker when center/radius changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    console.log('[LocationMap] Updating center to', center.lat, center.lng, 'radius:', radius);
    
    mapInstanceRef.current.setView([center.lat, center.lng], 13);

    // Update or create circle
    if (circleRef.current) {
      circleRef.current.setLatLng([center.lat, center.lng]);
      circleRef.current.setRadius(radius * 1000);
    } else {
      circleRef.current = L.circle([center.lat, center.lng], {
        radius: radius * 1000,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 2,
      }).addTo(mapInstanceRef.current);
    }

    // Update or create "my location" marker
    if (myMarkerRef.current) {
      myMarkerRef.current.setLatLng([center.lat, center.lng]);
    } else {
      const myIcon = L.divIcon({
        className: 'my-location-marker',
        html: `
          <div style="position: relative;">
            <div style="width: 20px; height: 20px; background: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      myMarkerRef.current = L.marker([center.lat, center.lng], { icon: myIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('<b>You are here</b>');
    }
  }, [center, radius]);

  // Update user markers when users array changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    console.log('[LocationMap] Updating user markers, count:', users.length);

    // Clear existing user markers
    userMarkersRef.current.forEach((marker) => marker.remove());
    userMarkersRef.current = [];

    // Add user markers
    users.forEach((user) => {
      if (!user.location?.lat || !user.location?.lng) {
        console.log('[LocationMap] Skipping user without coordinates:', user.username);
        return;
      }
      
      const userLat = user.location.lat;
      const userLng = user.location.lng;

      console.log('[LocationMap] Adding marker for', user.username, 'at', userLat, userLng);

      // Create custom icon with user avatar - using inline styles for reliability
      const userMarkerIcon = L.divIcon({
        className: 'nearby-user-marker',
        html: `
          <div style="position: relative; cursor: pointer; transition: transform 0.2s;">
            <div style="width: 48px; height: 48px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); overflow: hidden; background: linear-gradient(135deg, #60a5fa, #a855f7); display: flex; align-items: center; justify-content: center;">
              ${user.profileImage 
                ? `<img src="${user.profileImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="${user.name}"/>`
                : `<span style="color: white; font-weight: bold; font-size: 18px;">${user.name?.charAt(0) || '?'}</span>`
              }
            </div>
            ${user.isOnline ? `<div style="position: absolute; top: 0; right: 0; width: 12px; height: 12px; background: #22c55e; border-radius: 50%; border: 2px solid white;"></div>` : ''}
            <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); background: #3b82f6; color: white; font-size: 10px; padding: 2px 8px; border-radius: 10px; white-space: nowrap; font-weight: 500; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
              ${user.distance < 1 ? `${Math.round(user.distance * 1000)}m` : `${user.distance.toFixed(1)}km`}
            </div>
          </div>
        `,
        iconSize: [48, 60],
        iconAnchor: [24, 48],
        popupAnchor: [0, -48],
      });

      const marker = L.marker([userLat, userLng], { icon: userMarkerIcon })
        .addTo(mapInstanceRef.current!)
        .bindPopup(`
          <div style="text-align: center; min-width: 140px; padding: 4px;">
            <p style="font-weight: 600; color: #111; font-size: 14px; margin: 0;">${user.name}</p>
            <p style="font-size: 12px; color: #666; margin: 2px 0;">@${user.username}</p>
            ${user.location.city ? `<p style="font-size: 11px; color: #999; margin: 2px 0;">${user.location.city}</p>` : ''}
            <p style="font-size: 12px; color: #3b82f6; margin-top: 4px; font-weight: 500;">
              ${user.distance < 1 ? `${Math.round(user.distance * 1000)}m away` : `${user.distance.toFixed(1)}km away`}
            </p>
          </div>
        `);

      marker.on('click', () => {
        onUserClick(user);
      });

      userMarkersRef.current.push(marker);
    });
    
    console.log('[LocationMap] Added', userMarkersRef.current.length, 'user markers');
  }, [users, onUserClick]);

  return (
    <>
      <div ref={mapRef} className="w-full h-full z-0" />
      <style jsx global>{`
        .my-location-marker,
        .nearby-user-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
        }
        .leaflet-popup-content {
          margin: 8px 12px;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
    </>
  );
}
