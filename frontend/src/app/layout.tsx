import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import AudioController from '@/components/AudioController';

export const metadata: Metadata = {
  title: { default: 'QuizVerse — Live AI-Powered Quiz Platform', template: '%s | QuizVerse' },
  description: 'Create, host, and play live real-time quizzes with AI-assisted generation. Kahoot-style gameplay with PDF, image, and URL import.',
  keywords: ['quiz', 'live quiz', 'kahoot', 'AI quiz', 'real-time', 'multiplayer'],
  openGraph: {
    title: 'QuizVerse',
    description: 'Create live quizzes in seconds with AI',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <AudioController />
        </Providers>
      </body>
    </html>
  );
}
