export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username?: string; // Unique alphanumeric string (max 10 chars)
  avatarId?: string; // 'robot' | 'cat' | 'astronaut'
  photoURL?: string;
  role: 'student' | 'admin';
  createdAt: string;
}

export type Mood = 'happy' | 'stressed' | 'tired' | 'focused' | 'sad';

export interface CalendarEvent {
  id: string;
  uid: string;
  title: string;
  date: string; // ISO date string
  type: 'exam' | 'hackathon' | 'study-block' | 'holiday';
  registered?: boolean;
  registrationDate?: string; // ISO date string
  daysUnregistered?: number;
}

export interface Task {
  id: string;
  uid: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'class' | 'study' | 'break' | 'event' | 'task';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  description?: string;
}

export interface StudyPlan {
  id: string;
  uid: string;
  subject: string;
  topics: {
    name: string;
    weightage: string;
    deadline: string;
    subtopics: string[];
    isImportant?: boolean;
  }[];
  examDates: {
    type: string;
    date: string;
  }[];
}

export interface Opportunity {
  id: string;
  uid?: string; // Optional for system-generated
  title: string;
  location: string;
  date: string;
  type: 'hackathon' | 'workshop' | 'seminar';
  link: string;
  relevance: string;
}

export interface CommunityPost {
  id: string;
  uid: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  hubId: string;
  createdAt: string;
  likes: string[]; // Array of uids
}

export interface SparkTask {
  title: string;
  duration: string;
  benefit: string;
}

export interface Habit {
  id: string;
  uid: string;
  title: string;
  icon: string;
  color: string;
  streak: number;
  lastCompleted?: string; // ISO date string
  history: string[]; // List of ISO date strings (YYYY-MM-DD)
}
