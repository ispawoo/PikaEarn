// components/TelegramContext.js
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const TelegramContext = createContext({
  webApp: null,
  user: null,
  initData: '',
  isReady: false,
  isTelegramClient: false,
  hapticFeedback: {
    impact: () => {},
    notification: () => {},
    selection: () => {}
  },
  showPopup: () => {},
  setMockUserId: () => {}
});

export const useTelegram = () => useContext(TelegramContext);

export const TelegramProvider = ({ children }) => {
  const [webApp, setWebApp] = useState(null);
  const [user, setUser] = useState(null);
  const [initData, setInitData] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isTelegramClient, setIsTelegramClient] = useState(false);
  const [mockUserId, setMockUserIdState] = useState('777777'); // Default developer mock Telegram ID

  useEffect(() => {
    // Check if running in browser
    if (typeof window !== 'undefined') {
      const initializeTelegram = () => {
        const tg = window.Telegram?.WebApp;
        
        if (tg) {
          // App is running inside native Telegram client
          tg.ready();
          tg.expand(); // Enforce full screen height in TG
          
          // Match Telegram client theme colors
          tg.setHeaderColor?.('secondary_bg_color');
          tg.setBackgroundColor?.('bg_color');
          
          setWebApp(tg);
          setUser(tg.initDataUnsafe?.user || null);
          setInitData(tg.initData || '');
          setIsTelegramClient(true);
          setIsReady(true);
        } else {
          // App is running in normal browser (Chrome, Safari, etc.) for testing/dev
          console.log('ℹ️ Running outside Telegram. Initializing mock browser test mode.');
          
          const mockInitData = `mock_user_${mockUserId}`;
          const mockTgUser = {
            id: parseInt(mockUserId),
            username: `pika_earner_${mockUserId}`,
            first_name: 'Pika',
            last_name: 'Earner',
            language_code: 'en'
          };

          setUser(mockTgUser);
          setInitData(mockInitData);
          setIsTelegramClient(false);
          setIsReady(true);
        }
      };

      // 1. If script is already loaded and window.Telegram is active, initialize immediately
      if (window.Telegram?.WebApp) {
        initializeTelegram();
      } else {
        // 2. Check if a script element has already been appended
        let script = document.querySelector('script[src="https://telegram.org/js/telegram-web-app.js"]');
        if (!script) {
          script = document.createElement('script');
          script.src = 'https://telegram.org/js/telegram-web-app.js';
          script.async = true;
          script.onload = () => {
            initializeTelegram();
          };
          script.onerror = () => {
            console.error('Failed to load Telegram SDK script. Continuing in mock test mode.');
            initializeTelegram();
          };
          document.head.appendChild(script);
        } else {
          // If script tag already exists but is currently loading, hook into its onload event
          const oldOnload = script.onload;
          script.onload = (e) => {
            if (oldOnload) oldOnload(e);
            initializeTelegram();
          };
        }
      }
    }
  }, [mockUserId]);

  // Method to let developers change their mock Telegram ID on the fly
  const setMockUserId = (newId) => {
    if (!isTelegramClient) {
      setMockUserIdState(newId);
    }
  };

  // Safe wrapper for haptic feedback triggers
  const hapticFeedback = {
    impact: (style = 'medium') => {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.impactOccurred(style);
      } else {
        console.log(`📳 Haptic Impact: ${style} (Simulated)`);
      }
    },
    notification: (type = 'success') => {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred(type);
      } else {
        console.log(`📳 Haptic Notification: ${type} (Simulated)`);
      }
    },
    selection: () => {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.selectionChanged();
      } else {
        console.log('📳 Haptic Selection Changed (Simulated)');
      }
    }
  };

  // Safe wrapper for native popups
  const showPopup = (title, message, callback) => {
    if (webApp?.showPopup) {
      webApp.showPopup({
        title,
        message,
        buttons: [{ type: 'ok' }]
      }, () => {
        if (callback) callback();
      });
    } else {
      alert(`${title}\n\n${message}`);
      if (callback) callback();
    }
  };

  return (
    <TelegramContext.Provider
      value={{
        webApp,
        user,
        initData,
        isReady,
        isTelegramClient,
        hapticFeedback,
        showPopup,
        setMockUserId
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};
