'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, Clock, Plus, Video } from 'lucide-react';
import { eventsAPI, type CampusEvent } from '@/lib/api/events';
import { useAuthContext } from '@/lib/auth/authContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const EVENT_TYPES = [
  { id: 'all', label: 'All' },
  { id: 'meetup', label: 'Meetups' },
  { id: 'study_session', label: 'Study Sessions' },
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'workshop', label: 'Workshops' },
  { id: 'talk', label: 'Talks' },
  { id: 'social', label: 'Social' },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function EventCard({ event, onRsvp }: { event: CampusEvent; onRsvp: (id: string, status: string) => void }) {
  const router = useRouter();
  const isPast = new Date(event.endsAt) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden ${isPast ? 'opacity-60' : ''}`}
    >
      {/* Date strip */}
      <div className="flex">
        <div className="w-16 bg-blue-500 flex flex-col items-center justify-center py-3 text-white flex-shrink-0">
          <span className="text-[10px] uppercase font-medium opacity-80">
            {new Date(event.startsAt).toLocaleDateString('en', { month: 'short' })}
          </span>
          <span className="text-xl font-bold leading-none">
            {new Date(event.startsAt).getDate()}
          </span>
          <span className="text-[10px] uppercase font-medium opacity-80">
            {new Date(event.startsAt).toLocaleDateString('en', { weekday: 'short' })}
          </span>
        </div>

        <div className="flex-1 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{event.title}</h3>
              
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-neutral-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(event.startsAt)}
                </span>
                <span className="flex items-center gap-1">
                  {event.isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                  {event.isOnline ? 'Online' : event.venue || event.campus}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {event.attendeesCount}{event.maxAttendees ? `/${event.maxAttendees}` : ''}
                </span>
              </div>

              {event.circle && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium">
                  {event.circle.emoji} {event.circle.name}
                </span>
              )}
            </div>

            {/* RSVP */}
            {!isPast && (
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onRsvp(event.id, event.myStatus === 'going' ? 'not_going' : 'going'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    event.myStatus === 'going'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-green-50 hover:text-green-600'
                  }`}
                >
                  {event.myStatus === 'going' ? 'Going' : 'RSVP'}
                </button>
              </div>
            )}
          </div>

          {/* Attendees preview */}
          {event.attendeesPreview && event.attendeesPreview.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex -space-x-1.5">
                {event.attendeesPreview.slice(0, 3).map(a => (
                  <div key={a.id} className="w-5 h-5 rounded-full bg-gray-200 dark:bg-neutral-800 border border-white dark:border-neutral-900 overflow-hidden">
                    {a.profileImage ? (
                      <img src={a.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-gray-400">{a.name.charAt(0)}</div>
                    )}
                  </div>
                ))}
              </div>
              {event.attendeesCount > 3 && (
                <span className="text-[10px] text-gray-500">+{event.attendeesCount - 3} more</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EventsContent() {
  const { user } = useAuthContext();
  const router = useRouter();
  const [tab, setTab] = useState<'upcoming' | 'my'>('upcoming');
  const [type, setType] = useState('all');
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [myEvents, setMyEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create event form
  const [form, setForm] = useState({
    title: '', description: '', type: 'meetup', campus: user?.college || '',
    venue: '', isOnline: false, meetingLink: '', startsAt: '', endsAt: '',
    maxAttendees: '', tags: '',
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { upcoming: true };
      if (type !== 'all') params.type = type;
      const data = await eventsAPI.getEvents(params);
      setEvents(data.events);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  }, [type]);

  const fetchMyEvents = useCallback(async () => {
    try {
      const data = await eventsAPI.getMyEvents();
      setMyEvents(data.events);
    } catch (error) {
      console.error('Failed to fetch my events:', error);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { if (tab === 'my') fetchMyEvents(); }, [tab, fetchMyEvents]);

  const handleRsvp = async (eventId: string, status: string) => {
    try {
      await eventsAPI.rsvp(eventId, status as any);
      const updateList = (list: CampusEvent[]) => list.map(e => {
        if (e.id !== eventId) return e;
        const wasGoing = e.myStatus === 'going';
        const nowGoing = status === 'going';
        return {
          ...e,
          myStatus: status === 'not_going' ? null : status,
          attendeesCount: e.attendeesCount + (nowGoing ? 1 : 0) - (wasGoing ? 1 : 0),
        };
      });
      setEvents(updateList);
      setMyEvents(updateList);
    } catch (error) {
      console.error('RSVP failed:', error);
    }
  };

  const handleCreate = async () => {
    try {
      await eventsAPI.create({
        title: form.title,
        description: form.description,
        type: form.type,
        campus: form.campus,
        venue: form.venue || undefined,
        isOnline: form.isOnline,
        meetingLink: form.meetingLink || undefined,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees) : undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      });
      setShowCreate(false);
      fetchEvents();
    } catch (error) {
      console.error('Create event failed:', error);
    }
  };

  const displayEvents = tab === 'my' ? myEvents : events;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-24">
      <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Events</h1>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
          </div>

          <div className="flex bg-gray-100 dark:bg-neutral-800 rounded-xl p-1 mb-3">
            <button onClick={() => setTab('upcoming')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'upcoming' ? 'bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
              Upcoming
            </button>
            <button onClick={() => setTab('my')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'my' ? 'bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
              My Events
            </button>
          </div>

          {tab === 'upcoming' && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {EVENT_TYPES.map(t => (
                <button key={t.id} onClick={() => setType(t.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${type === t.id ? 'bg-gray-900 dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-4 space-y-3">
                <input placeholder="Event title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                <textarea placeholder="Description *" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 text-sm">
                    <option value="meetup">Meetup</option>
                    <option value="study_session">Study Session</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="workshop">Workshop</option>
                    <option value="talk">Talk</option>
                    <option value="social">Social</option>
                  </select>
                  <input placeholder="Campus *" value={form.campus} onChange={e => setForm({...form, campus: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 text-sm focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="datetime-local" placeholder="Starts *" value={form.startsAt} onChange={e => setForm({...form, startsAt: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 text-sm" />
                  <input type="datetime-local" placeholder="Ends *" value={form.endsAt} onChange={e => setForm({...form, endsAt: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 text-sm" />
                </div>
                <input placeholder="Venue (optional)" value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 text-sm focus:outline-none" />
                <button onClick={handleCreate} disabled={!form.title || !form.description || !form.startsAt || !form.endsAt} className="w-full py-2.5 rounded-lg bg-blue-500 text-white text-sm font-semibold disabled:opacity-50 hover:bg-blue-600 transition-colors">
                  Create Event
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events list */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 h-24 animate-pulse" />
          ))
        ) : displayEvents.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-10 h-10 text-gray-300 dark:text-neutral-700 mx-auto mb-3" />
            <p className="font-medium text-gray-700 dark:text-neutral-300">{tab === 'my' ? 'No events yet' : 'No upcoming events'}</p>
            <p className="text-sm text-gray-500 mt-1">
              {tab === 'my' ? 'RSVP to events or create your own' : 'Be the first to create an event for your campus!'}
            </p>
          </div>
        ) : (
          displayEvents.map(event => (
            <EventCard key={event.id} event={event} onRsvp={handleRsvp} />
          ))
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <ProtectedRoute>
      <EventsContent />
    </ProtectedRoute>
  );
}
