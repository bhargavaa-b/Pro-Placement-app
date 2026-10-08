export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type DSATopic =
  | 'Arrays'
  | 'Sliding Window'
  | 'Two Pointers'
  | 'Monotonic Stacks'
  | 'Binary Trees'
  | 'BSTs'
  | 'Heaps & Priority Queues'
  | '1D Dynamic Programming'
  | '2D Dynamic Programming'
  | 'Graphs & BFS/DFS'
  | 'Disjoint Set Union (DSU)'
  | 'Segment Trees & Fenwick'
  | 'System Design'
  | 'Backtracking'
  | 'Trie'
  | 'Greedy Algorithms'
  | 'Bit Manipulation'
  | 'String Algorithms & KMP'
  | 'Intervals'
  | 'Math & Number Theory'
  | 'Linked Lists'
  | 'Matrix & 2D Grids'
  | 'Binary Search'
  | 'LRU / LFU Cache & Design';

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface DSAQuestion {
  id: string;
  number: number;
  title: string;
  topic: DSATopic;
  difficulty: Difficulty;
  repetitionIndex: number; // e.g. 99 (99% repeated)
  companyTags: string[];
  description: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  timeComplexity: string;
  spaceComplexity: string;
  solutions: {
    cpp: string;
    java: string;
    python: string;
    javascript: string;
  };
  testCases: TestCase[];
  hint: string;
}

export type AptitudePillar =
  | 'Quantitative Aptitude'
  | 'Logical Reasoning'
  | 'Verbal Ability'
  | 'Core CS & Data Interpretation';

export interface AptitudeQuestion {
  id: string;
  pillar: AptitudePillar;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  stepByStepDerivation?: string[];
  formulaUsed?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  dreamCompany: string;
  targetPackage: string; // e.g. "₹20L - ₹30L"
  targetRole: string;
  university: string;
  graduationYear: string;
  consentGiven: boolean;
  avatarSeed: string;
  streakDays: number;
  lastStreakDate?: string;
  dailyTasksDate?: string;
  loginStartDate?: string;
  lastActiveTimestamp?: number;
  streakShieldActive: boolean;
  highGameScore: number;
  solvedDSAIds: string[];
  solvedAptitudeIds: string[];
  bookmarkedDSAIds: string[];
  dailyTasksCompleted: {
    dsaToday: boolean;
    aptitudeToday: boolean;
    commToday: boolean;
    streakShieldChecked: boolean;
  };
  mockTestsTaken: number;
  avgMockAccuracy: number;
}

export type VoiceAccent = 'US' | 'UK' | 'Indian' | 'Australian' | 'Canadian';

export interface AccentConfig {
  id: VoiceAccent;
  name: string;
  label: string;
  flag: string;
  interviewerName: string;
  roleTitle: string;
  langCode: string;
  pitch: number;
  rate: number;
}

export interface CurriculumDay {
  day: number;
  month: number;
  monthTitle: string;
  topic: string;
  dsaTargets: string[];
  aptitudeTarget: string;
  communicationTarget: string;
  completed: boolean;
}
