import apiClient from './client';

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  campus: string;
  venue: string | null;
  isOnline: boolean;
  meetingLink: string | null;
  startsAt: string;
  endsAt: string;
  maxAttendees: number | null;
  attendeesCount: number;
  organizerId: string;
  circleId: string | null;
  coverImageUrl: string | null;
  tags: string[];
  myStatus: string | null;
  circle?: { id: string; name: string; emoji: string; slug: string } | null;
  attendeesPreview?: { id: string; name: string; profileImage: string | null }[];
  _count?: { attendees: number };
  createdAt: string;
}

export const eventsAPI = {
  getEvents: async (params?: { campus?: string; type?: string; upcoming?: boolean; page?: number }): Promise<{
    events: CampusEvent[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const sp = new URLSearchParams();
    if (params?.campus) sp.set('campus', params.campus);
    if (params?.type) sp.set('type', params.type);
    if (params?.upcoming) sp.set('upcoming', 'true');
    if (params?.page) sp.set('page', String(params.page));
    return apiClient.get(`/events?${sp.toString()}`) as any;
  },

  getUpcoming: async (campus?: string): Promise<{ events: CampusEvent[] }> => {
    const sp = campus ? `?campus=${encodeURIComponent(campus)}` : '';
    return apiClient.get(`/events/upcoming${sp}`) as any;
  },

  getMyEvents: async (): Promise<{ events: CampusEvent[] }> => {
    return apiClient.get('/events/my') as any;
  },

  getById: async (eventId: string): Promise<{ event: CampusEvent & { attendeesList: any[] } }> => {
    return apiClient.get(`/events/${eventId}`) as any;
  },

  create: async (data: {
    title: string;
    description: string;
    type: string;
    campus: string;
    venue?: string;
    isOnline?: boolean;
    meetingLink?: string;
    startsAt: string;
    endsAt: string;
    maxAttendees?: number;
    circleId?: string;
    tags?: string[];
  }): Promise<{ event: CampusEvent }> => {
    return apiClient.post('/events', data) as any;
  },

  rsvp: async (eventId: string, status: 'going' | 'interested' | 'not_going'): Promise<{ message: string; status: string }> => {
    return apiClient.post(`/events/${eventId}/rsvp`, { status }) as any;
  },
};
