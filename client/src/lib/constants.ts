export const SPORTS_ACTIVITIES = [
  "Archery",
  "Badminton",
  "Basketball",
  "Biking",
  "Boxing",
  "Camping",
  "Canoeing",
  "Chess",
  "Cricket",
  "Cycling",
  "Discus Throw",
  "Fencing",
  "Football",
  "Golf",
  "Gym",
  "Gymnastics",
  "Hammer Throw",
  "High Jump",
  "Hiking",
  "Hockey",
  "Horse Riding",
  "Javelin Throw",
  "Judo",
  "Kabaddi",
  "Karting",
  "Kayaking",
  "Kho-Kho",
  "Long Jump",
  "Marathon",
  "Martial Arts/ Karate",
  "Paragliding",
  "Pickleball",
  "Polo",
  "Race Walking",
  "Rappelling",
  "Rock Climbing",
  "Rowing",
  "Running",
  "Sailing",
  "Shooting",
  "Shot Put",
  "Skating",
  "Squash",
  "Surfing",
  "Swimming",
  "Table Tennis",
  "Taekwondo",
  "Tennis",
  "Throwball",
  "Trekking",
  "Triple Jump",
  "Volleyball",
  "Weightlifting",
  "Wrestling",
  "Yoga",
  "Zip Lining"
];

export const TOP_ACTIVITIES = [
  "Badminton",
  "Cricket",
  "Cycling",
  "Football",
  "Gym",
  "Running",
  "Table Tennis",
  "Tennis",
  "Volleyball",
  "Yoga"
];

export const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "learner", label: "Learner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" }
];

export const SKILL_LEVEL_COLORS = {
  beginner: { color: "#F59E0B", squares: 1, label: "Beginner" }, // Yellow/Amber
  learner: { color: "#3B82F6", squares: 2, label: "Learner" }, // Blue
  intermediate: { color: "#10B981", squares: 3, label: "Intermediate" }, // Green
  advanced: { color: "#F97316", squares: 4, label: "Advanced" }, // Orange
  expert: { color: "#8B5CF6", squares: 5, label: "Expert" } // Purple
};

export const USER_TYPES = [
  { value: "player", label: "Player" },
  { value: "coach", label: "Coach" }
];

export const PROFILE_VISIBILITY = [
  { value: "public", label: "Open to All" },
  { value: "interest_only", label: "Only visible to people I send interest to" }
];

export const DAILY_INTEREST_LIMIT = 10;

export const INTEREST_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted", 
  DECLINED: "declined",
  WITHDRAWN: "withdrawn"
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    SEND_OTP: "/api/auth/send-otp",
    VERIFY_OTP: "/api/auth/verify-otp",
    LOGOUT: "/api/auth/logout"
  },
  USERS: {
    REGISTER: "/api/users/register",
    PROFILE: "/api/users/profile",
    SEARCH: "/api/users/search"
  },
  INTERESTS: {
    SEND: "/api/interests/send",
    RECEIVED: "/api/interests/received",
    SENT: "/api/interests/sent",
    ACCEPT: (id: number) => `/api/interests/${id}/accept`,
    DECLINE: (id: number) => `/api/interests/${id}/decline`,
    WITHDRAW: (id: number) => `/api/interests/${id}`
  },
  FEED: {
    GET: "/api/feed",
    LIKE: (id: number) => `/api/feed/${id}/like`
  },
  APPLICATIONS: {
    CAREER: "/api/applications/career",
    INVESTOR: "/api/applications/investor"
  }
};
