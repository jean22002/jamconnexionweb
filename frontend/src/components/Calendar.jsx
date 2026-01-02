import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

const Calendar = ({ currentMonth, onMonthChange, onDateClick, bookedDates }) => {
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isDateBooked = (dateStr) => {
    return bookedDates.includes(dateStr);
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="aspect-square"></div>);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    const isBooked = isDateBooked(dateStr);
    const isPast = isPastDate(date);
    const isToday = new Date().toDateString() === date.toDateString();
    
    calendarDays.push(
      <button
        key={day}
        onClick={() => !isPast && !isBooked && onDateClick(date)}
        disabled={isPast || isBooked}
        className={`
          aspect-square p-2 rounded-lg font-semibold transition-all
          ${
            isBooked
              ? 'bg-red-500/20 text-red-400 border-2 border-red-500/40 cursor-not-allowed'
              : isPast
              ? 'bg-muted/20 text-muted-foreground cursor-not-allowed opacity-40'
              : 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/40 hover:bg-blue-500/30 hover:border-blue-500/60 cursor-pointer'
          }
          ${
            isToday && !isBooked
              ? 'ring-2 ring-primary'
              : ''
          }
        `}
      >
        <div className="text-center">
          <div className="text-lg">{day}</div>
          <div className="text-[10px] mt-1 font-normal">
            {isBooked ? 'Réservé' : isPast ? '' : 'Libre'}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="glassmorphism rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={handlePrevMonth}
          variant="outline"
          size="sm"
          className="rounded-full"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <h3 className="font-heading font-bold text-xl">
          {monthNames[month]} {year}
        </h3>
        
        <Button
          onClick={handleNextMonth}
          variant="outline"
          size="sm"
          className="rounded-full"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500/20 border-2 border-blue-500/40"></div>
          <span>Libre</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/20 border-2 border-red-500/40"></div>
          <span>Réservé</span>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays}
      </div>
    </div>
  );
};

export default Calendar;
