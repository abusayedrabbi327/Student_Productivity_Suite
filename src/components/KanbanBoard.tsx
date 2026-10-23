import { Plus, UserPlus, X, FolderPlus, MoreVertical, Edit2, Trash2, GraduationCap } from 'lucide-react';
import { TaskCard, Task } from './TaskCard';
import { MemberAvatar, Member } from './MemberAvatar';
import { ColumnDropZone } from './ColumnDropZone';
import { Button } from './ui/button';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GrantTeacherAccessModal } from './GrantTeacherAccessModal';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface Project {
  id: string;
  name: string;
  members: Member[];
  tasks: {
    todo: Task[];
    inProgress: Task[];
    done: Task[];
  };
}

interface KanbanBoardProps {
  projectName: string;
  tasks: {
    todo: Task[];
    inProgress: Task[];
    done: Task[];
  };
  members: Member[];
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  onAddProject: () => void;
  onRenameProject: () => void;
  onDeleteProject: () => void;
  onAssignMember: (taskId: string, memberId: string) => void;
  onMoveTask: (taskId: string, targetColumn: 'todo' | 'inProgress' | 'done') => void;
  onAddTask: () => void;
  onAddMember?: () => void;
  onRemoveMember?: (memberId: string) => void;
}

export function KanbanBoard({ 
  projectName, 
  tasks, 
  members, 
  projects,
  selectedProjectId,
  onSelectProject,
  onAddProject,
  onRenameProject,
  onDeleteProject,
  onAssignMember,
  onMoveTask,
  onAddTask,
  onAddMember,
  onRemoveMember 
}: KanbanBoardProps) {
  const [isGrantTeacherAccessModalOpen, setGrantTeacherAccessModalOpen] = useState(false);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white">
        {/* Project Selector */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`
                  px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap
                  ${selectedProjectId === project.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {project.name}
              </button>
            ))}
            <Button
              onClick={onAddProject}
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs flex-shrink-0 text-gray-600 hover:text-blue-600"
            >
              <FolderPlus size={16} />
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-3 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl text-gray-800">{projectName}</h1>
          <div className="flex items-center gap-2">
            <Button
              onClick={onAddTask}
              size="icon"
              variant="outline"
              className="rounded-full h-9 w-9"
            >
              <Plus size={18} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full h-9 w-9"
                >
                  <MoreVertical size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onRenameProject}>
                  <Edit2 size={14} className="mr-2" />
                  Rename Project
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onDeleteProject}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete Project
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setGrantTeacherAccessModalOpen(true)}
                >
                  <GraduationCap size={14} className="mr-2" />
                  Grant Teacher Access
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Team Dock - Horizontal on Mobile */}
        <div className="bg-white border-b border-gray-200 p-2.5">
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="text-xs text-gray-500 font-medium pr-2 flex-shrink-0">Team:</div>
            <div className="flex gap-2 items-center">
              {members.map((member) => (
                <div key={member.id} className="relative group flex-shrink-0">
                  <MemberAvatar member={member} />
                  {onRemoveMember && member.name !== 'You' && (
                    <button
                      onClick={() => onRemoveMember(member.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      title={`Remove ${member.name}`}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
              {onAddMember && (
                <Button
                  onClick={onAddMember}
                  size="icon"
                  variant="outline"
                  className="rounded-full h-10 w-10 flex-shrink-0 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                  title="Add team member"
                >
                  <UserPlus size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Board Area - Vertical Columns on Mobile */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex flex-col gap-3 pb-4">
            {/* To Do Column */}
            <ColumnDropZone columnId="todo" onTaskDrop={onMoveTask} title="To Do">
              {tasks.todo.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAssignMember={onAssignMember}
                />
              ))}
            </ColumnDropZone>

            {/* In Progress Column */}
            <ColumnDropZone columnId="inProgress" onTaskDrop={onMoveTask} title="In Progress">
              {tasks.inProgress.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAssignMember={onAssignMember}
                />
              ))}
            </ColumnDropZone>

            {/* Done Column */}
            <ColumnDropZone columnId="done" onTaskDrop={onMoveTask} title="Done">
              {tasks.done.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAssignMember={onAssignMember}
                />
              ))}
            </ColumnDropZone>
          </div>
        </div>
      </div>
      {isGrantTeacherAccessModalOpen && (
        <GrantTeacherAccessModal
          groupName={projectName}
          onClose={() => setGrantTeacherAccessModalOpen(false)}
          onGrantAccess={(teacherId) => {
            console.log('Teacher access granted:', teacherId);
            setGrantTeacherAccessModalOpen(false);
          }}
        />
      )}
    </DndProvider>
  );
}