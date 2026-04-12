interface HumanityTrackerProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
}

export function HumanityTracker({ value, max = 10, onChange, size = "md" }: HumanityTrackerProps) {
  const dotSize = size === "sm" ? "w-2.5 h-2.5" : "w-3.5 h-3.5";

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i < value ? i : i + 1)}
          className={`${dotSize} rounded-full border border-border transition-all ${
            i < value
              ? "bg-gold shadow-[0_0_4px_hsl(var(--gold)/0.3)]"
              : "bg-muted"
          } ${onChange ? "cursor-pointer hover:scale-110" : ""}`}
        />
      ))}
    </div>
  );
}
