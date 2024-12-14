import { useEffect, useState } from 'react';
import { formatDuration, intervalToDuration } from 'date-fns';

interface TimeRemainingProps {
  endTime: number;
  onComplete?: () => void;
  isEditing?: boolean;
  onTimeChange?: (newTime: number) => void;
}

export function TimeRemaining({ endTime, onComplete, isEditing, onTimeChange }: TimeRemainingProps) {
  const [timeLeft, setTimeLeft] = useState(endTime - Date.now());

  useEffect(() => {
    if (isEditing) return;

    const timer = setInterval(() => {
      const newTimeLeft = endTime - Date.now();
      if (newTimeLeft <= 0) {
        clearInterval(timer);
        onComplete?.();
      }
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onComplete, isEditing]);

  if (isEditing) {
    return (
      <div className="flex gap-2">
        <select
          className="bg-[#2a303c] border border-gray-700 rounded px-2 py-1 text-sm"
          value={Math.floor(timeLeft / (24 * 60 * 60 * 1000))}
          onChange={(e) => {
            const days = parseInt(e.target.value);
            const newTime = days * 24 * 60 * 60 * 1000;
            onTimeChange?.(newTime);
          }}
        >
          {[...Array(31)].map((_, i) => (
            <option key={i} value={i}>
              {i} days
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (timeLeft <= 0) {
    return <span className="text-green-500">Completed</span>;
  }

  const duration = intervalToDuration({ start: Date.now(), end: endTime });
  const formattedDuration = formatDuration(duration, {
    format: ['days', 'hours', 'minutes'],
    zero: false,
  });

  return <span className="text-blue-500">{formattedDuration}</span>;
}