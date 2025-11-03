import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function useRegisterServiceWorker() {
  useEffect(() => {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then(() => console.log('✅ Service Worker registered (web only)'))
          .catch((err) => console.log('❌ Service Worker registration failed:', err));
      });
    }
  }, []);
}