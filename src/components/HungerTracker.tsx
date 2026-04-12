interface HungerTrackerProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
}

export function HungerTracker({ value, max = 5, onChange, size = "md" }: HungerTrackerProps) {
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
              ? "bg-primary shadow-[0_0_6px_hsl(var(--blood)/0.5)]"
              : "bg-muted"
          } ${onChange ? "cursor-pointer hover:scale-110" : ""}`}
        />
      ))}
    </div>
  );
}
