'use client';

import { useEffect, useState } from 'react';
import { useSocketStore } from '@/lib/socket';
import { Clock } from 'lucide-react';

export default function RoomTimer() {
  const { expiresAt, updatedAt, inactivityTtl, setTtl, setExpired } = useSocketStore();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt || !updatedAt) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const INACTIVITY = (inactivityTtl || 3600) * 1000;
      const validUntil = Math.min(expiresAt, updatedAt + INACTIVITY);
      const remaining = Math.max(0, validUntil - Date.now());
      return remaining;
    };

    const initialRemaining = calculateTimeLeft();
    if (initialRemaining === 0) {
      setExpired();
    }
    setTimeLeft(initialRemaining);

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      if (remaining === 0) {
        setExpired();
      }
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, updatedAt, inactivityTtl, setExpired]);

  if (timeLeft === null) return null;

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const formattedTime = hours > 0 
    ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isWarning = timeLeft < 5 * 60 * 1000; // less than 5 minutes
  const currentTtlHours = inactivityTtl ? Math.round(inactivityTtl / 3600) : 1;

  return (
    <div className="relative" title="Change room expiry time">
      <select
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        value={currentTtlHours}
        onChange={(e) => setTtl(Number(e.target.value))}
      >
        <option value={1}>1 Hour</option>
        <option value={5}>5 Hours</option>
        <option value={15}>15 Hours</option>
        <option value={24}>24 Hours</option>
      </select>

      <div 
        className={`flex items-center gap-2 select-none text-sm md:text-lg font-bold uppercase brutal-border px-3 py-1.5 shrink-0 transition-colors ${
          isWarning ? 'bg-destructive text-destructive-foreground brutal-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]' : 'bg-white text-black brutal-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]'
        }`}
      >
        <Clock className="w-4 h-4 md:w-5 md:h-5" />
        <span className="font-mono tabular-nums text-center min-w-[60px] md:min-w-[70px]">
          {formattedTime}
        </span>
      </div>
    </div>
  );
}
