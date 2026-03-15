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
    <div className="group grid grid-cols-[1fr_auto] gap-8 p-7 border-b border-white/10 hover:bg-[#242424] transition-all relative">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#78786e] to-[#a8a89e] flex items-center justify-center text-[#1C1C1C] font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-lg font-semibold text-[#EAEAE5]">{offer.pageName}</span>
              {offer.isScaled && (
                <span className="px-2 py-1 bg-green-400 text-[#1C1C1C] text-[9px] font-semibold uppercase tracking-wider">
                  Escalado
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-[#78786e]">
              <span className="px-3 py-1 border border-white/10 text-[11px] font-medium text-[#a8a89e]">
                {offer.nicheLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-8 mt-2">
          <div>
            <div className="font-mono text-xl font-semibold text-green-400">{offer.adsActive}</div>
            <div className="text-[10px] text-[#78786e] uppercase tracking-wider">Ads Ativos</div>
          </div>
          <div>
            <div className="font-mono text-xl font-semibold text-[#EAEAE5]">{offer.adsTotal}</div>
            <div className="text-[10px] text-[#78786e] uppercase tracking-wider">Total Ads</div>
          </div>
          <div>
            <div className="font-mono text-xl font-semibold text-[#EAEAE5]">{offer.daysActive}</div>
            <div className="text-[10px] text-[#78786e] uppercase tracking-wider">Dias Ativos</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <ScoreRing score={offer.score} />
        <div className="flex gap-2">
          <a
            href={offer.pageUrl || `https://www.facebook.com/ads/library/?id=${offer.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#EAEAE5] text-[#1C1C1C] text-[11px] font-medium uppercase tracking-wider hover:bg-[#d4d4c8] transition-colors"
          >
            Ver Ads
          </a>
          <button
            onClick={handleToggleFavorite}
            disabled={saving}
            className={`px-4 py-2 text-[11px] font-medium uppercase tracking-wider transition-colors ${
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
