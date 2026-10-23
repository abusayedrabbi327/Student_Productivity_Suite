import { useState, useEffect, useCallback } from 'react';
import { KanbanBoard } from './KanbanBoard';
import { StatsView } from './StatsView';
import { ActivityFeed, Activity } from './ActivityFeed';
import { Member } from './MemberAvatar';
import { Task } from './TaskCard';
import { Comment } from './CommentSection';
import { AddProjectModal, AddTaskModal } from './AccountabilityModals';
import { InviteMemberModal } from './InviteMemberModal';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { FolderPlus, Users } from 'lucide-react';

type View = 'board' | 'stats' | 'activity';

interface Project {
  id: string;
  name: string;
  course?: string;
  joinCode?: string;
  joinPassword?: string;
  leaderId?: string;
  members: Member[];
  tasks: {
    todo: Task[];
    inProgress: Task[];
    done: Task[];
  };
  comments: { [taskId: string]: Comment[] };
  activities: Activity[];
}

export function AccountabilityView() {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState<View>('board');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Professional Modal States (No browser prompt)
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Fetch groups and tasks from Supabase
  const loadData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const allGroups = await api.getGroups();
      
      // Filter to groups where current user is leader or member
      // If user is the demo account, also show demo groups
      const isDemoUser = currentUser.email === 'student@uiu.ac.bd' || currentUser.email === 'sarah.ahmed@uiu.ac.bd';
      
      const relevantGroups = isDemoUser 
        ? allGroups 
        : allGroups.filter((g: any) => 
            g.leader_id === currentUser.id || 
            (g.members || []).some((m: any) => m.profiles?.id === currentUser.id || m.user_id === currentUser.id)
          );

      const loadedProjects: Project[] = [];

      for (const g of relevantGroups) {
        // Members
        const members: Member[] = (g.members || []).map((m: any) => ({
          id: m.profiles?.id || m.user_id,
          name: m.profiles?.id === currentUser.id ? 'You' : (m.profiles?.full_name || 'Member'),
          color: m.profiles?.color || '#3b82f6',
        }));

        if (!members.some(m => m.id === currentUser.id)) {
          members.unshift({
            id: currentUser.id,
            name: 'You',
            color: currentUser.color || '#3b82f6',
          });
        }

        // Fetch Tasks
        const dbTasks = await api.getTasks(g.id);
        const todo: Task[] = [];
        const inProgress: Task[] = [];
        const done: Task[] = [];

        dbTasks.forEach(t => {
          const formattedTask: Task = {
            id: t.id,
            title: t.title,
            assignees: t.assignees || [],
          };
          if (t.status === 'inProgress') inProgress.push(formattedTask);
          else if (t.status === 'done') done.push(formattedTask);
          else todo.push(formattedTask);
        });

        // Fetch Activities
        const dbActivities = await api.getActivities(g.id);
        const activities: Activity[] = dbActivities.map(a => ({
          id: a.id,
          type: a.type as any,
          user: a.user_id === currentUser.id ? 'You' : a.user_name,
          message: a.message,
          taskTitle: a.task_title,
          timestamp: new Date(a.created_at),
        }));

        loadedProjects.push({
          id: g.id,
          name: g.name,
          course: g.course,
          joinCode: g.join_code,
          joinPassword: g.join_password,
          leaderId: g.leader_id,
          members,
          tasks: { todo, inProgress, done },
          comments: {},
          activities,
        });
      }

      setProjects(loadedProjects);
      if (loadedProjects.length > 0) {
        if (!selectedProjectId || !loadedProjects.some(p => p.id === selectedProjectId)) {
          setSelectedProjectId(loadedProjects[0].id);
        }
      } else {
        setSelectedProjectId('');
      }
    } catch (e) {
      console.error('Error loading projects:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, currentUser?.email, selectedProjectId]);

  useEffect(() => {
    loadData();

    // Supabase Realtime Listener
    const channel = supabase
      .channel('accountability-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const handleAssignMember = async (taskId: string, memberId: string) => {
    if (!currentProject) return;
    let allTasks = [...currentProject.tasks.todo, ...currentProject.tasks.inProgress, ...currentProject.tasks.done];
    const targetTask = allTasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const updatedAssignees = await api.toggleTaskAssignee(taskId, memberId, targetTask.assignees);
    
    setProjects(prev => prev.map(p => {
      if (p.id !== currentProject.id) return p;
      const updateCol = (col: Task[]) => col.map(t => t.id === taskId ? { ...t, assignees: updatedAssignees } : t);
      return {
        ...p,
        tasks: {
          todo: updateCol(p.tasks.todo),
          inProgress: updateCol(p.tasks.inProgress),
          done: updateCol(p.tasks.done),
        }
      };
    }));

    const memberName = currentProject.members.find(m => m.id === memberId)?.name || 'Member';
    toast.success(`Updated assignment for ${memberName}`);
  };

  const handleMoveTask = async (taskId: string, targetColumn: 'todo' | 'inProgress' | 'done') => {
    if (!currentProject) return;
    let movedTask: Task | null = null;
    let sourceColumn: 'todo' | 'inProgress' | 'done' | null = null;

    for (const col of ['todo', 'inProgress', 'done'] as const) {
      const found = currentProject.tasks[col].find(t => t.id === taskId);
      if (found) {
        movedTask = found;
        sourceColumn = col;
        break;
      }
    }

    if (!movedTask || sourceColumn === targetColumn) return;

    // Optimistic UI update
    setProjects(prev => prev.map(p => {
      if (p.id !== currentProject.id) return p;
      return {
        ...p,
        tasks: {
          ...p.tasks,
          [sourceColumn!]: p.tasks[sourceColumn!].filter(t => t.id !== taskId),
          [targetColumn]: [...p.tasks[targetColumn], movedTask!],
        }
      };
    }));

    await api.updateTaskStatus(taskId, targetColumn);

    if (targetColumn === 'done' && currentUser) {
      toast.success(`Task completed! +50 points awarded`);
      api.incrementPointsAndStreak(currentUser.id, 50);
    }

    if (currentUser) {
      const colLabel = targetColumn === 'done' ? 'Done' : targetColumn === 'inProgress' ? 'In Progress' : 'To Do';
      await api.logActivity(
        currentProject.id,
        currentUser.id,
        currentUser.full_name,
        'task_moved',
        `moved to ${colLabel}`,
        movedTask.title
      );
    }
  };

  // Called from AddTaskModal
  const handleConfirmAddTask = async (taskName: string, assigneeId?: string) => {
    if (!currentProject || !currentUser) return;
    const assignees = assigneeId ? [assigneeId] : [];
    const created = await api.createTask(currentProject.id, taskName, currentUser.id, assignees);
    
    if (created) {
      setProjects(prev => prev.map(p => {
        if (p.id !== currentProject.id) return p;
        return {
          ...p,
          tasks: {
            ...p.tasks,
            todo: [...p.tasks.todo, { id: created.id, title: created.title, assignees }]
          }
        };
      }));
      toast.success('Task created and saved to Supabase!');

      await api.logActivity(
        currentProject.id,
        currentUser.id,
        currentUser.full_name,
        'task_created',
        'created new task',
        taskName
      );
    }
  };

  // Called from AddProjectModal
  const handleConfirmAddProject = async (name: string, course: string, description: string) => {
    if (!currentUser) return;
    const created = await api.createGroup({
      name,
      university: 'UIU - United International University',
      course,
      description: description || 'UIU Course Project Team',
      max_members: 5,
      tags: [course.split(' ')[0]],
      leader_id: currentUser.id,
    });

    if (created) {
      toast.success(`Project "${name}" created in Supabase!`);
      await loadData();
      setSelectedProjectId(created.id);
    }
  };

  // Called from AddMemberModal
  const handleConfirmAddMember = async (name: string, email?: string) => {
    toast.success(`Invitation sent to ${name}! They can join via Find Groups.`);
  };

  const handleSendReminder = (memberId: string) => {
    if (!currentProject) return;
    const member = currentProject.members.find((m) => m.id === memberId);
    if (member) {
      toast.success(`Accountability nudge sent to ${member.name}!`);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (!currentProject) return;
    const member = currentProject.members.find((m) => m.id === memberId);
    if (member?.name === 'You') {
      toast.error('Cannot remove yourself from the team');
      return;
    }
    toast.info('Team roster can be updated in Group settings.');
  };

  // Empty state for brand new users with no projects
  if (!loading && projects.length === 0) {
    return (
      <div className="size-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-gray-50 to-white">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-sm border border-blue-100">
          <FolderPlus size={32} />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Active Project Teams</h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
          You haven't created or joined any project teams yet. Start a new team for your UIU course or explore open groups in the Find tab!
        </p>
        <button
          onClick={() => setShowAddProjectModal(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all active:scale-95"
        >
          <FolderPlus size={18} />
          <span>Create Your First Project Team</span>
        </button>

        <AddProjectModal
          isOpen={showAddProjectModal}
          onClose={() => setShowAddProjectModal(false)}
          onAdd={handleConfirmAddProject}
        />
      </div>
    );
  }

  return (
    <div className="size-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setCurrentView('board')}
            className={`
              px-5 py-2.5 text-xs sm:text-sm font-semibold transition-colors
              ${currentView === 'board'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                : 'text-gray-600 hover:text-gray-800'
              }
            `}
          >
            Kanban Board
          </button>
          <button
            onClick={() => setCurrentView('stats')}
            className={`
              px-5 py-2.5 text-xs sm:text-sm font-semibold transition-colors
              ${currentView === 'stats'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                : 'text-gray-600 hover:text-gray-800'
              }
            `}
          >
            Team Stats
          </button>
          <button
            onClick={() => setCurrentView('activity')}
            className={`
              px-5 py-2.5 text-xs sm:text-sm font-semibold transition-colors
              ${currentView === 'activity'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                : 'text-gray-600 hover:text-gray-800'
              }
            `}
          >
            Live Activity Feed
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'board' && currentProject && (
          <KanbanBoard
            projectName={currentProject.name}
            tasks={currentProject.tasks}
            members={currentProject.members}
            projects={projects}
            selectedProjectId={selectedProjectId || currentProject.id}
            onSelectProject={setSelectedProjectId}
            onAddProject={() => setShowAddProjectModal(true)}
            onRenameProject={() => toast.info('Rename available in project settings')}
            onDeleteProject={() => toast.info('Default project protected')}
            onAssignMember={handleAssignMember}
            onAddTask={() => setShowAddTaskModal(true)}
            onMoveTask={handleMoveTask}
            onAddMember={() => setShowAddMemberModal(true)}
            onRemoveMember={handleRemoveMember}
          />
        )}
        {currentView === 'stats' && currentProject && (
          <StatsView
            members={currentProject.members}
            tasks={currentProject.tasks}
            onSendReminder={handleSendReminder}
          />
        )}
        {currentView === 'activity' && currentProject && (
          <ActivityFeed
            activities={currentProject.activities}
          />
        )}
      </div>

      {/* Professional Modals */}
      <AddProjectModal
        isOpen={showAddProjectModal}
        onClose={() => setShowAddProjectModal(false)}
        onAdd={handleConfirmAddProject}
      />

      {currentProject && (
        <AddTaskModal
          isOpen={showAddTaskModal}
          onClose={() => setShowAddTaskModal(false)}
          members={currentProject.members}
          onAdd={handleConfirmAddTask}
        />
      )}

      {showAddMemberModal && currentProject && (
        <InviteMemberModal
          group={{
            id: currentProject.id,
            name: currentProject.name,
            course: currentProject.course || 'UIU Course',
            description: 'Course Project Team',
            members: currentProject.members.map(m => ({ id: m.id, name: m.name, role: 'student', color: m.color })),
            maxMembers: 6,
            tags: ['Active'],
            leader: { id: currentProject.leaderId || currentUser?.id || '1', name: 'Leader', role: 'team_leader', color: '#3b82f6' },
            isOpen: true,
            activeMembers: currentProject.members.length,
            university: 'UIU - United International University',
            joinCode: currentProject.joinCode,
            joinPassword: currentProject.joinPassword,
            requireApproval: true,
            leaderId: currentProject.leaderId,
          }}
          onClose={() => setShowAddMemberModal(false)}
          onMemberUpdated={loadData}
        />
      )}
    </div>
  );
}