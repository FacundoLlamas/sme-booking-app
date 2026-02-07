import type { Metadata } from 'next';
import './globals.css';
import ChatWrapper from '@/components/chat/ChatWrapper';

export const metadata: Metadata = {
  title: 'Evios HQ Demo',
  description: 'AI-powered appointment scheduling demo by Evios HQ',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <ChatWrapper />
      </body>
    </html>
  );
}
