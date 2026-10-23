import { useState, useRef, useEffect } from 'react';

interface CircularDialProps {
  value: number; // in minutes
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function CircularDial({ value, onChange, min = 5, max = 60 }: CircularDialProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);

  const radius = 80;
  const centerX = 110;
  const centerY = 110;

  // Convert minutes to angle (0° at top, clockwise)
  // 0 minutes = -90° (top), 60 minutes = 270° (back to top after full circle)
  const minutesToAngle = (minutes: number) => {
    const normalized = minutes / max; // 0 to 1
    return normalized * 360 - 90; // -90 to start at top, goes clockwise
  };

  // Convert angle to minutes with 5-minute intervals
  const angleToMinutes = (angle: number) => {
    let normalized = (angle + 90) / 360;
    
    // Handle wrap-around for negative angles
    if (normalized < 0) {
      normalized = normalized + 1;
    }
    if (normalized > 1) {
      normalized = normalized - 1;
    }
    
    // Calculate minutes and snap to 5-minute intervals
    const minutes = normalized * max;
    const snappedMinutes = Math.round(minutes / 5) * 5;
    
    // Ensure we stay within bounds and handle 0/60
    if (snappedMinutes === 0) {
      return min; // Snap 0 to minimum (5)
    }
    
    return Math.max(min, Math.min(max, snappedMinutes));
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging || !dialRef.current) return;

    const rect = dialRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    const normalizedAngle = (angle + 360) % 360;
    
    onChange(angleToMinutes(normalizedAngle));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, value]);

  const angle = minutesToAngle(value);
  const markerX = centerX + radius * Math.cos((angle * Math.PI) / 180);
  const markerY = centerY + radius * Math.sin((angle * Math.PI) / 180);

  // Time markers - positioned based on actual angle calculations
  const timeValues = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
  const markers = timeValues.map(time => ({
    time,
    label: `${time}m`,
    angle: minutesToAngle(time),
  }));

  return (
    <div className="flex items-center justify-center">
      <div
        ref={dialRef}
        className="relative"
        style={{ width: '220px', height: '220px' }}
      >
        {/* Main circle */}
        <svg width="220" height="220" className="absolute inset-0">
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="3"
          />
          
          {/* Pointer line */}
          <line
            x1={centerX}
            y1={centerY}
            x2={markerX}
            y2={markerY}
            stroke="#374151"
            strokeWidth="2"
          />
          
          {/* Draggable marker */}
          <circle
            cx={markerX}
            cy={markerY}
            r="12"
            fill="#374151"
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={() => setIsDragging(true)}
            style={{ touchAction: 'none' }}
          />
          <circle
            cx={markerX}
            cy={markerY}
            r="6"
            fill="white"
            className="pointer-events-none"
          />
        </svg>

        {/* Center time display */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-3xl sm:text-4xl font-light text-gray-700">{value}m</div>
        </div>

        {/* Time markers */}
        {markers.map((marker) => {
          const x = centerX + (radius + 22) * Math.cos((marker.angle * Math.PI) / 180);
          const y = centerY + (radius + 22) * Math.sin((marker.angle * Math.PI) / 180);
          return (
            <div
              key={marker.time}
              className="absolute text-xs text-gray-500 pointer-events-none font-medium"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {marker.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}