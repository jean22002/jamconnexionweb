import { Radio } from "lucide-react";

export default function ParticipationBadge({ eventInfo, className = "" }) {
  if (!eventInfo) return null;

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 ${className}`}>
      <div className="relative">
        <Radio className="w-4 h-4" />
        <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-75"></div>
      </div>
      <span className="text-sm font-medium">
        En jam chez {eventInfo.venue_name}
      </span>
    </div>
  );
}
