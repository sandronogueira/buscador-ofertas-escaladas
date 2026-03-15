export function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 26;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 70
      ? '#4ade80'
      : score >= 40
        ? '#facc15'
        : '#a8a89e';

  return (
    <div className="relative w-16 h-16">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          strokeWidth="5"
          stroke="#2a2a2a"
        />
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          strokeWidth="5"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-mono text-base font-bold text-[#EAEAE5]">
        {score}
      </div>
    </div>
  );
}
