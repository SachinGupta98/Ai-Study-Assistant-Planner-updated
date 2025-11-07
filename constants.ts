
import { Curriculum } from './types';

export const ACADEMIC_DATA: Record<Curriculum, { subjects: string[] }> = {
  'NCERT': {
    subjects: ['Physics (11th)', 'Physics (12th)', 'Chemistry (11th)', 'Chemistry (12th)', 'Maths (11th)', 'Maths (12th)', 'Biology (11th)', 'Biology (12th)'],
  },
  'JEE': {
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
  },
  'NEET': {
    subjects: ['Physics', 'Chemistry', 'Biology'],
  },
  'Programming Help': {
    subjects: ['Python', 'C', 'C++', 'Java', 'Full Stack Web Development', 'Frontend Development (HTML, CSS, JS, React)', 'Backend Development (Node.js, PHP)', 'App Development (Android/iOS)'],
  },
  'Commerce': {
    subjects: ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'English'],
  },
  'Arts': {
    subjects: ['History', 'Political Science', 'Geography', 'Sociology', 'Psychology', 'English'],
  },
  'CAT': {
    subjects: ['Quantitative Aptitude', 'Verbal Ability & Reading Comprehension', 'Data Interpretation & Logical Reasoning'],
  },
  'GATE': {
    subjects: ['Computer Science', 'Mechanical Engineering', 'Electronics & Communication', 'Civil Engineering'],
  },
  'UPSC': {
    subjects: ['Indian Polity & Governance', 'History of India & Indian National Movement', 'Indian & World Geography', 'Indian Economy', 'General Science'],
  }
};