"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyRoomsTranslations = exports.applyRoomTranslations = exports.applyHomestayTranslations = exports.validateLanguageCode = void 0;
const translation_types_1 = require("../types/translation.types");
/**
 * Validates and normalizes language code
 * @param lang - Language code from request
 * @returns Valid language code, defaults to 'en'
 */
const validateLanguageCode = (lang) => {
    if (!lang)
        return 'en';
    const normalizedLang = lang.toLowerCase();
    return translation_types_1.SUPPORTED_LANGUAGES.includes(normalizedLang) ? normalizedLang : 'en';
};
exports.validateLanguageCode = validateLanguageCode;
/**
 * Applies translations to a homestay object
 * @param homestay - Original homestay object
 * @param translations - Array of translations
 * @param lang - Target language
 * @returns Homestay object with applied translations
 */
const applyHomestayTranslations = (homestay, translations, lang) => {
    const translation = translations.find(t => t.language_code === lang);
    if (translation) {
        return Object.assign(Object.assign({}, homestay), { title: translation.title, description: translation.description || homestay.description });
    }
    return homestay;
};
exports.applyHomestayTranslations = applyHomestayTranslations;
/**
 * Applies translations to a room object
 * @param room - Original room object
 * @param translations - Array of translations
 * @param lang - Target language
 * @returns Room object with applied translations
 */
const applyRoomTranslations = (room, translations, lang) => {
    const translation = translations.find(t => t.language_code === lang);
    if (translation) {
        return Object.assign(Object.assign({}, room), { title: translation.title, name: translation.title, description: translation.description || room.description });
    }
    return room;
};
exports.applyRoomTranslations = applyRoomTranslations;
/**
 * Applies translations to multiple rooms
 * @param rooms - Array of room objects
 * @param roomTranslations - Object containing translations keyed by room_id
 * @param lang - Target language
 * @returns Array of room objects with applied translations
 */
const applyRoomsTranslations = (rooms, roomTranslations, lang) => {
    if (!rooms || !Array.isArray(rooms))
        return rooms;
    return rooms.map(room => {
        const translations = roomTranslations[room.id] || [];
        return (0, exports.applyRoomTranslations)(room, translations, lang);
    });
};
exports.applyRoomsTranslations = applyRoomsTranslations;
