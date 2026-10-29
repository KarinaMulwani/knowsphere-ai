import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KnowSphere AI — Internal Company Knowledge Assistant',
  description:
    'AI-powered internal knowledge assistant. Upload company documents and get instant, cited answers using RAG with NVIDIA NIM.',
  keywords: ['knowledge base', 'AI assistant', 'RAG', 'document search', 'company knowledge'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
