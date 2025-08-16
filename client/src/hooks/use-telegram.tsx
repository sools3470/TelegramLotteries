import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { telegramWebApp, type TelegramUser } from '@/lib/telegram';

interface TelegramContextType {
  user: TelegramUser | null;
  isLoading: boolean;
  isInTelegram: boolean;
  showAlert: (message: string) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
  showMainButton: (text: string, onClick: () => void) => void;
  hideMainButton: () => void;
  showBackButton: (onClick: () => void) => void;
  hideBackButton: () => void;
  close: () => void;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

interface TelegramProviderProps {
  children: ReactNode;
}

export function TelegramProvider({ children }: TelegramProviderProps) {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const telegramUser = telegramWebApp.getUser();
    setUser(telegramUser);
    setIsLoading(false);
  }, []);

  const showAlert = (message: string) => {
    return telegramWebApp.showAlert(message);
  };

  const showConfirm = (message: string) => {
    return telegramWebApp.showConfirm(message);
  };

  const showMainButton = (text: string, onClick: () => void) => {
    telegramWebApp.showMainButton(text, onClick);
  };

  const hideMainButton = () => {
    telegramWebApp.hideMainButton();
  };

  const showBackButton = (onClick: () => void) => {
    telegramWebApp.showBackButton(onClick);
  };

  const hideBackButton = () => {
    telegramWebApp.hideBackButton();
  };

  const close = () => {
    telegramWebApp.close();
  };

  // Check if in Telegram environment
  const isInTelegram = typeof window !== 'undefined' && !!window.Telegram?.WebApp;

  return (
    <TelegramContext.Provider
      value={{
        user,
        isLoading,
        isInTelegram,
        showAlert,
        showConfirm,
        showMainButton,
        hideMainButton,
        showBackButton,
        hideBackButton,
        close,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error("useTelegram must be used within a TelegramProvider");
  }
  return context;
}
