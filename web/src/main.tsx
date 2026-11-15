import '@fontsource-variable/urbanist';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Providers } from '@/app/providers';
import { AppRouter } from '@/app/router';
import '@/styles/globals.css';
import '@/styles/motion.css';
import { scheduleIntroEnd } from '@/lib/intro';

scheduleIntroEnd();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <AppRouter />
    </Providers>
  </StrictMode>
);

