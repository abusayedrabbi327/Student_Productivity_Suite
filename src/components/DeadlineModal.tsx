import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { AlertCircle } from 'lucide-react';

interface DeadlineModalProps {
  open: boolean;
  onAutoSchedule: () => void;
  onDismiss: () => void;
  deadlineTitle: string;
  deadlineDay: string;
  scheduledBlocksCount: number;
  suggestedSessionsCount: number;
}

export function DeadlineModal({
  open,
  onAutoSchedule,
  onDismiss,
  deadlineTitle,
  deadlineDay,
  scheduledBlocksCount,
  suggestedSessionsCount,
}: DeadlineModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <DialogContent className="max-w-[340px] sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="text-amber-500" size={20} />
            <DialogTitle className="text-base sm:text-lg">Deadline Detected</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Deadline notification for {deadlineTitle} due {deadlineDay}
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-sm text-gray-700 space-y-2 py-2">
          <p>
            <span className="font-medium">{deadlineTitle}</span> is due {deadlineDay}.
          </p>
          {scheduledBlocksCount === 0 ? (
            <p>
              Schedule <span className="font-medium">{suggestedSessionsCount} study sessions</span>?
            </p>
          ) : (
            <p>
              You have <span className="font-medium">{scheduledBlocksCount}</span> scheduled. Add {suggestedSessionsCount} more?
            </p>
          )}
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            onClick={onAutoSchedule}
            className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 text-sm"
          >
            Auto-Schedule
          </Button>
          <Button
            onClick={onDismiss}
            variant="outline"
            className="w-full sm:w-auto text-sm"
          >
            Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}