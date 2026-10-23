import { useState, useEffect, useCallback } from 'react';
import { CalendarGrid, CalendarEvent } from './CalendarGrid';
import { DeadlineModal } from './DeadlineModal';
import { EventDetailSheet } from './EventDetailSheet';
import { AddDeadlineDialog, NewDeadlinePayload, NewEventPayload } from './AddDeadlineDialog';
import { toast } from 'sonner@2.0.3';
import { addDays, format, isBefore, startOfDay } from 'date-fns';
import { Plus, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

interface ActiveDeadline {
  id: string;
  title: string;
  dueDate: Date;
  sessionsNeeded: number;
}

export function DeadlinePlannerView() {
  const { currentUser } = useAuth();
  const [currentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const [activeDeadline, setActiveDeadline] = useState<ActiveDeadline | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch real calendar events from Supabase for this user
  const loadCalendarData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const dbEvents = await api.getCalendarEvents(currentUser.id);
      
      const formattedEvents: CalendarEvent[] = dbEvents.map((e) => ({
        id: e.id,
        title: e.title,
        date: new Date(e.event_date),
        type: (e.type as any) || 'existing',
        startTime: e.start_time,
        endTime: e.end_time,
      }));

      setEvents(formattedEvents);
    } catch (err) {
      console.error('Error loading calendar events:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadCalendarData();

    // Realtime listener
    const channel = supabase
      .channel('calendar-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, () => {
        loadCalendarData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadCalendarData]);

  // Find non-conflicting time slots for a given deadline
  const findFreeTimeSlots = (dueDate: Date, sessionsCount: number, deadlineTitle: string): CalendarEvent[] => {
    const studyBlocks: CalendarEvent[] = [];
    const today = startOfDay(new Date());
    
    const timeSlots = [
      { start: '7:00 PM', end: '9:00 PM' },
      { start: '9:00 AM', end: '11:00 AM' },
      { start: '2:00 PM', end: '4:00 PM' },
    ];

    let dayOffset = 1;
    let sessionsScheduled = 0;

    while (sessionsScheduled < sessionsCount && dayOffset < 14) {
      const candidateDate = addDays(today, dayOffset);
      
      // Do not schedule on or after due date
      if (!isBefore(candidateDate, dueDate)) {
        dayOffset++;
        continue;
      }

      // Check existing events on this candidate date
      const existingOnDay = events.filter((e) => 
        format(e.date, 'yyyy-MM-dd') === format(candidateDate, 'yyyy-MM-dd')
      );

      for (const slot of timeSlots) {
        const hasConflict = existingOnDay.some((e) => e.startTime === slot.start);
        if (!hasConflict) {
          studyBlocks.push({
            id: `study-${Date.now()}-${sessionsScheduled}`,
            title: `${deadlineTitle} Prep`,
            date: candidateDate,
            type: 'study-block',
            startTime: slot.start,
            endTime: slot.end,
          });
          sessionsScheduled++;
          break;
        }
      }

      dayOffset++;
    }

    return studyBlocks;
  };

  // Called when user adds a deadline
  const handleAddDeadline = async (deadline: NewDeadlinePayload) => {
    if (!currentUser) return;

    try {
      const saved = await api.createDeadline({
        user_id: currentUser.id,
        title: deadline.title,
        due_date: deadline.dueDate.toISOString(),
        sessions_needed: deadline.sessionsNeeded,
      });

      const current = {
        id: saved?.id || Date.now().toString(),
        title: deadline.title,
        dueDate: deadline.dueDate,
        sessionsNeeded: deadline.sessionsNeeded,
      };

      setActiveDeadline(current);
      setShowDeadlineModal(true);
      toast.success(`Deadline "${deadline.title}" recorded!`);
    } catch (err: any) {
      toast.error('Failed to save deadline: ' + err.message);
    }
  };

  // Called when user adds a regular calendar event
  const handleAddEvent = async (event: NewEventPayload) => {
    if (!currentUser) return;

    try {
      const saved = await api.addCalendarEvent({
        user_id: currentUser.id,
        title: event.title,
        event_date: event.date.toISOString(),
        start_time: event.startTime,
        end_time: event.endTime,
        type: event.type,
      });

      if (saved) {
        setEvents((prev) => [
          ...prev,
          {
            id: saved.id,
            title: saved.title,
            date: new Date(saved.event_date),
            type: saved.type as any,
            startTime: saved.start_time,
            endTime: saved.end_time,
          },
        ]);
        toast.success(`Event "${event.title}" added to your calendar!`);
      }
    } catch (err: any) {
      toast.error('Failed to save event: ' + err.message);
    }
  };

  // Called when user clicks "Auto-Schedule" in DeadlineModal
  const handleAutoSchedule = async () => {
    if (!activeDeadline || !currentUser) return;

    const studyBlocks = findFreeTimeSlots(
      activeDeadline.dueDate, 
      activeDeadline.sessionsNeeded, 
      activeDeadline.title
    );

    if (studyBlocks.length === 0) {
      toast.info('No free slots found before due date. Consider adding study sessions manually.');
      setShowDeadlineModal(false);
      return;
    }

    const payload = studyBlocks.map((b) => ({
      user_id: currentUser.id,
      title: b.title,
      event_date: b.date.toISOString(),
      start_time: b.startTime || '7:00 PM',
      end_time: b.endTime || '9:00 PM',
      type: 'study-block',
    }));

    const ok = await api.addMultipleCalendarEvents(payload);
    if (ok) {
      setEvents((prev) => [...prev, ...studyBlocks]);
      setShowDeadlineModal(false);
      toast.success(`${studyBlocks.length} Study Sessions Scheduled!`, {
        description: 'Sessions saved to your live calendar schedule',
      });
    } else {
      toast.error('Could not auto-schedule study sessions');
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    const ok = await api.deleteCalendarEvent(eventId);
    if (ok) {
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast.success('Event removed from your calendar');
    } else {
      toast.error('Failed to delete event');
    }
  };

  const handleDismiss = () => {
    setShowDeadlineModal(false);
    toast.info('You can schedule sessions manually anytime');
  };

  const handleDayClick = (date: Date) => {
    const dayEvents = events.filter((e) => 
      format(e.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    
    if (dayEvents.length > 0) {
      setSelectedEvent(dayEvents[0]);
      setShowEventDetail(true);
    }
  };

  return (
    <div className="size-full bg-gradient-to-b from-gray-50 to-white overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CalendarIcon className="text-blue-600" size={22} />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Intelligent Deadline Planner</h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              Personalized schedule with automatic study block detection for course deliverables
            </p>
          </div>
          
          {/* Add Deadline / Event Button */}
          <Button
            size="sm"
            onClick={() => setShowAddDeadline(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Deadline / Event</span>
          </Button>
        </div>

        {events.length === 0 && !loading && (
          <div className="mb-4 p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between gap-3 text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600 shrink-0" />
              <span>Your calendar is currently clear. Click <strong>"Add Deadline / Event"</strong> above to schedule study blocks!</span>
            </div>
          </div>
        )}

        <CalendarGrid
          currentDate={currentDate}
          events={events}
          onDayClick={handleDayClick}
        />

        {/* Deadline Detection Modal - Only shown when user adds a deadline! */}
        {activeDeadline && (
          <DeadlineModal
            open={showDeadlineModal}
            onAutoSchedule={handleAutoSchedule}
            onDismiss={handleDismiss}
            deadlineTitle={activeDeadline.title}
            deadlineDay={format(activeDeadline.dueDate, 'EEEE, MMM d')}
            scheduledBlocksCount={events.filter((e) => e.type === 'study-block' && e.title.includes(activeDeadline.title)).length}
            suggestedSessionsCount={activeDeadline.sessionsNeeded}
          />
        )}

        {/* Event Detail Sheet */}
        <EventDetailSheet
          open={showEventDetail}
          onClose={() => setShowEventDetail(false)}
          event={selectedEvent}
          onDelete={handleDeleteEvent}
        />

        {/* Add Deadline & Event Dialog */}
        <AddDeadlineDialog
          open={showAddDeadline}
          onClose={() => setShowAddDeadline(false)}
          onAddDeadline={handleAddDeadline}
          onAddEvent={handleAddEvent}
        />
      </div>
    </div>
  );
}