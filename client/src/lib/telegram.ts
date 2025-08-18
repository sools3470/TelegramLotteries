declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        themeParams: {
          bg_color: string;
          text_color: string;
          hint_color: string;
          link_color: string;
          button_color: string;
          button_text_color: string;
        };
        ready: () => void;
        close: () => void;
        expand: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        showPopup: (params: {
          title?: string;
          message: string;
          buttons?: Array<{
            id?: string;
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
            text?: string;
          }>;
        }, callback?: (buttonId: string) => void) => void;
      };
    };
  }
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export class TelegramWebApp {
  private static instance: TelegramWebApp;
  private webApp: typeof window.Telegram.WebApp;

  private constructor() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp;
      this.webApp.ready();
      this.webApp.expand();
    } else {
      const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;

      // Fallback for development/testing only
      this.webApp = {
        initData: '',
        initDataUnsafe: {
          user: isDev
            ? {
                id: 123456789,
                first_name: 'Test',
                last_name: 'User',
                username: 'testuser',
              }
            : undefined,
        },
        themeParams: {
          bg_color: '#ffffff',
          text_color: '#000000',
          hint_color: '#999999',
          link_color: '#0088cc',
          button_color: '#0088cc',
          button_text_color: '#ffffff',
        },
        ready: () => {},
        close: () => {},
        expand: () => {},
        MainButton: {
          text: '',
          color: '#0088cc',
          textColor: '#ffffff',
          isVisible: false,
          isActive: true,
          show: () => {},
          hide: () => {},
          enable: () => {},
          disable: () => {},
          onClick: () => {},
          offClick: () => {},
        },
        BackButton: {
          isVisible: false,
          show: () => {},
          hide: () => {},
          onClick: () => {},
          offClick: () => {},
        },
        showAlert: (message: string, callback?: () => void) => {
          alert(message);
          callback?.();
        },
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => {
          const result = confirm(message);
          callback?.(result);
        },
        showPopup: (params: any, callback?: (buttonId: string) => void) => {
          alert(params.message);
          callback?.('ok');
        },
      } as any;
    }
  }

  public static getInstance(): TelegramWebApp {
    if (!TelegramWebApp.instance) {
      TelegramWebApp.instance = new TelegramWebApp();
    }
    return TelegramWebApp.instance;
  }

  public getUser(): TelegramUser | null {
    return this.webApp.initDataUnsafe?.user || null;
  }

  public getThemeParams() {
    return this.webApp.themeParams;
  }

  public showMainButton(text: string, onClick: () => void) {
    this.webApp.MainButton.text = text;
    this.webApp.MainButton.onClick(onClick);
    this.webApp.MainButton.show();
  }

  public hideMainButton() {
    this.webApp.MainButton.hide();
  }

  public showBackButton(onClick: () => void) {
    this.webApp.BackButton.onClick(onClick);
    this.webApp.BackButton.show();
  }

  public hideBackButton() {
    this.webApp.BackButton.hide();
  }

  public showAlert(message: string): Promise<void> {
    return new Promise((resolve) => {
      this.webApp.showAlert(message, () => resolve());
    });
  }

  public showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.webApp.showConfirm(message, (confirmed) => resolve(confirmed));
    });
  }

  public close() {
    this.webApp.close();
  }
}

export const telegramWebApp = TelegramWebApp.getInstance();
