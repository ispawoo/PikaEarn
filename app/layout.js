// app/layout.js
import { Outfit } from 'next/font/google';
import Script from 'next/script';
import { TelegramProvider } from '@/components/TelegramContext';
import './globals.css';

// Using a premium Outfit font for the typography system
const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

// Configure viewport according to the latest Next.js guidelines
export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

// Standard page SEO metadata
export const metadata = {
  title: 'PikaEarn - Watch Ads & Earn Money',
  description: 'Earn money watching advertisements, invite friends, and withdraw balances instantly inside Telegram.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true} className={`${outfit.variable} h-full select-none antialiased bg-slate-950 text-slate-100`}>
      <head />
      <body suppressHydrationWarning={true} className="min-h-full flex flex-col font-sans overflow-x-hidden bg-slate-950 text-slate-50">
        <TelegramProvider>
          {children}
        </TelegramProvider>
      </body>
    </html>
  );
}
