// constants/routes.ts
// Barcha route PATH'lar bitta joyda — qattiq-kodlangan satrlardan qochish
// va refaktoringni osonlashtirish uchun.

export const ROUTES = {
  // Ommaviy (public)
  home: "/", // bosh sahifa (landing)
  login: "/login", // kirish
  register: "/register", // ro'yxatdan o'tish

  // Himoyalangan (auth talab qiladi)
  onboarding: "/onboarding", // profil sozlash
  discovery: "/discovery", // hamkor topish
  lessons: "/lessons", // darslar
  videos: "/videos", // video darslar
  chat: "/chat", // suhbatlar
  saved: "/saved", // saqlangan xabarlar
  notifications: "/notifications", // bildirishnomalar

  // Dinamik route'lar — funksiya orqali
  profile: (id: string) => `/profile/${id}`, // id bo'yicha profil
  profileByUsername: (username: string) => `/@${username}`, // @username
  videoDetail: (id: string) => `/videos/${id}`, // video batafsil
  connections: (id: string) => `/profile/${id}/connections`, // obunalar
} as const;

// Auth bo'lmaganda kirib bo'lmaydigan yo'llar (middleware ishlatadi)
export const PROTECTED_PATHS: string[] = [
  ROUTES.onboarding,
  ROUTES.discovery,
  ROUTES.lessons,
  ROUTES.videos,
  ROUTES.chat,
  ROUTES.saved,
  ROUTES.notifications,
];

// Kirgan foydalanuvchini bu yo'llardan discovery'ga yo'naltiramiz
export const AUTH_PATHS: string[] = [ROUTES.login, ROUTES.register];
