

export type Curriculum = 'NCERT' | 'JEE' | 'NEET' | 'Programming Help' | 'Commerce' | 'Arts' | 'CAT' | 'GATE' | 'UPSC';

export interface Task {
  text: string;
  completed: boolean;
}

export interface DailyTask {
  day: string;
  tasks: Task[];
}

export interface WeeklyPlan {
  week: number;
  topic_focus: string;
  daily_tasks: DailyTask[];
}

export interface StudyPlan {
  id: string;
  createdAt: string;
  curriculum: Curriculum;
  subject: string;
  goal: string;
  plan_title: string;
  duration_weeks: number;
  weekly_plans: WeeklyPlan[];
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    image?: string;
}

export interface TutorChatSession {
    curriculum: Curriculum;
    subject: string;
    lastUpdatedAt: string;
    messages: ChatMessage[];
}

export interface User {
  username: string;
  passwordHash: string; // Storing hashed passwords
  studyPlans: StudyPlan[];
  tutorChatHistory?: TutorChatSession[];
  companionChatHistory?: ChatMessage[];
}