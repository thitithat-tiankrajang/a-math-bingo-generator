// Safe localStorage helper for Next.js SSR compatibility

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      if (!window.localStorage) return null;
      if (typeof window.localStorage.getItem !== 'function') return null;
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage.getItem failed:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window === 'undefined') return;
      if (!window.localStorage) return;
      if (typeof window.localStorage.setItem !== 'function') return;
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage.setItem failed:', error);
    }
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window === 'undefined') return;
      if (!window.localStorage) return;
      if (typeof window.localStorage.removeItem !== 'function') return;
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage.removeItem failed:', error);
    }
  },
};

