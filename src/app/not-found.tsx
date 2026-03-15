import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#1C1C1C] text-[#EAEAE5] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 opacity-20">◎</div>
        <h2 className="text-2xl font-semibold mb-2">404 — Não Encontrado</h2>
        <p className="text-[#78786e]">A página que você procura não existe.</p>
        <Link
          href="/"
          className="mt-6 inline-block px-6 py-3 bg-[#EAEAE5] text-[#1C1C1C] font-semibold text-sm uppercase tracking-wider hover:bg-[#d4d4c8] transition-colors"
        >
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
