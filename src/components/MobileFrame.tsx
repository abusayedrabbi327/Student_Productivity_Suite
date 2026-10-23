import { ReactNode } from 'react';

interface MobileFrameProps {
  children: ReactNode;
}

export function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      
      <div className="relative z-10">
        {/* Phone Frame with Realistic Shadow */}
        <div className="relative">
          {/* Outer Shadow Layer */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-400 to-gray-600 rounded-[3.5rem] blur-2xl opacity-40 scale-105"></div>
          
          {/* Phone Body */}
          <div className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-black rounded-[3.25rem] p-3 shadow-2xl border border-gray-700">
            {/* Camera Notch - More realistic */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-7 bg-black rounded-b-[1.5rem] z-20 flex items-center justify-center gap-2 shadow-lg">
              {/* Speaker Grill */}
              <div className="w-12 h-1 bg-gray-800 rounded-full opacity-60"></div>
              {/* Camera */}
              <div className="w-2.5 h-2.5 bg-gray-900 rounded-full ring-1 ring-gray-700"></div>
            </div>
            
            {/* Screen Bezel with subtle gradient */}
            <div className="relative bg-gradient-to-br from-gray-100 to-white rounded-[2.75rem] p-0.5 shadow-inner">
              {/* Actual Screen */}
              <div id="mobile-screen-container" className="relative bg-white rounded-[2.75rem] overflow-hidden shadow-xl" style={{ width: '375px', height: '812px' }}>
                {/* Status Bar Overlay - Realistic iOS style */}
                <div className="absolute top-0 left-0 right-0 h-11 bg-gradient-to-b from-black/5 to-transparent z-10 flex items-start justify-between px-8 pt-2.5 text-xs font-semibold text-gray-900">
                  <div>9:41</div>
                  <div className="flex items-center gap-1.5">
                    {/* Signal Icon */}
                    <svg className="w-4 h-3" viewBox="0 0 18 12" fill="currentColor">
                      <rect x="0" y="8" width="3" height="4" rx="0.5"/>
                      <rect x="5" y="5" width="3" height="7" rx="0.5"/>
                      <rect x="10" y="2" width="3" height="10" rx="0.5"/>
                      <rect x="15" y="0" width="3" height="12" rx="0.5"/>
                    </svg>
                    {/* WiFi Icon */}
                    <svg className="w-4 h-3" viewBox="0 0 16 12" fill="currentColor">
                      <path d="M8 12C8.73638 12 9.33333 11.4031 9.33333 10.6667C9.33333 9.93029 8.73638 9.33333 8 9.33333C7.26362 9.33333 6.66667 9.93029 6.66667 10.6667C6.66667 11.4031 7.26362 12 8 12ZM8 7.33333C9.59493 7.33333 11.1089 7.96381 12.2426 9.09752L11.1812 10.1589C10.4096 9.38729 9.34638 8.93333 8.2 8.93333H7.8C6.65362 8.93333 5.59043 9.38729 4.81878 10.1589L3.75736 9.09752C4.89107 7.96381 6.40507 7.33333 8 7.33333ZM8 4C10.347 4 12.5491 4.93333 14.1421 6.52628L13.0807 7.58771C11.85 6.35695 10.1725 5.6 8.4 5.6H7.6C5.82754 5.6 4.15 6.35695 2.91926 7.58771L1.85784 6.52628C3.45091 4.93333 5.653 4 8 4ZM8 0.666667C11.182 0.666667 14.1647 2.00333 16.3137 4.15228L15.2523 5.21371C13.4658 3.42724 10.9855 2.4 8.4 2.4H7.6C5.01449 2.4 2.53423 3.42724 0.747726 5.21371L-0.313701 4.15228C1.83529 2.00333 4.818 0.666667 8 0.666667Z"/>
                    </svg>
                    {/* Battery Icon */}
                    <svg className="w-6 h-3" viewBox="0 0 24 12" fill="none">
                      <rect x="0.5" y="0.5" width="18" height="11" rx="2.5" stroke="currentColor" strokeOpacity="0.35"/>
                      <rect x="2" y="2" width="15" height="8" rx="1.5" fill="currentColor"/>
                      <rect x="20" y="3.5" width="2.5" height="5" rx="1" fill="currentColor" fillOpacity="0.4"/>
                    </svg>
                  </div>
                </div>
                
                {/* App Content with safe area */}
                <div className="size-full overflow-auto">
                  {children}
                </div>
                
                {/* Portal container for modals/sheets to render within phone */}
                <div id="mobile-portal-container"></div>
              </div>
            </div>
            
            {/* Home Indicator Bar - iOS style */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-1.5 bg-white/80 rounded-full shadow-sm"></div>
          </div>
          
          {/* Side Buttons - More visible and realistic */}
          {/* Power Button */}
          <div className="absolute -right-[2px] top-32 w-1 h-20 bg-gray-900 rounded-r-lg border-r border-gray-700 shadow-md"></div>
          
          {/* Volume Up */}
          <div className="absolute -left-[2px] top-28 w-1 h-12 bg-gray-900 rounded-l-lg border-l border-gray-700 shadow-md"></div>
          {/* Volume Down */}
          <div className="absolute -left-[2px] top-44 w-1 h-12 bg-gray-900 rounded-l-lg border-l border-gray-700 shadow-md"></div>
          
          {/* Silent Switch */}
          <div className="absolute -left-[2px] top-20 w-1 h-7 bg-gray-900 rounded-l-lg border-l border-gray-700 shadow-md"></div>
        </div>
      </div>
      
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}