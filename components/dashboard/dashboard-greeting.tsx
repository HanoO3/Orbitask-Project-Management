'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';

export function DashboardGreeting({ userName, subtitle }: { userName: string; subtitle?: string }) {
  const [greeting, setGreeting] = useState('Good morning');
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    const updateGreetingAndDate = () => {
      const now = new Date();
      const hour = now.getHours();

      if (hour >= 5 && hour < 12) {
        setGreeting('Good Morning');
      } else if (hour >= 12 && hour < 17) {
        setGreeting('Good Afternoon');
      } else if (hour >= 17 && hour < 21) {
        setGreeting('Good Evening');
      } else {
        setGreeting('Good Night');
      }

      setFormattedDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
      );
    };

    updateGreetingAndDate();
    const interval = setInterval(updateGreetingAndDate, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          {greeting}, {userName}
        </h1>
        {subtitle && <p className="text-sm text-[#8E95AF] mt-1">{subtitle}</p>}
      </div>

      {formattedDate && (
        <div className="flex items-center gap-2 text-xs font-semibold text-[#8E95AF] bg-[#141726] border border-[#23263A] px-3.5 py-2 rounded-xl shadow-sm self-start md:self-auto">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>
      )}
    </div>
  );
}
