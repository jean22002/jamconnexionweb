import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

// Générer les options d'heures de 00:00 à 23:45 (par tranches de 15 minutes)
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const hourStr = hour.toString().padStart(2, '0');
      const minuteStr = minute.toString().padStart(2, '0');
      options.push(`${hourStr}:${minuteStr}`);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export function TimeSelect({ value, onChange, placeholder = "Sélectionner l'heure", className = "" }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`bg-black/20 border-white/10 ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-y-auto">
        {TIME_OPTIONS.map((time) => (
          <SelectItem key={time} value={time}>
            {time}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
