import { useDrop } from 'react-dnd';
import { ReactNode } from 'react';

interface ColumnDropZoneProps {
  columnId: 'todo' | 'inProgress' | 'done';
  onTaskDrop: (taskId: string, targetColumn: 'todo' | 'inProgress' | 'done') => void;
  children: ReactNode;
  title: string;
}

export function ColumnDropZone({ columnId, onTaskDrop, children, title }: ColumnDropZoneProps) {
  const [{ isOver }, drop] = useDrop({
    accept: 'TASK',
    drop: (item: { id: string }) => {
      onTaskDrop(item.id, columnId);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div className="w-full">
      <div 
        ref={drop}
        className={`
          bg-gray-100 rounded-lg p-3 flex flex-col transition-colors min-h-[80px]
          ${isOver ? 'bg-blue-100 ring-2 ring-blue-400' : ''}
        `}
      >
        <h2 className="text-sm font-medium text-gray-700 mb-2.5">{title}</h2>
        <div className="space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}