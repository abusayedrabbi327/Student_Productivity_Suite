import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { useEffect, useRef } from 'react';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'existing' | 'study-block';
  startTime?: string;
  endTime?: string;
}

interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick?: (date: Date) => void;
}

export function CalendarGrid({ currentDate, events, onDayClick }: CalendarGridProps) {
  const yearStart = startOfYear(currentDate);
  const yearEnd = endOfYear(currentDate);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current month on mount
  useEffect(() => {
    const currentMonthIndex = months.findIndex(month => 
      isSameMonth(month, today)
    );
    
    if (scrollContainerRef.current && currentMonthIndex !== -1) {
      const scrollAmount = scrollContainerRef.current.offsetWidth * currentMonthIndex;
      scrollContainerRef.current.scrollTo({
        left: scrollAmount,
        behavior: 'instant',
      });
    }
  }, []);

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(event.date, day));
  };

  const renderMonth = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div key={format(month, 'yyyy-MM')} className="flex-shrink-0 w-full px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          {/* Month and Year Header */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              {format(month, 'MMMM yyyy')}
            </h3>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Week day headers */}
            {weekDays.map((day, index) => (
              <div
                key={`weekday-${index}`}
                className="text-center text-xs font-semibold text-gray-600 py-2"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, month);
              const isToday = isSameDay(day, today);
              const hasStudyBlock = dayEvents.some((e) => e.type === 'study-block');
              const hasExistingEvent = dayEvents.some((e) => e.type === 'existing');

              return (
                <div
                  key={`day-${format(day, 'yyyy-MM-dd')}-${index}`}
                  onClick={() => onDayClick && isCurrentMonth && onDayClick(day)}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center rounded-lg
                    transition-all
                    ${!isCurrentMonth ? 'opacity-30' : 'cursor-pointer hover:bg-gray-50'}
                  `}
                >
                  {/* Today's highlight - circular transparent blue */}
                  {isToday && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-blue-500/40" />
                    </div>
                  )}
                  
                  {/* Day number */}
                  <div
                    className={`
                      relative text-sm font-medium z-10
                      ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                      ${isToday ? 'text-blue-600 font-bold' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </div>
                  
                  {/* Event indicators */}
                  {isCurrentMonth && (hasStudyBlock || hasExistingEvent) && (
                    <div className="absolute bottom-1 flex gap-1">
                      {hasStudyBlock && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                      {hasExistingEvent && (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Year Header */}
      <div className="mb-4 px-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {format(currentDate, 'yyyy')}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Scroll horizontally to view other months
        </p>
      </div>

      {/* Scrollable months container */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        <div className="flex">
          {months.map(renderMonth)}
        </div>
      </div>
    </div>
  );
}