

import { User, StudyPlan, TutorChatSession, ChatMessage, Curriculum } from '../types';

// In a real app, this would be an API call to a backend.
// For this demo, we use localStorage as a mock database.
const USERS_KEY = 'ai-study-assistant-users';
const SESSION_KEY = 'ai-study-assistant-session';

// Helper to get all users from localStorage
const getUsers = (): Record<string, User> => {
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : {};
};

// Helper to save all users to localStorage
const saveUsers = (users: Record<string, User>) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// A simple (and insecure) hashing function for demonstration.
// In a real app, use a robust library like bcrypt.
const simpleHash = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};

export const signUp = async (username: string, password: string): Promise<string> => {
    const users = getUsers();
    if (users[username]) {
        throw new Error("User already exists.");
    }
    if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
    }

    const passwordHash = await simpleHash(password);
    
    users[username] = {
        username,
        passwordHash,
        studyPlans: [],
        tutorChatHistory: [],
        companionChatHistory: []
    };
    
    saveUsers(users);
    sessionStorage.setItem(SESSION_KEY, username);
    return username;
};

export const login = async (username: string, password: string): Promise<string> => {
    const users = getUsers();
    const user = users[username];
    if (!user) {
        throw new Error("Invalid username or password.");
    }
    
    const passwordHash = await simpleHash(password);
    if (user.passwordHash !== passwordHash) {
        throw new Error("Invalid username or password.");
    }

    sessionStorage.setItem(SESSION_KEY, username);
    return username;
};

export const logout = () => {
    const users = localStorage.getItem(USERS_KEY);
    sessionStorage.clear();
    localStorage.clear();
    // Preserve the user database after clearing everything else
    if (users) {
        localStorage.setItem(USERS_KEY, users);
    }
};

export const getCurrentUser = (): string | null => {
    return sessionStorage.getItem(SESSION_KEY);
};

export const saveStudyPlan = async (plan: StudyPlan): Promise<void> => {
    const username = getCurrentUser();
    if (!username) {
        throw new Error("No user logged in.");
    }

    const users = getUsers();
    const user = users[username];
    if (user) {
        const existingPlanIndex = user.studyPlans.findIndex(p => p.id === plan.id);
        if (existingPlanIndex > -1) {
            // Update existing plan to persist progress
            user.studyPlans[existingPlanIndex] = plan;
        } else {
            // Add new plan to the beginning of the array
            user.studyPlans.unshift(plan);
        }
        users[username] = user;
        saveUsers(users);
    }
};

export const getStudyPlanHistory = (): StudyPlan[] => {
    const username = getCurrentUser();
    if (!username) return [];

    const users = getUsers();
    const user = users[username];
    const plans = user ? user.studyPlans : [];

    // Data migration for older plan formats
    return plans.map(plan => {
        if (!plan.weekly_plans) return { ...plan, weekly_plans: [] }; // Ensure weekly_plans exists
        
        const needsMigration = plan.weekly_plans.some(week =>
            week.daily_tasks.some(day => day.tasks.length > 0 && typeof (day.tasks[0] as any) === 'string')
        );

        if (needsMigration) {
            return {
                ...plan,
                weekly_plans: plan.weekly_plans.map(week => ({
                    ...week,
                    daily_tasks: week.daily_tasks.map(day => ({
                        ...day,
                        tasks: (day.tasks as any[]).map(task =>
                            typeof task === 'string' ? { text: task, completed: false } : task
                        )
                    }))
                }))
            };
        }
        return plan;
    });
};

export const saveTutorChatSession = (session: { curriculum: Curriculum, subject: string, messages: ChatMessage[] }) => {
    const username = getCurrentUser();
    if (!username || session.messages.length <= 1) return;

    const users = getUsers();
    const user = users[username];
    if (user) {
        if (!user.tutorChatHistory) user.tutorChatHistory = [];
        const existingSessionIndex = user.tutorChatHistory.findIndex(s => s.curriculum === session.curriculum && s.subject === session.subject);
        
        const newSession: TutorChatSession = {
            ...session,
            lastUpdatedAt: new Date().toISOString()
        };

        if (existingSessionIndex > -1) {
            user.tutorChatHistory[existingSessionIndex] = newSession;
        } else {
            user.tutorChatHistory.push(newSession);
        }
        saveUsers(users);
    }
};

export const getTutorChatHistory = (): TutorChatSession[] => {
    const username = getCurrentUser();
    if (!username) return [];

    const users = getUsers();
    const user = users[username];
    return user?.tutorChatHistory ?? [];
};

export const saveCompanionChatHistory = (messages: ChatMessage[]) => {
    const username = getCurrentUser();
    if (!username || messages.length <= 1) return;

    const users = getUsers();
    const user = users[username];
    if (user) {
        user.companionChatHistory = messages;
        saveUsers(users);
    }
};

export const getCompanionChatHistory = (): ChatMessage[] => {
    const username = getCurrentUser();
    if (!username) return [];

    const users = getUsers();
    const user = users[username];
    return user?.companionChatHistory ?? [];
};