import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../types/translation.types';

/**
 * Validates and normalizes language code
 * @param lang - Language code from request
 * @returns Valid language code, defaults to 'en'
 */
export const validateLanguageCode = (lang?: string): SupportedLanguage => {
  if (!lang) return 'en';
  
  const normalizedLang = lang.toLowerCase() as SupportedLanguage;
  return SUPPORTED_LANGUAGES.includes(normalizedLang) ? normalizedLang : 'en';
};

/**
 * Applies translations to a homestay object
 * @param homestay - Original homestay object
 * @param translations - Array of translations
 * @param lang - Target language
 * @returns Homestay object with applied translations
 */
export const applyHomestayTranslations = (homestay: any, translations: any[], lang: SupportedLanguage) => {
  const translation = translations.find(t => t.language_code === lang);
  
  if (translation) {
    return {
      ...homestay,
      title: translation.title,
      description: translation.description || homestay.description
    };
  }
  
  return homestay;
};

/**
 * Applies translations to a room object
 * @param room - Original room object
 * @param translations - Array of translations
 * @param lang - Target language
 * @returns Room object with applied translations
 */
export const applyRoomTranslations = (room: any, translations: any[], lang: SupportedLanguage) => {
  const translation = translations.find(t => t.language_code === lang);
  
  if (translation) {
    return {
      ...room,
      title: translation.title,
      name: translation.title, // For backward compatibility
      description: translation.description || room.description
    };
  }
  
  return room;
};

/**
 * Applies translations to multiple rooms
 * @param rooms - Array of room objects
 * @param roomTranslations - Object containing translations keyed by room_id
 * @param lang - Target language
 * @returns Array of room objects with applied translations
 */
export const applyRoomsTranslations = (rooms: any[], roomTranslations: Record<number, any[]>, lang: SupportedLanguage) => {
  if (!rooms || !Array.isArray(rooms)) return rooms;
  
  return rooms.map(room => {
    const translations = roomTranslations[room.id] || [];
    return applyRoomTranslations(room, translations, lang);
  });
}; 