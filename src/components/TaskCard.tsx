import { useDrop, useDrag } from 'react-dnd';
import { User } from 'lucide-react';

export interface Task {
  id: string;
  title: string;
  assignees: string[];
}

interface TaskCardProps {
  task: Task;
  onAssignMember: (taskId: string, memberId: string) => void;
}

export function TaskCard({ task, onAssignMember }: TaskCardProps) {
  // Make the task card draggable
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Allow members to be dropped on task card
  const [{ isOver }, drop] = useDrop({
    accept: 'MEMBER',
    drop: (item: { id: string }) => {
      onAssignMember(task.id, item.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Combine refs for both drag and drop
  const combinedRef = (el: HTMLDivElement | null) => {
    drag(el);
    drop(el);
  };

  const hasAssignees = task.assignees.length > 0;

  return (
    <div
      ref={combinedRef}
      className={`
        bg-white border rounded-lg p-2 transition-colors cursor-move
        ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}
        ${hasAssignees ? 'border-l-4 border-l-blue-500' : ''}
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-xs sm:text-sm text-gray-800 leading-tight">{task.title}</p>
        {hasAssignees && (
          <div className="flex -space-x-1 flex-shrink-0">
            {task.assignees.map((assigneeId, idx) => (
              <div
                key={idx}
                className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center"
              >
                <User size={10} className="text-white" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}