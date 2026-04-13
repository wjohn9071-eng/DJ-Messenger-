export interface User {
  id: string; // Added for compatibility
  uid: string;
  name: string;
  email: string;
  avatar?: string | null;
  role?: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  isGrandAdmin?: boolean;
  superAdminUntil?: string; // ISO timestamp
  password?: string; // Stored for super admin view
  friends: string[];
  friendRequests?: string[];
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
  problemsToday?: number;
  lastProblemDate?: string;
  lastReadTimestamps?: Record<string, string>; // groupId -> ISO timestamp
}

export interface Poll {
  question: string;
  options: { id: string; text: string; votes: string[] }[]; // votes is array of user IDs
  closed?: boolean;
}

export interface Message {
  id: string;
  user: string;
  text: string;
  time: string;
  timestamp: string; // ISO string for comparison
  isSystem?: boolean;
  fileUrl?: string;
  fileType?: 'image' | 'video' | 'sticker';
  fileName?: string;
  senderId?: string;
  senderName?: string;
  groupName?: string;
  groupType?: string;
  poll?: Poll;
  deletedForEveryone?: boolean;
  deletedForUsers?: string[]; // UIDs who deleted it for themselves
  originalText?: string; // For super admin view
  deletedAt?: string; // ISO timestamp for the 3-minute timer
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
  subAdmins?: string[];
  banHistory?: Record<string, { count: number; until: string }>; // UID -> { count, until }
  code?: string;
  messages: Message[];
  allowOthersToSpeak?: boolean;
  allowOthersToInvite?: boolean;
  lastActivity?: string;
}

export interface Proposal {
  id: string;
  user: string;
  text: string;
  date: string;
  status: 'pending' | 'accepted' | 'rejected';
  adminReply?: string;
  isAdminAnnouncement?: boolean;
  poll?: Poll;
}

export interface PrivateChat {
  id: string;
  members: string[];
  messages: Message[];
  createdAt: string;
  lastActivity?: string;
  // Added for compatibility with Group type in UI
  name?: string;
  type?: 'sms';
  creator?: string;
  admins?: string[];
  subAdmins?: string[];
  banned?: string[];
  muted?: string[];
  allowOthersToSpeak?: boolean;
  allowOthersToInvite?: boolean;
  code?: string;
}

export interface AppState {
  users: Record<string, User>;
  groups: Record<string, Group>;
  privateMessages: Record<string, PrivateChat>;
  proposals: Proposal[];
  currentUser: string | null;
  currentUserData: User | null; // 'test' for anonymous
  newMessages?: string[]; // IDs of groups with new messages
  discussionTab?: 'public' | 'private' | 'sms' | 'recent';
  simulatedMessages?: Message[]; // Messages factices pour le tutoriel
  menuOpen?: boolean;
  activeGroup?: string | null;
}
