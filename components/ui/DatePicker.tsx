// (Removed duplicate and misplaced code. Imports should be at the top, only one DatePicker function should exist.)
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty slots for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

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

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      {label && (
        <label className="block mb-2 font-semibold text-zinc-200">
          {label}
          {isRequired && <span className="text-red-500 mx-1">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-left flex items-center justify-between"
      >
        <span className={value ? '' : 'text-zinc-500'}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <Calendar className="w-5 h-5 text-zinc-500" />
      </button>
      {isOpen && pickerRef.current && createPortal(
        <div
          className="bg-[#18181c] border border-zinc-800 rounded-xl shadow-2xl p-4 w-80 z-[100]"
          style={{
            position: 'absolute',
            top: pickerRef.current.getBoundingClientRect().bottom + window.scrollY,
            left: pickerRef.current.getBoundingClientRect().left + window.scrollX,
          }}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg transition-colors text-white hover:bg-zinc-700"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="font-bold text-white text-lg">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg transition-colors text-white hover:bg-zinc-700"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          {/* Week Days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-zinc-400 py-2">
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
              let dayClass = "aspect-square rounded-lg text-sm font-medium transition-all text-white";
              if (disabled) dayClass += " text-zinc-700 cursor-not-allowed";
              else dayClass += " hover:bg-zinc-700";
              if (selected) dayClass += " bg-red-500 text-white rounded-xl";
              if (today && !selected) dayClass += " border border-red-500 text-white";
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => !disabled && handleDateSelect(date)}
                  disabled={disabled}
                  className={dayClass}
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
            className="w-full mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-white font-medium transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
