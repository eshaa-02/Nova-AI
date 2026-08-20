export function Waveform({ levels, active }: { levels: number[]; active: boolean }) {
  return (
    <div className="flex h-16 items-center justify-center gap-1" aria-hidden="true">
      {levels.map((level, i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-accent transition-[height] duration-75"
          style={{
            height: `${active ? Math.max(6, level * 64) : 6}px`,
            opacity: active ? 0.5 + level * 0.5 : 0.3,
          }}
        />
      ))}
    </div>
  );
}
