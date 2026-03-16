import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScaledOffers — Minerador de Ofertas Escaladas",
  description:
    "Encontre anunciantes com +70 anúncios ativos e mínimo 3 meses de histórico no Facebook Ads Library.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased so-body">
        {children}
      </body>
    </html>
  );
}
