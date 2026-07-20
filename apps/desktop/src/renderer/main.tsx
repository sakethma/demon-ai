import React from 'react';
import ReactDOM from 'react-dom/client';
import { Globe, KineticGrid, demonTheme } from '@demon/core';
import { Chat } from './components/Chat';

const App = () => {
  return (
    <div style={{ 
      background: demonTheme.colors.background, 
      color: demonTheme.colors.textPrimary, 
      height: '100vh', 
      width: '100vw',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      overflow: 'hidden'
    }}>
      <KineticGrid />
      <Globe />
      
      {/* Foreground UI overlay */}
      <Chat />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
