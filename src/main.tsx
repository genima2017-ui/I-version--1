import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { SocialProvider } from '@/state/SocialProvider';
import { UpdatePrompt } from '@/components/UpdatePrompt';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SocialProvider>
      <App />
      <UpdatePrompt />
    </SocialProvider>
  </StrictMode>
);
