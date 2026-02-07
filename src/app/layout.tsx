import type { Metadata } from 'next';
// import './globals.css';

export const metadata: Metadata = {
  title: 'SME Booking App',
  description: 'AI-powered appointment scheduling system for SMEs',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
