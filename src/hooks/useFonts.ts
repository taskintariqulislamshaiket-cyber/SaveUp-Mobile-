import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export function useFonts() {
  const [fontsLoaded, setFontsLoaded] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Load Ionicons font for web
      const loadFonts = async () => {
        try {
          // Create font face for Ionicons
          const fontFace = new FontFace(
            'Ionicons',
            'url(https://unpkg.com/ionicons@7.1.0/dist/fonts/ionicons.ttf)'
          );
          
          await fontFace.load();
          (document as any).fonts.add(fontFace);
          setFontsLoaded(true);
          console.log('✅ Ionicons font loaded successfully');
        } catch (error) {
          console.error('❌ Error loading Ionicons font:', error);
          // Still set as loaded to not block the app
          setFontsLoaded(true);
        }
      };

      loadFonts();
    }
  }, []);

  return fontsLoaded;
}
