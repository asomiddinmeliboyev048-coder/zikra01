// types/database.types.ts
// Supabase ma'lumotlar bazasi tiplari (namuna/qo'lda).
// Ishlab chiqarishda quyidagi buyruq bilan avtomatik generatsiya qilish tavsiya etiladi:
//   npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.types.ts
//
// Bu fayl Supabase klientini tip-xavfsiz qilish uchun ishlatiladi:
//   createBrowserClient<Database>(...)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          username: string | null;
          city: string | null;
          bio: string | null;
          avatar_url: string | null;
          xp: number;
          level: string;
          trust_score: number;
          streak_days: number;
          onboarded: boolean;
          certificate_url: string | null;
          is_verified: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          username?: string | null;
          city?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          certificate_url?: string | null;
          is_verified?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          uploader_id: string;
          title: string;
          skill_id: string | null;
          cloudinary_url: string;
          thumbnail_url: string | null;
          duration: number | null;
          status: string;
          created_at: string;
        };
        Insert: {
          uploader_id: string;
          title: string;
          cloudinary_url: string;
          skill_id?: string | null;
          thumbnail_url?: string | null;
          duration?: number | null;
          status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["videos"]["Insert"]>;
        Relationships: [];
      };
      video_views: {
        Row: {
          id: string;
          video_id: string;
          user_id: string;
          watch_duration: number;
          watch_percentage: number;
          viewed_at: string;
        };
        Insert: { video_id: string; user_id: string };
        Update: { watch_duration?: number; watch_percentage?: number };
        Relationships: [];
      };
      video_likes: {
        Row: { id: string; video_id: string; user_id: string; created_at: string };
        Insert: { video_id: string; user_id: string };
        Update: never;
        Relationships: [];
      };
    };
    Views: { [key: string]: never };
    Functions: { [key: string]: never };
    Enums: { [key: string]: never };
  };
}
