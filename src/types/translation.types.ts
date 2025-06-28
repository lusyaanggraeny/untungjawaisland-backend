// Translation Types for Multilingual Support

export interface HomestayTranslation {
  id: number;
  homestay_id: number;
  language_code: string;
  title: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface RoomTranslation {
  id: number;
  room_id: number;
  language_code: string;
  title: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TranslationCreateInput {
  homestay_id?: number;
  room_id?: number;
  language_code: string;
  title: string;
  description?: string;
}

export interface TranslationUpdateInput {
  title?: string;
  description?: string;
}

export type SupportedLanguage = 'en' | 'id';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'id'];

export const LANGUAGE_NAMES = {
  en: 'English',
  id: 'Bahasa Indonesia'
} as const; 