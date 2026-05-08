import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export default function TimeSelect({ value, onChange, placeholder = "Heure", className = "" }) {
  // Generate time options from 00:00 to 23:45 in 15-minute intervals
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`bg-black/20 border-white/10 ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-background border-white/10 max-h-[300px]">
        {timeOptions.map((time) => (
          <SelectItem key={time} value={time}>
            {time}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
