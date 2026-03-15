import { Clock } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
  format?: '12' | '24';
  minuteStep?: number;
}

export function TimePicker({ 
  value, 
  onChange, 
  placeholder = 'Select time',
  className = '',
  format = '12',
  minuteStep = 15
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      setSelectedMinute(minutes);
      
      if (format === '12') {
        const hour12 = hours % 12 || 12;
        setSelectedHour(hour12);
        setPeriod(hours >= 12 ? 'PM' : 'AM');
      } else {
        setSelectedHour(hours);
      }
    }
  }, [value, format]);

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    if (format === '12') {
      const hour12 = hours % 12 || 12;
      const period = hours >= 12 ? 'PM' : 'AM';
      return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
    }
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleTimeSelect = (hour: number, minute: number, per?: 'AM' | 'PM') => {
    let hour24 = hour;
    
    if (format === '12') {
      const currentPeriod = per || period;
      if (currentPeriod === 'PM' && hour !== 12) {
        hour24 = hour + 12;
      } else if (currentPeriod === 'AM' && hour === 12) {
        hour24 = 0;
      }
    }
    
    const timeStr = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onChange(timeStr);
  };

  const handleHourClick = (hour: number) => {
    setSelectedHour(hour);
    if (selectedMinute !== null) {
      handleTimeSelect(hour, selectedMinute);
    }
  };

  const handleMinuteClick = (minute: number) => {
    setSelectedMinute(minute);
    if (selectedHour !== null) {
      handleTimeSelect(selectedHour, minute);
    }
  };

  const handlePeriodToggle = () => {
    const newPeriod = period === 'AM' ? 'PM' : 'AM';
    setPeriod(newPeriod);
    if (selectedHour !== null && selectedMinute !== null) {
      handleTimeSelect(selectedHour, selectedMinute, newPeriod);
    }
  };

  const hours = format === '12' 
    ? Array.from({ length: 12 }, (_, i) => i + 1)
    : Array.from({ length: 24 }, (_, i) => i);

  const minutes = Array.from({ length: 60 / minuteStep }, (_, i) => i * minuteStep);

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-left flex items-center justify-between"
      >
        <span className={value ? '' : 'text-zinc-500'}>
          {value ? formatDisplayTime(value) : placeholder}
        </span>
        <Clock className="w-5 h-5 text-zinc-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 z-50 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 w-72">
          <div className="flex gap-4">
            {/* Hours */}
            <div className="flex-1">
              <div className="text-xs font-medium text-zinc-400 mb-2 text-center">
                {format === '12' ? 'Hour' : 'Hours'}
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                {hours.map(hour => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleHourClick(hour)}
                    className={`
                      w-full px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${selectedHour === hour
                        ? 'bg-gradient-to-r from-red-500 to-red-700 text-white'
                        : 'hover:bg-zinc-800'
                      }
                    `}
                  >
                    {format === '24' ? String(hour).padStart(2, '0') : hour}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex-1">
              <div className="text-xs font-medium text-zinc-400 mb-2 text-center">Minutes</div>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                {minutes.map(minute => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => handleMinuteClick(minute)}
                    className={`
                      w-full px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${selectedMinute === minute
                        ? 'bg-gradient-to-r from-red-500 to-red-700 text-white'
                        : 'hover:bg-zinc-800'
                      }
                    `}
                  >
                    {String(minute).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* AM/PM for 12-hour format */}
            {format === '12' && (
              <div className="w-16">
                <div className="text-xs font-medium text-zinc-400 mb-2 text-center">Period</div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPeriod('AM');
                      if (selectedHour !== null && selectedMinute !== null) {
                        handleTimeSelect(selectedHour, selectedMinute, 'AM');
                      }
                    }}
                    className={`
                      w-full px-2 py-2 rounded-lg text-sm font-medium transition-all
                      ${period === 'AM'
                        ? 'bg-gradient-to-r from-red-500 to-red-700 text-white'
                        : 'hover:bg-zinc-800'
                      }
                    `}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPeriod('PM');
                      if (selectedHour !== null && selectedMinute !== null) {
                        handleTimeSelect(selectedHour, selectedMinute, 'PM');
                      }
                    }}
                    className={`
                      w-full px-2 py-2 rounded-lg text-sm font-medium transition-all
                      ${period === 'PM'
                        ? 'bg-gradient-to-r from-red-500 to-red-700 text-white'
                        : 'hover:bg-zinc-800'
                      }
                    `}
                  >
                    PM
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Time Buttons */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="text-xs font-medium text-zinc-400 mb-2">Quick Select</div>
            <div className="grid grid-cols-3 gap-2">
              {format === '12' ? (
                <>
                  <button
                    type="button"
                    onClick={() => onChange('09:00')}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    9:00 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange('12:00')}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    12:00 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange('18:00')}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    6:00 PM
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onChange('09:00')}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    09:00
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange('12:00')}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    12:00
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange('18:00')}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    18:00
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
