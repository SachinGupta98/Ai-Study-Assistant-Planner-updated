

import React, { useState, useEffect, useCallback } from 'react';
import { getStudyPlanHistory, getTutorChatHistory, getCompanionChatHistory, saveStudyPlan } from '../services/authService';
import { StudyPlan, TutorChatSession, ChatMessage } from '../types';
import { WeeklyPlanCard } from './StudyPlanner';
import { UserMessage, ModelMessage } from './ChatMessage';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { GeneralChatIcon } from './icons/GeneralChatIcon';


const PlanHistoryCard: React.FC<{ plan: StudyPlan }> = ({ plan: initialPlan }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(initialPlan);

    const createdAt = new Date(currentPlan.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const handleToggleTask = useCallback((weekIndex: number, day: string, taskIndex: number) => {
        const updatedPlan = JSON.parse(JSON.stringify(currentPlan)) as StudyPlan;
        
        const week = updatedPlan.weekly_plans[weekIndex];
        if (!week) return;

        const dayTasks = week.daily_tasks.find(d => d.day === day);
        if (dayTasks && dayTasks.tasks[taskIndex]) {
            dayTasks.tasks[taskIndex].completed = !dayTasks.tasks[taskIndex].completed;
            setCurrentPlan(updatedPlan);
            saveStudyPlan(updatedPlan).catch(err => {
                console.error("Failed to save plan progress from history:", err);
                setCurrentPlan(currentPlan); // Revert on failure
            });
        }
    }, [currentPlan]);

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-white">{currentPlan.plan_title}</h3>
                        <p className="text-sm text-slate-400">
                           {currentPlan.curriculum} - {currentPlan.subject} | Created on {createdAt}
                        </p>
                    </div>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className={`w-6 h-6 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                </div>
            </button>
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
                    <p className="text-slate-300"><span className="font-semibold">Goal:</span> {currentPlan.goal}</p>
                    {currentPlan.weekly_plans.map((week, index) => (
                        <WeeklyPlanCard 
                            key={week.week} 
                            weekData={week} 
                            onToggleTask={(day, taskIndex) => handleToggleTask(index, day, taskIndex)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const ChatHistoryCard: React.FC<{ session: TutorChatSession }> = ({ session }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const lastUpdated = new Date(session.lastUpdatedAt).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left">
                 <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-white">{session.subject} ({session.curriculum})</h3>
                        <p className="text-sm text-slate-400">
                           {session.messages.length} messages | Last updated on {lastUpdated}
                        </p>
                    </div>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className={`w-6 h-6 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                </div>
            </button>
            {isExpanded && (
                 <div className="mt-4 pt-4 border-t border-slate-700 h-96 overflow-y-auto p-2 space-y-4 bg-slate-900/50 rounded">
                    {session.messages.map((msg, index) => (
                        msg.role === 'user'
                            ? <UserMessage key={index} text={msg.text} image={msg.image} />
                            : <ModelMessage key={index}>{msg.text}</ModelMessage>
                    ))}
                </div>
            )}
        </div>
    );
};


const History: React.FC = () => {
    const [plans, setPlans] = useState<StudyPlan[]>([]);
    const [tutorChats, setTutorChats] = useState<TutorChatSession[]>([]);
    const [companionChat, setCompanionChat] = useState<ChatMessage[]>([]);

    useEffect(() => {
        setPlans(getStudyPlanHistory());
        setTutorChats(getTutorChatHistory().sort((a,b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()));
        setCompanionChat(getCompanionChatHistory());
    }, []);

    return (
        <div className="p-4 md:p-6 space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"><BookOpenIcon className="w-6 h-6 text-cyan-400" /> Study Plan History</h2>
                {plans.length === 0 ? (
                    <p className="text-slate-400">Your generated study plans will appear here.</p>
                ) : (
                    <div className="space-y-4">
                        {plans.map(plan => <PlanHistoryCard key={plan.id} plan={plan} />)}
                    </div>
                )}
            </div>
            
            <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"><ChatBubbleIcon className="w-6 h-6 text-cyan-400" /> AI Tutor Chat History</h2>
                {tutorChats.length === 0 ? (
                    <p className="text-slate-400">Your conversations with the AI Tutor will be saved here.</p>
                ) : (
                    <div className="space-y-4">
                        {tutorChats.map(session => <ChatHistoryCard key={`${session.curriculum}-${session.subject}`} session={session} />)}
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"><GeneralChatIcon className="w-6 h-6 text-cyan-400" /> AI Companion Chat History</h2>
                {companionChat.length <= 1 ? (
                     <p className="text-slate-400">Your conversations with the AI Companion will be saved here.</p>
                ) : (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 h-[500px] overflow-y-auto space-y-4">
                        {companionChat.map((msg, index) => (
                             msg.role === 'user'
                                ? <UserMessage key={index} text={msg.text} image={msg.image} />
                                : <ModelMessage key={index}>{msg.text}</ModelMessage>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;