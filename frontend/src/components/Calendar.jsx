import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

const Calendar = ({ currentMonth, onMonthChange, onDateClick, bookedDates, eventsByDate = {}, concerts = [], jams = [], karaokes = [], spectacles = [], planningSlots = [], myApplications = [] }) => {
  // Debug: Vérifier que les données arrivent
  console.log('[Calendar] Rendering with:', {
    planningSlots: planningSlots.length,
    concerts: concerts.length,
    jams: jams.length,
    bookedDates: bookedDates.length,
    eventsByDate: Object.keys(eventsByDate).length
  });
  
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
    // Format date sans conversion UTC pour éviter le décalage
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isBooked = isDateBooked(dateStr);
    const eventType = eventsByDate[dateStr]; // 'concert', 'jam', ou undefined
    const isPast = isPastDate(date);
    const isToday = new Date().toDateString() === date.toDateString();
    
    // Trouver le concert correspondant à cette date pour afficher les groupes
    const concert = concerts.find(c => c.date === dateStr);
    const jam = jams.find(j => j.date === dateStr);
    const planningSlot = planningSlots.find(p => p.date === dateStr);
    
    // Vérifier si le musicien a candidaté pour ce créneau
    const hasApplied = planningSlot && myApplications.some(app => app.slot_id === planningSlot.id);
    
    // Vérifier si la date est réservée par un événement (concert, jam, karaoké, spectacle)
    const isBookedByEvent = isBooked && !planningSlot;
    
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
    
    // Priorité : Candidatures du musicien > Événements réservés > Créneaux disponibles > Dates normales
    if (hasApplied) {
      // VERT pour les créneaux où le musicien a candidaté
      colorClasses = 'bg-green-500/20 text-green-400 border-2 border-green-500/40 hover:bg-green-500/30 cursor-pointer';
      label = 'Candidaté';
      eventInfo = planningSlot.title || 'Votre candidature';
    } else if (isBookedByEvent) {
      // Couleurs spécifiques selon le type d'événement réservé
      if (eventType === 'concert') {
        colorClasses = 'bg-green-500/20 text-green-400 border-2 border-green-500/40 hover:bg-green-500/30 cursor-pointer';
        label = 'Concert';
        eventInfo = concert && concert.participants_count ? `${concert.participants_count} participants` : '';
      } else if (eventType === 'jam') {
        colorClasses = 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/40 hover:bg-purple-500/30 cursor-pointer';
        label = 'Bœuf';
        eventInfo = jam && jam.participants_count ? `${jam.participants_count} participants` : '';
      } else if (eventType === 'karaoke') {
        colorClasses = 'bg-pink-500/20 text-pink-400 border-2 border-pink-500/40 hover:bg-pink-500/30 cursor-pointer';
        label = 'Karaoké';
        const karaoke = karaokes.find(k => k.date === dateStr);
        if (karaoke && karaoke.title) {
          eventInfo = karaoke.title.length > 20 ? karaoke.title.substring(0, 20) + '...' : karaoke.title;
        }
      } else if (eventType === 'spectacle') {
        colorClasses = 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/40 hover:bg-cyan-500/30 cursor-pointer';
        label = 'Spectacle';
        const spectacle = spectacles.find(s => s.date === dateStr);
        if (spectacle && spectacle.artist_name) {
          eventInfo = spectacle.artist_name.length > 20 ? spectacle.artist_name.substring(0, 20) + '...' : spectacle.artist_name;
        }
      } else {
        colorClasses = 'bg-red-500/20 text-red-400 border-2 border-red-500/40 hover:bg-red-500/30 cursor-pointer';
        label = 'Réservé';
      }
    } else if (isSlotComplete) {
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
      // JAUNE pour les créneaux ouverts disponibles
      colorClasses = 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 hover:bg-yellow-500/30 cursor-pointer';
      label = 'Disponible';
      eventInfo = planningSlot.title || `${planningSlot.num_bands_needed || 1} groupe${planningSlot.num_bands_needed > 1 ? 's' : ''}`;
    } else if (eventType === 'concert') {
      // VERT pour les concerts
      colorClasses = 'bg-green-500/20 text-green-400 border-2 border-green-500/40 hover:bg-green-500/30 cursor-pointer';
      label = 'Concert';
      // Afficher le nombre de participants et les noms des groupes
      if (concert) {
        if (concert.participants_count !== undefined && concert.participants_count > 0) {
          eventInfo = `${concert.participants_count} participant${concert.participants_count > 1 ? 's' : ''}`;
        } else if (concert.bands && concert.bands.length > 0) {
          const bandNames = concert.bands.map(b => b.name).join(', ');
          eventInfo = bandNames.length > 20 ? bandNames.substring(0, 20) + '...' : bandNames;
        }
      }
    } else if (eventType === 'jam') {
      // VIOLET pour les bœufs
      colorClasses = 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/40 hover:bg-purple-500/30 cursor-pointer';
      label = 'Bœuf';
      // Afficher le nombre de participants si disponible
      if (jam && jam.participants_count !== undefined) {
        eventInfo = `${jam.participants_count} participant${jam.participants_count > 1 ? 's' : ''}`;
      }
    } else if (eventType === 'karaoke') {
      // ROSE pour les karaoké
      colorClasses = 'bg-pink-500/20 text-pink-400 border-2 border-pink-500/40 hover:bg-pink-500/30 cursor-pointer';
      label = 'Karaoké';
      const karaoke = karaokes.find(k => k.date === dateStr);
      if (karaoke && karaoke.title) {
        eventInfo = karaoke.title.length > 20 ? karaoke.title.substring(0, 20) + '...' : karaoke.title;
      }
    } else if (eventType === 'spectacle') {
      // CYAN pour les spectacles
      colorClasses = 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/40 hover:bg-cyan-500/30 cursor-pointer';
      label = 'Spectacle';
      const spectacle = spectacles.find(s => s.date === dateStr);
      if (spectacle && spectacle.artist_name) {
        eventInfo = spectacle.artist_name.length > 20 ? spectacle.artist_name.substring(0, 20) + '...' : spectacle.artist_name;
      }
    } else if (isBooked) {
      // Rouge pour autres réservations (au cas où)
      colorClasses = 'bg-red-500/20 text-red-400 border-2 border-red-500/40 cursor-pointer';
      label = 'Réservé';
    } else if (isPast) {
      // Gris pour le passé - MAIS garder le cursor-pointer si c'est un événement
      if (isBookedByEvent || isSlotComplete || hasAcceptedApplications || isOpenSlot) {
        // Les événements passés restent cliquables pour consultation
        colorClasses = 'bg-muted/20 text-muted-foreground border-2 border-muted/40 hover:bg-muted/30 cursor-pointer opacity-70';
      } else {
        // Les dates passées vides ne sont pas cliquables
        colorClasses = 'bg-muted/20 text-muted-foreground cursor-not-allowed opacity-60';
      }
      label = 'Passé';
    } else {
      // BLEU pour les jours LIBRES (disponibles pour créer un créneau)
      colorClasses = 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/40 hover:bg-blue-500/30 cursor-pointer';
      label = 'Libre';
    }
    
    calendarDays.push(
      <button
        key={day}
        onClick={() => {
          // Permettre le click sur les dates avec événements (même passées)
          if (!isPast || isBookedByEvent || isSlotComplete || hasAcceptedApplications || isOpenSlot) {
            onDateClick(dateStr);
          }
        }}
        disabled={isPast && !isBookedByEvent && !isSlotComplete && !hasAcceptedApplications && !isOpenSlot}
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
          
          {/* Afficher les noms des groupes pour les concerts */}
          {concert && concert.bands && concert.bands.length > 0 && (
            <div className="text-[8px] mt-1 leading-tight space-y-0.5">
              {concert.bands.slice(0, 2).map((band, idx) => (
                <div key={idx} className="truncate font-semibold text-white/90">
                  🎸 {band.name}
                </div>
              ))}
              {concert.bands.length > 2 && (
                <div className="text-white/70">+{concert.bands.length - 2} autre{concert.bands.length - 2 > 1 ? 's' : ''}</div>
              )}
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
      <div className="flex flex-wrap gap-3 mb-4 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-blue-500/20 border-2 border-blue-500/40"></div>
          <span>Libre</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-red-500/20 border-2 border-red-500/40"></div>
          <span>Réservé</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-purple-500/20 border-2 border-purple-500/40"></div>
          <span>Karaoké</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-pink-500/20 border-2 border-pink-500/40"></div>
          <span>Spectacle</span>
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
