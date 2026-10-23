import { useDrag } from 'react-dnd';

export interface Member {
  id: string;
  name: string;
  color: string;
}

interface MemberAvatarProps {
  member: Member;
}

export function MemberAvatar({ member }: MemberAvatarProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'MEMBER',
    item: { id: member.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`
        w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium cursor-grab
        ${isDragging ? 'opacity-50 cursor-grabbing' : ''}
        shadow-md
      `}
      style={{ backgroundColor: member.color }}
      title={member.name}
    >
      {member.name.substring(0, 2).toUpperCase()}
    </div>
  );
}