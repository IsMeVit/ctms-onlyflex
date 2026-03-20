"use client";

import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: string;
  maxDate?: string;
  label?: string;
  isRequired?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
  minDate,
  maxDate,
  label,
  isRequired,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
    setIsOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const result = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      result.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      result.push(new Date(year, month, day));
    }
    return result;
  }, [currentMonth]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isDateDisabled = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const isSelectedDate = (date: Date) => {
    if (!value) return false;
    return date.toISOString().split('T')[0] === value;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className={`relative flex-1 ${className}`} ref={pickerRef}>
      {label && (
        <label className="block mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">
          {label}
          {isRequired && <span className="text-red-500 mx-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-12 px-4 bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-sm font-medium text-left flex items-center justify-between focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
        >
          <span className={value ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-600'}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
          <Calendar className="w-4 h-4 text-zinc-400" />
        </button>
        {value && (
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 w-72 animate-in fade-in zoom-in-95 duration-150">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1.5 rounded-lg transition-colors text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1.5 rounded-lg transition-colors text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-[10px] font-bold uppercase tracking-tighter text-zinc-400 dark:text-zinc-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} />;
              }
              const disabled = isDateDisabled(date);
              const selected = isSelectedDate(date);
              const today = isToday(date);
              
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => !disabled && handleDateSelect(date)}
                  disabled={disabled}
                  className={`
                    aspect-square rounded-lg text-xs font-semibold transition-all flex items-center justify-center
                    ${disabled 
                      ? "text-zinc-200 dark:text-zinc-800 cursor-not-allowed" 
                      : selected
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                        : today
                          ? "border border-red-500 text-red-600 dark:text-red-400"
                          : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              handleDateSelect(today);
            }}
            className="w-full mt-4 px-4 py-2 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs text-zinc-600 dark:text-zinc-300 font-bold transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-800"
          >
            Go to Today
          </button>
        </div>
      )}
    </div>
  );
}
