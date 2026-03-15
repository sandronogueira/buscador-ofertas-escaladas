'use client';

const NICHES = [
  { id: 'all', label: 'Todos' },
  { id: 'emagrecimento', label: 'Emagrecimento' },
  { id: 'dinheiro', label: 'Ganhar Dinheiro' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'suplementos', label: 'Suplementos' },
  { id: 'beleza', label: 'Beleza' },
  { id: 'educacao', label: 'Educação' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'relacionamento', label: 'Relacionamento' },
];

interface Props {
  selected: string;
  onSelect: (niche: string) => void;
}

export function NicheFilters({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {NICHES.map((niche) => (
        <button
          key={niche.id}
          onClick={() => onSelect(niche.id)}
          className={`px-4 py-2 text-xs font-medium transition-all ${
            selected === niche.id
              ? 'bg-[#EAEAE5] text-[#1C1C1C] border border-[#EAEAE5]'
              : 'border border-white/10 text-[#78786e] hover:border-[#a8a89e] hover:text-[#EAEAE5]'
          }`}
        >
          {niche.label}
        </button>
      ))}
    </div>
  );
}
