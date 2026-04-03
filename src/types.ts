export interface User {
  username: string;
  password?: string;
  avatar?: string | null;
  isAdmin: boolean;
  friends: string[];
  pinnedGroups?: string[];
  notificationsEnabled?: boolean;
  bgColor?: string;
  notifications?: boolean;
  proposalsToday?: number;
  lastProposalDate?: string;
  autoHideSidebar?: boolean;
  lastSeen?: string;
  tutorialCompleted?: boolean;
  botQuestionsToday?: number;
  lastBotQuestionDate?: string;
  lastReadTimestamps?: Record<string, string>; // groupId -> ISO timestamp
}

export interface Message {
  id: string;
  user: string;
  text: string;
  time: string;
  timestamp: string; // ISO string for comparison
  isSystem?: boolean;
}

export interface Group {
  id: string;
  type: 'public' | 'private';
  name: string;
  avatar?: string;
  reason?: string;
  reasonDetail?: string;
  creator: string;
  admins: string[];
  members: string[];
  banned: string[];
  muted: string[];
  code?: string;
  messages: Message[];
}

export interface Proposal {
  id: string;
  user: string;
  text: string;
  date: string;
  status: 'pending' | 'accepted' | 'rejected';
  adminReply?: string;
  isAdminAnnouncement?: boolean;
}

export interface AppState {
  users: Record<string, User>;
  groups: Record<string, Group>;
  proposals: Proposal[];
  currentUser: string | null; // 'test' for anonymous
  newMessages?: string[]; // IDs of groups with new messages
  discussionTab?: 'public' | 'private' | 'sms' | 'recent';
  simulatedMessages?: Message[]; // Messages factices pour le tutoriel
  menuOpen?: boolean;
}
