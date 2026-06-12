// ============================================================
// Zikra — Ma'lumotlar bazasi tiplari (TypeScript)
// ============================================================

export type SkillType = "teach" | "learn";

export interface Profile {
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
  last_active: string;
  created_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string | null;
  created_at: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  type: SkillType;
  skill?: Skill;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  match_score: number;
  status: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string | null;
  content: string;
  created_at: string;
}

export interface Lesson {
  id: string;
  teacher_id: string;
  learner_id: string;
  skill_id: string | null;
  status: "scheduled" | "completed" | "cancelled";
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Rating {
  id: string;
  lesson_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  comment: string | null;
  is_visible: boolean;
  created_at: string;
  rater?: Pick<Profile, "id" | "full_name" | "avatar_url">;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  condition_type: string;
  condition_value: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface Video {
  id: string;
  uploader_id: string;
  title: string;
  skill_id: string | null;
  cloudinary_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  status: string;
  created_at: string;
  skill?: Skill;
  uploader?: Pick<Profile, "id" | "full_name" | "avatar_url">;
  // Ijtimoiy statistika (sahifa tomonidan to'ldiriladi)
  likes?: number;
  views?: number;
  liked?: boolean;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface VideoLike {
  id: string;
  video_id: string;
  user_id: string;
  created_at: string;
}

export type NotificationType =
  | "message"
  | "rating"
  | "badge"
  | "streak"
  | "match"
  | "new_follower"
  | "new_like"
  | "new_video_from_following"
  | "new_comment";

export interface VideoComment {
  id: string;
  video_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author?: Pick<Profile, "id" | "full_name" | "avatar_url">;
  likes?: number;
  liked?: boolean;
  replies?: VideoComment[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "image" | "video";
  caption: string | null;
  created_at: string;
  expires_at: string;
}

export interface StoryGroup {
  user: Pick<Profile, "id" | "full_name" | "avatar_url">;
  stories: Story[];
  hasUnviewed: boolean;
  isMe: boolean;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// Discovery uchun boyitilgan profil
export interface ProfileWithSkills extends Profile {
  teach_skills: Skill[];
  learn_skills: Skill[];
  match_score?: number;
}
