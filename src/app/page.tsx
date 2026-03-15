'use client';

import { useState, useEffect, useCallback } from 'react';
import { OfferCard } from '@/components/offer-card';
import { NicheFilters } from '@/components/niche-filters';

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

interface FavoriteEntry {
  id: string;
  advertiserId: string;
  notes: string | null;
  createdAt: string;
  advertiser: Offer;
}

interface ScrapeLog {
  id: string;
  niche: string;
  status: string;
  advertisersFound: number;
  scaledFound: number;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
}

type Tab = 'buscar' | 'favoritos' | 'historico';

export default function Home() {
  const [tab, setTab] = useState<Tab>('buscar');

  // Buscar tab
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [niche, setNiche] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Favoritos tab
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [loadingFavs, setLoadingFavs] = useState(false);

  // Histórico tab
  const [logs, setLogs] = useState<ScrapeLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const loadFavorites = useCallback(async () => {
    setLoadingFavs(true);
    const res = await fetch('/api/favorites');
    const data: FavoriteEntry[] = await res.json();
    setFavorites(data);
    setFavoritedIds(new Set(data.map((f) => f.advertiserId)));
    setLoadingFavs(false);
  }, []);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    const res = await fetch('/api/logs');
    const data: ScrapeLog[] = await res.json();
    setLogs(data);
    setLoadingLogs(false);
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    if (tab === 'historico') loadLogs();
  }, [tab, loadLogs]);

  async function searchOffers(resetPage = true) {
    const currentPage = resetPage ? 1 : page;
    if (resetPage) {
      setLoading(true);
      setOffers([]);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    const params = new URLSearchParams();
    if (niche !== 'all') params.set('niche', niche);
    if (search) params.set('search', search);
    params.set('page', String(currentPage));

    const res = await fetch(`/api/offers?${params}`);
    const data = await res.json();

    if (resetPage) {
      setOffers(data.offers);
    } else {
      setOffers((prev) => [...prev, ...data.offers]);
    }
    setTotal(data.total);
    setPage(currentPage + 1);
    setLoading(false);
    setLoadingMore(false);
  }

  async function runScraper() {
    if (niche === 'all') {
      alert('Selecione um nicho específico para minerar.');
      return;
    }
    setScraping(true);
    await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niche }),
    });
    await searchOffers(true);
    await loadFavorites();
    setScraping(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') searchOffers(true);
  }

  function handleToggleFavorite(id: string) {
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setFavorites((f) => f.filter((fav) => fav.advertiserId !== id));
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const hasMore = offers.length < total;

  const statusColor: Record<string, string> = {
    completed: 'text-green-400',
    running: 'text-yellow-400',
    error: 'text-red-400',
  };

  const statusLabel: Record<string, string> = {
    completed: 'Concluído',
    running: 'Em andamento',
    error: 'Erro',
  };

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-[#EAEAE5]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1C1C1C]/95 backdrop-blur-sm px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#EAEAE5] rounded-full flex items-center justify-center text-xs">
              ◎
            </div>
            <span className="font-bold text-lg tracking-tight">SCALEDOFFERS</span>
          </div>
          <nav className="flex gap-1">
            {(['buscar', 'favoritos', 'historico'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                  tab === t
                    ? 'bg-[#EAEAE5] text-[#1C1C1C]'
                    : 'text-[#78786e] hover:text-[#EAEAE5]'
                }`}
              >
                {t === 'buscar' && 'Buscar'}
                {t === 'favoritos' && `Favoritos${favoritedIds.size > 0 ? ` (${favoritedIds.size})` : ''}`}
                {t === 'historico' && 'Histórico'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── TAB: BUSCAR ── */}
      {tab === 'buscar' && (
        <>
          <section className="border-b border-white/10 px-6 py-16">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-5xl font-semibold tracking-tight mb-4">
                Ofertas
                <br />
                Escaladas
              </h1>
              <p className="text-[#a8a89e] text-lg max-w-md mb-8">
                Encontre anunciantes com +70 anúncios ativos e mínimo 3 meses de histórico.
              </p>
              <div className="flex gap-3 flex-wrap">
                <span className="px-4 py-2 border border-white/10 rounded-full font-mono text-xs">70+ Ads</span>
                <span className="px-4 py-2 border border-white/10 rounded-full font-mono text-xs">90+ Dias</span>
                <span className="px-4 py-2 border border-white/10 rounded-full font-mono text-xs">Real-time</span>
              </div>
            </div>
          </section>

          <section className="border-b border-white/10 px-6 py-12">
            <div className="max-w-6xl mx-auto">
              <div className="flex gap-4 mb-6 flex-wrap">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar por anunciante..."
                  className="flex-1 min-w-[200px] px-5 py-4 bg-[#242424] border border-white/10 text-[#EAEAE5] placeholder-[#78786e] focus:outline-none focus:border-[#a8a89e] transition-colors"
                />
                <button
                  onClick={() => searchOffers(true)}
                  disabled={loading || scraping}
                  className="px-8 py-4 bg-[#EAEAE5] text-[#1C1C1C] font-semibold text-sm uppercase tracking-wider hover:bg-[#d4d4c8] disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Buscando...' : 'Buscar Ofertas'}
                </button>
                <button
                  onClick={runScraper}
                  disabled={loading || scraping || niche === 'all'}
                  title={niche === 'all' ? 'Selecione um nicho para minerar' : 'Minerar Facebook Ads Library'}
                  className="px-8 py-4 border border-green-400 text-green-400 font-semibold text-sm uppercase tracking-wider hover:bg-green-400 hover:text-[#1C1C1C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {scraping ? 'Minerando...' : '⚡ Minerar'}
                </button>
              </div>
              <NicheFilters selected={niche} onSelect={setNiche} />
            </div>
          </section>

          <section className="px-6">
            <div className="max-w-6xl mx-auto">
              {offers.length > 0 && (
                <div className="flex items-center justify-between py-5 border-b border-white/10 bg-[#242424] px-6 -mx-6">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">Ofertas Escaladas</span>
                    <span className="px-3 py-1 bg-[#EAEAE5] text-[#1C1C1C] rounded-full font-mono text-xs">
                      {offers.length} de {total}
                    </span>
                  </div>
                </div>
              )}

              {loading || scraping ? (
                <div className="py-20 text-center">
                  <div className="text-4xl mb-4 opacity-30 animate-pulse">◎</div>
                  <p className="text-[#78786e]">
                    {scraping ? 'Minerando Facebook Ads Library...' : 'Carregando...'}
                  </p>
                </div>
              ) : offers.length > 0 ? (
                <div>
                  {offers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      isFavorited={favoritedIds.has(offer.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                  {hasMore && (
                    <div className="py-8 text-center">
                      <button
                        onClick={() => searchOffers(false)}
                        disabled={loadingMore}
                        className="px-8 py-3 border border-white/10 text-[#a8a89e] text-sm uppercase tracking-wider hover:border-[#EAEAE5] hover:text-[#EAEAE5] disabled:opacity-50 transition-colors"
                      >
                        {loadingMore ? 'Carregando...' : `Carregar mais (${total - offers.length} restantes)`}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="text-4xl mb-4 opacity-30">◎</div>
                  <h3 className="text-xl font-semibold mb-2">Pronto para minerar</h3>
                  <p className="text-[#78786e]">
                    Clique em &ldquo;Buscar Ofertas&rdquo; para ver dados existentes ou &ldquo;⚡ Minerar&rdquo; para raspar novos dados.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* ── TAB: FAVORITOS ── */}
      {tab === 'favoritos' && (
        <section className="px-6 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-3xl font-semibold">Favoritos</h2>
              {favorites.length > 0 && (
                <span className="px-3 py-1 bg-[#EAEAE5] text-[#1C1C1C] rounded-full font-mono text-xs">
                  {favorites.length}
                </span>
              )}
            </div>

            {loadingFavs ? (
              <div className="py-20 text-center">
                <div className="text-4xl mb-4 opacity-30 animate-pulse">◎</div>
                <p className="text-[#78786e]">Carregando favoritos...</p>
              </div>
            ) : favorites.length > 0 ? (
              <div>
                {favorites.map((fav) => (
                  <OfferCard
                    key={fav.id}
                    offer={fav.advertiser}
                    isFavorited={true}
                    onToggleFavorite={(id) => {
                      setFavorites((f) => f.filter((x) => x.advertiserId !== id));
                      setFavoritedIds((prev) => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                      });
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="text-4xl mb-4 opacity-30">◎</div>
                <h3 className="text-xl font-semibold mb-2">Nenhum favorito ainda</h3>
                <p className="text-[#78786e]">
                  Clique em &ldquo;Salvar&rdquo; em qualquer oferta para adicioná-la aqui.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── TAB: HISTÓRICO ── */}
      {tab === 'historico' && (
        <section className="px-6 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-3xl font-semibold">Histórico de Minerações</h2>
              {logs.length > 0 && (
                <span className="px-3 py-1 bg-[#EAEAE5] text-[#1C1C1C] rounded-full font-mono text-xs">
                  {logs.length}
                </span>
              )}
            </div>

            {loadingLogs ? (
              <div className="py-20 text-center">
                <div className="text-4xl mb-4 opacity-30 animate-pulse">◎</div>
                <p className="text-[#78786e]">Carregando histórico...</p>
              </div>
            ) : logs.length > 0 ? (
              <div className="border border-white/10">
                {/* Header */}
                <div className="grid grid-cols-[1fr_120px_80px_80px_120px_100px] gap-4 px-6 py-3 bg-[#242424] text-[10px] text-[#78786e] uppercase tracking-wider">
                  <span>Nicho</span>
                  <span>Início</span>
                  <span>Encontrados</span>
                  <span>Escalados</span>
                  <span>Duração</span>
                  <span>Status</span>
                </div>
                {logs.map((log) => {
                  const duration =
                    log.completedAt
                      ? Math.round(
                          (new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000
                        )
                      : null;

                  return (
                    <div
                      key={log.id}
                      className="grid grid-cols-[1fr_120px_80px_80px_120px_100px] gap-4 px-6 py-4 border-t border-white/10 hover:bg-[#242424] transition-colors items-center"
                    >
                      <span className="font-medium capitalize">{log.niche}</span>
                      <span className="text-sm text-[#78786e] font-mono">
                        {new Date(log.startedAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="font-mono text-sm">{log.advertisersFound}</span>
                      <span className="font-mono text-sm text-green-400">{log.scaledFound}</span>
                      <span className="font-mono text-sm text-[#78786e]">
                        {duration !== null ? `${duration}s` : '—'}
                      </span>
                      <span className={`text-xs font-medium ${statusColor[log.status] ?? 'text-[#78786e]'}`}>
                        {statusLabel[log.status] ?? log.status}
                        {log.error && (
                          <span className="block text-[10px] text-red-400 truncate max-w-[100px]" title={log.error}>
                            {log.error}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="text-4xl mb-4 opacity-30">◎</div>
                <h3 className="text-xl font-semibold mb-2">Nenhuma mineração ainda</h3>
                <p className="text-[#78786e]">
                  Use o botão &ldquo;⚡ Minerar&rdquo; para iniciar sua primeira mineração.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-20 py-12 bg-[#242424] text-center">
        <span className="font-mono text-xs text-[#78786e] uppercase tracking-wider">
          ScaledOffers — Minerador de Ofertas Escaladas
        </span>
      </footer>
    </div>
  );
}
