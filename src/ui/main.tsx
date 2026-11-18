import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/barlow/300.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/400-italic.css';
import '@fontsource/barlow-condensed/400.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import './theme/global.css';
import { App } from './App';
import { sound } from './audio/sound';
import { useGame } from './store';
import { initSaves } from '../save/storage';

if (useGame.getState().muted) sound.setMuted(true);

// In the Mac app, read the save files before the title screen asks for them.
void initSaves().finally(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
);
