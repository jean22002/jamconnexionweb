import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

const Calendar = ({ currentMonth, onMonthChange, onDateClick, bookedDates, eventsByDate = {}, concerts = [], jams = [], planningSlots = [] }) => {
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
    const eventType = eventsByDate[dateStr]; // 'concert', 'jam', ou undefined
    const isPast = isPastDate(date);
    const isToday = new Date().toDateString() === date.toDateString();
    
    // Trouver le concert correspondant à cette date pour afficher les groupes
    const concert = concerts.find(c => c.date === dateStr);
    const jam = jams.find(j => j.date === dateStr);
    const planningSlot = planningSlots.find(p => p.date === dateStr);
    
    // Calculer le nombre total de membres pour les concerts
    let totalMembers = 0;
    if (concert && concert.bands) {
      totalMembers = concert.bands.reduce((sum, band) => sum + (band.members_count || 0), 0);
    }
    
    // Vérifier si le créneau a des candidatures acceptées
    const hasAcceptedApplications = planningSlot && planningSlot.accepted_bands_count > 0;
    const isSlotComplete = planningSlot && !planningSlot.is_open && planningSlot.accepted_bands_count >= planningSlot.num_bands_needed;
    const isOpenSlot = planningSlot && planningSlot.is_open && !hasAcceptedApplications;
    
    // Définir les couleurs selon le type d'événement
    let colorClasses = '';
    let label = '';
    let eventInfo = '';
    
    if (isSlotComplete) {
      // Rouge pour les créneaux complets avec toutes les candidatures acceptées
      colorClasses = 'bg-red-500/20 text-red-400 border-2 border-red-500/40 hover:bg-red-500/30 cursor-pointer';
      label = 'Complet';
      eventInfo = `${planningSlot.accepted_bands_count}/${planningSlot.num_bands_needed} groupes`;
    } else if (hasAcceptedApplications) {
      // Orange pour les créneaux partiellement remplis
      colorClasses = 'bg-orange-500/20 text-orange-400 border-2 border-orange-500/40 hover:bg-orange-500/30 cursor-pointer';
      label = 'En cours';
      eventInfo = `${planningSlot.accepted_bands_count}/${planningSlot.num_bands_needed} groupes`;
    } else if (isOpenSlot) {
      // Jaune pour les créneaux ouverts sans candidature
      colorClasses = 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 hover:bg-yellow-500/30 cursor-pointer';
      label = 'Ouvert';
      eventInfo = `0/${planningSlot.num_bands_needed} groupe${planningSlot.num_bands_needed > 1 ? 's' : ''}`;
    } else if (eventType === 'concert') {
      // Vert pour les concerts - maintenant cliquable
      colorClasses = 'bg-green-500/20 text-green-400 border-2 border-green-500/40 hover:bg-green-500/30 cursor-pointer';
      label = 'Concert';
      // Afficher les noms des groupes
      if (concert && concert.bands && concert.bands.length > 0) {
        const bandNames = concert.bands.map(b => b.name).join(', ');
        eventInfo = bandNames.length > 20 ? bandNames.substring(0, 20) + '...' : bandNames;
      }
    } else if (eventType === 'jam') {
      // Mauve pour les bœufs - maintenant cliquable
      colorClasses = 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/40 hover:bg-purple-500/30 cursor-pointer';
      label = 'Bœuf';
      // Afficher le nombre de participants si disponible
      if (jam && jam.participants_count !== undefined) {
        eventInfo = `${jam.participants_count} participant${jam.participants_count > 1 ? 's' : ''}`;
      }
    } else if (isBooked) {
      // Rouge pour autres réservations (au cas où)
      colorClasses = 'bg-red-500/20 text-red-400 border-2 border-red-500/40 cursor-pointer';
      label = 'Réservé';
    } else if (isPast) {
      // Gris pour le passé
      colorClasses = 'bg-muted/20 text-muted-foreground cursor-not-allowed opacity-40';
      label = '';
    } else {
      // Bleu pour les jours libres
      colorClasses = 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/40 hover:bg-blue-500/30 hover:border-blue-500/60 cursor-pointer';
      label = 'Libre';
    }
    
    calendarDays.push(
      <button
        key={day}
        onClick={() => onDateClick(date)}
        disabled={isPast && !eventType}
        className={`
          aspect-square p-2 rounded-lg font-semibold transition-all
          ${colorClasses}
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
            {label}
          </div>
          {eventInfo && (
            <div className="text-[9px] mt-0.5 font-normal truncate">
              {eventInfo}
            </div>
          )}
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
