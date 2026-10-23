import { X, GraduationCap, Check } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

interface Teacher {
  id: string;
  name: string;
  course: string;
  email: string;
}

interface GrantTeacherAccessModalProps {
  onClose: () => void;
  onGrantAccess: (teacherId: string) => void;
  groupName: string;
}

export function GrantTeacherAccessModal({ onClose, onGrantAccess, groupName }: GrantTeacherAccessModalProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

  // Mock teachers from UIU
  const teachers: Teacher[] = [
    {
      id: '1',
      name: 'Dr. Sarah Ahmed',
      course: 'Human-Computer Interaction',
      email: 's.ahmed@uiu.ac.bd',
    },
    {
      id: '2',
      name: 'Prof. Mohammad Rahman',
      course: 'Web Development',
      email: 'm.rahman@uiu.ac.bd',
    },
    {
      id: '3',
      name: 'Dr. Lisa Wang',
      course: 'Artificial Intelligence',
      email: 'l.wang@uiu.ac.bd',
    },
    {
      id: '4',
      name: 'Prof. James Smith',
      course: 'Software Engineering',
      email: 'j.smith@uiu.ac.bd',
    },
  ];

  const handleGrant = () => {
    if (selectedTeacher) {
      const teacher = teachers.find(t => t.id === selectedTeacher);
      onGrantAccess(selectedTeacher);
      toast.success(`Access granted to ${teacher?.name}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 sm:p-6 text-white flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 flex-shrink-0">
                <GraduationCap size={20} className="sm:size-[24px]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-2xl font-bold truncate">Grant Teacher Access</h3>
                <p className="text-blue-100 text-xs sm:text-sm mt-0.5 truncate">
                  Allow teacher to monitor {groupName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors flex-shrink-0 ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <p className="text-sm text-gray-600 mb-4">
            Select a teacher to give them access to view your team's progress and send feedback.
          </p>

          <div className="space-y-3">
            {teachers.map((teacher) => (
              <button
                key={teacher.id}
                onClick={() => setSelectedTeacher(teacher.id)}
                className={`
                  w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                  ${selectedTeacher === teacher.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 active:scale-[0.98]'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">{teacher.name}</h4>
                      {selectedTeacher === teacher.id && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{teacher.course}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">{teacher.email}</p>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 text-sm sm:text-base">
                    {teacher.name.split(' ')[1][0]}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 sm:p-5 bg-gray-50 flex gap-3 flex-shrink-0 safe-area-inset-bottom">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11 sm:h-12 font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGrant}
            disabled={!selectedTeacher}
            className="flex-1 h-11 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Grant Access
          </Button>
        </div>
      </div>
    </div>
  );
}