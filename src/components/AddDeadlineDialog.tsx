import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar, Clock, Sparkles } from 'lucide-react';

export interface NewDeadlinePayload {
  title: string;
  dueDate: Date;
  sessionsNeeded: number;
}

export interface NewEventPayload {
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: 'existing' | 'study-block';
}

interface AddDeadlineDialogProps {
  open: boolean;
  onClose: () => void;
  onAddDeadline: (deadline: NewDeadlinePayload) => void;
  onAddEvent?: (event: NewEventPayload) => void;
}

export function AddDeadlineDialog({ open, onClose, onAddDeadline, onAddEvent }: AddDeadlineDialogProps) {
  const [entryType, setEntryType] = useState<'deadline' | 'event'>('deadline');

  // Deadline fields
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [sessions, setSessions] = useState('3');

  // Event fields
  const [eventTitle, setEventTitle] = useState('');
  const [eventDateStr, setEventDateStr] = useState('');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('11:30 AM');

  const handleDeadlineSubmit = () => {
    if (!title.trim() || !dateStr) return;

    onAddDeadline({
      title: title.trim(),
      dueDate: new Date(dateStr),
      sessionsNeeded: parseInt(sessions) || 3,
    });

    setTitle('');
    setDateStr('');
    setSessions('3');
    onClose();
  };

  const handleEventSubmit = () => {
    if (!eventTitle.trim() || !eventDateStr || !onAddEvent) return;

    onAddEvent({
      title: eventTitle.trim(),
      date: new Date(eventDateStr),
      startTime,
      endTime,
      type: 'existing',
    });

    setEventTitle('');
    setEventDateStr('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[340px] sm:max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 text-lg font-bold">
            <Calendar className="w-5 h-5 text-blue-600" />
            Schedule Planner
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Add academic deadlines or standard schedule blocks to your personal calendar
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1 mt-2">
          <button
            type="button"
            onClick={() => setEntryType('deadline')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              entryType === 'deadline'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles size={13} />
            <span>Academic Deadline</span>
          </button>
          <button
            type="button"
            onClick={() => setEntryType('event')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              entryType === 'event'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Clock size={13} />
            <span>Schedule Event</span>
          </button>
        </div>

        {/* Deadline Form */}
        {entryType === 'deadline' ? (
          <div className="space-y-3.5 py-3">
            <div className="space-y-1">
              <Label htmlFor="title" className="text-xs font-bold text-gray-700">Course Assignment / Exam Title *</Label>
              <Input
                id="title"
                placeholder="e.g. HCI Usability Evaluation Report"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs sm:text-sm rounded-xl"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="date" className="text-xs font-bold text-gray-700">Due Date *</Label>
              <Input
                id="date"
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="text-xs sm:text-sm rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="sessions" className="text-xs font-bold text-gray-700">Study Sessions Needed</Label>
              <Input
                id="sessions"
                type="number"
                min="1"
                max="10"
                value={sessions}
                onChange={(e) => setSessions(e.target.value)}
                className="text-xs sm:text-sm rounded-xl"
              />
              <p className="text-[11px] text-gray-400">
                The smart planner will automatically identify free slots to schedule these sessions.
              </p>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button 
                onClick={handleDeadlineSubmit} 
                disabled={!title.trim() || !dateStr}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Add & Detect Slots
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Event Form */
          <div className="space-y-3.5 py-3">
            <div className="space-y-1">
              <Label htmlFor="eventTitle" className="text-xs font-bold text-gray-700">Event / Meeting Title *</Label>
              <Input
                id="eventTitle"
                placeholder="e.g. UIU Class Lecture or Team Sync"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="text-xs sm:text-sm rounded-xl"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="eventDate" className="text-xs font-bold text-gray-700">Date *</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDateStr}
                onChange={(e) => setEventDateStr(e.target.value)}
                className="text-xs sm:text-sm rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="startTime" className="text-xs font-bold text-gray-700">Start Time</Label>
                <Input
                  id="startTime"
                  placeholder="10:00 AM"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endTime" className="text-xs font-bold text-gray-700">End Time</Label>
                <Input
                  id="endTime"
                  placeholder="11:30 AM"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button 
                onClick={handleEventSubmit} 
                disabled={!eventTitle.trim() || !eventDateStr}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Save Event
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
