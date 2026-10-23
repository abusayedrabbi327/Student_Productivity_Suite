import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { CalendarEvent } from './CalendarGrid';
import { format } from 'date-fns';
import { Clock, Calendar } from 'lucide-react';

interface EventDetailSheetProps {
  open: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onDelete?: (eventId: string) => void;
}

export function EventDetailSheet({ open, onClose, event, onDelete }: EventDetailSheetProps) {
  if (!event) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[340px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-base">{event.title}</SheetTitle>
          <SheetDescription>
            {event.type === 'study-block' ? 'Study Session' : 'Event'}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="text-gray-500 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-gray-700">Date</p>
              <p className="text-sm text-gray-600">
                {format(event.date, 'EEEE, MMM d, yyyy')}
              </p>
            </div>
          </div>

          {event.startTime && event.endTime && (
            <div className="flex items-start gap-3">
              <Clock className="text-gray-500 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-medium text-gray-700">Time</p>
                <p className="text-sm text-gray-600">
                  {event.startTime} - {event.endTime}
                </p>
              </div>
            </div>
          )}

          {event.type === 'study-block' && (
            <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                Auto-scheduled study session for your deadline.
              </p>
            </div>
          )}

          {onDelete && (
            <div className="pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  onDelete(event.id);
                  onClose();
                }}
                className="w-full py-2.5 px-4 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl border border-red-200 transition-colors"
              >
                Delete from Calendar
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}