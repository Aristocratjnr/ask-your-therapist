import { useEffect } from 'react';
import { Platform } from 'react-native';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    // Only call frameworkReady on web platform and if it exists
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.frameworkReady) {
        window.frameworkReady();
      }
    } catch (error) {
      console.warn('⚠️ frameworkReady call failed:', error);
      // Continue without frameworkReady - not critical
    }
  }, []);
}
