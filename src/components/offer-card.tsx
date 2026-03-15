'use client';

import { useState } from 'react';
import { ScoreRing } from './score-ring';

interface Offer {
  id: string;
  pageName: string;
  niche: string;
  nicheLabel: string;
  adsActive: number;
  adsTotal: number;
  daysActive: number;
  score: number;
  pageUrl: string;
  isScaled: boolean;
}

interface Props {
  offer: Offer;
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export function OfferCard({ offer, isFavorited = false, onToggleFavorite }: Props) {
  const [favorited, setFavorited] = useState(isFavorited);
  const [saving, setSaving] = useState(false);

  const initials = offer.pageName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handleToggleFavorite() {
    setSaving(true);
    try {
      if (favorited) {
        await fetch(`/api/favorites?advertiserId=${offer.id}`, { method: 'DELETE' });
        setFavorited(false);
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ advertiserId: offer.id }),
        });
        setFavorited(true);
      }
      onToggleFavorite?.(offer.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="group relative flex flex-col sm:grid sm:grid-cols-[1fr_auto] sm:gap-8 p-5 sm:p-7 border-b border-white/10 hover:bg-[#242424] transition-all">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#78786e] to-[#a8a89e] flex items-center justify-center text-[#1C1C1C] font-bold text-xs sm:text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-semibold text-[#EAEAE5] truncate">{offer.pageName}</span>
              {offer.isScaled && (
                <span className="px-2 py-1 bg-green-400 text-[#1C1C1C] text-[9px] font-semibold uppercase tracking-wider flex-shrink-0">
                  Escalado
                </span>
              )}
            </div>
            <span className="px-2 sm:px-3 py-1 border border-white/10 text-[10px] sm:text-[11px] font-medium text-[#a8a89e]">
              {offer.nicheLabel}
            </span>
          </div>
        </div>

        <div className="flex gap-5 sm:gap-8 mt-1">
          <div>
            <div className="font-mono text-lg sm:text-xl font-semibold text-green-400">{offer.adsActive}</div>
            <div className="text-[9px] sm:text-[10px] text-[#78786e] uppercase tracking-wider">Ads Ativos</div>
          </div>
          <div>
            <div className="font-mono text-lg sm:text-xl font-semibold text-[#EAEAE5]">{offer.adsTotal}</div>
            <div className="text-[9px] sm:text-[10px] text-[#78786e] uppercase tracking-wider">Total Ads</div>
          </div>
          <div>
            <div className="font-mono text-lg sm:text-xl font-semibold text-[#EAEAE5]">{offer.daysActive}</div>
            <div className="text-[9px] sm:text-[10px] text-[#78786e] uppercase tracking-wider">Dias Ativos</div>
          </div>
        </div>
      </div>

      {/* Score + Buttons — desktop: coluna direita | mobile: linha abaixo */}
      <div className="flex items-center justify-between sm:flex-col sm:items-center gap-3 sm:gap-4 mt-4 sm:mt-0">
        <ScoreRing score={offer.score} />
        <div className="flex gap-2">
          <a
            href={offer.pageUrl || `https://www.facebook.com/ads/library/?id=${offer.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 sm:px-4 py-2 bg-[#EAEAE5] text-[#1C1C1C] text-[10px] sm:text-[11px] font-medium uppercase tracking-wider hover:bg-[#d4d4c8] transition-colors"
          >
            Ver Ads
          </a>
          <button
            onClick={handleToggleFavorite}
            disabled={saving}
            className={`px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] font-medium uppercase tracking-wider transition-colors ${
              favorited
                ? 'bg-green-400 text-[#1C1C1C] border border-green-400'
                : 'border border-white/10 text-[#a8a89e] hover:bg-[#EAEAE5] hover:text-[#1C1C1C] hover:border-[#EAEAE5]'
            } disabled:opacity-50`}
          >
            {favorited ? 'Salvo' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
