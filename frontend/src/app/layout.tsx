import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WebAudit - Analisador de SEO, HTML e CSS',
  description: 'Analise qualquer URL para identificar problemas de SEO e erros de validacao HTML e CSS usando APIs reais do W3C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
