

import React, { useState, useCallback } from 'react';
import { generateStudyPlan } from '../services/geminiService';
import { saveStudyPlan } from '../services/authService';
import { Curriculum, StudyPlan, WeeklyPlan, DailyTask, Task } from '../types';
import TopicSelector from './TopicSelector';
import Spinner from './Spinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { ACADEMIC_DATA } from '../constants';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface WeeklyPlanCardProps {
  weekData: WeeklyPlan;
  onToggleTask?: (day: string, taskIndex: number) => void;
}

export const WeeklyPlanCard: React.FC<WeeklyPlanCardProps> = ({ weekData, onToggleTask }) => {
    return (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-cyan-400">Week {weekData.week}: {weekData.topic_focus}</h3>
            <div className="mt-3 space-y-3">
                {weekData.daily_tasks.map((dayPlan) => (
                    <div key={dayPlan.day}>
                        <p className="font-semibold text-slate-300">{dayPlan.day}</p>
                        <ul className="space-y-1 mt-1">
                            {dayPlan.tasks.map((task, idx) => (
                                <li key={idx} className="flex items-center gap-3 ml-4">
                                    <input
                                        type="checkbox"
                                        id={`task-${weekData.week}-${dayPlan.day}-${idx}`}
                                        checked={task.completed}
                                        onChange={onToggleTask ? () => onToggleTask(dayPlan.day, idx) : undefined}
                                        disabled={!onToggleTask}
                                        className={`w-4 h-4 rounded bg-slate-700 border-slate-500 text-cyan-500 focus:ring-cyan-600 ${!onToggleTask ? 'cursor-not-allowed' : ''}`}
                                    />
                                    <label 
                                        htmlFor={`task-${weekData.week}-${dayPlan.day}-${idx}`}
                                        className={`text-slate-400 ${task.completed ? 'line-through text-slate-500' : ''} ${onToggleTask ? 'cursor-pointer' : ''}`}
                                    >
                                        {task.text}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};


const StudyPlanner: React.FC = () => {
  const [curriculum, setCurriculum] = useState<Curriculum>('JEE');
  const [subject, setSubject] = useState<string>(ACADEMIC_DATA['JEE'].subjects[0]);
  const [goal, setGoal] = useState<string>('Crack the exam with a top rank');
  const [duration, setDuration] = useState<string>('3 months');
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlanSaved, setIsPlanSaved] = useState<boolean>(false);

  const handleGeneratePlan = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPlan(null);
    setIsPlanSaved(false); // Reset save state
    try {
      const result = await generateStudyPlan(curriculum, subject, goal, duration);
      
      const newPlan: StudyPlan = {
          ...result,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          curriculum,
          subject,
          goal,
      };
      
      setPlan(newPlan);

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [curriculum, subject, goal, duration]);

  const handleSavePlan = useCallback(async () => {
    if (!plan) return;
    try {
        await saveStudyPlan(plan);
        setIsPlanSaved(true);
    } catch (err) {
        console.error("Failed to save plan:", err);
        setError("Could not save the plan. Please try again.");
    }
  }, [plan]);
  
  const handleToggleTask = useCallback((weekIndex: number, day: string, taskIndex: number) => {
    if (!plan) return;

    // Create a deep enough copy to avoid mutation issues
    const updatedPlan = JSON.parse(JSON.stringify(plan)) as StudyPlan;
    
    const week = updatedPlan.weekly_plans[weekIndex];
    if (!week) return;

    const dayTasks = week.daily_tasks.find(d => d.day === day);
    if (dayTasks && dayTasks.tasks[taskIndex]) {
        dayTasks.tasks[taskIndex].completed = !dayTasks.tasks[taskIndex].completed;
        setPlan(updatedPlan);
        // Auto-save progress
        saveStudyPlan(updatedPlan);
    }
  }, [plan]);


  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Create Your Personalized Study Plan</h2>
        <TopicSelector 
            curriculum={curriculum}
            setCurriculum={setCurriculum}
            subject={subject}
            setSubject={setSubject}
            disabled={isLoading}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="goal" className="block text-sm font-medium text-slate-300 mb-1">Your Goal</label>
                <input 
                    type="text" 
                    id="goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    placeholder="e.g., Cover entire syllabus"
                />
            </div>
            <div>
                <label htmlFor="duration" className="block text-sm font-medium text-slate-300 mb-1">Duration</label>
                <input 
                    type="text" 
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    placeholder="e.g., 6 weeks"
                />
            </div>
        </div>
        <button
          onClick={handleGeneratePlan}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition duration-200"
        >
          {isLoading ? <Spinner /> : <SparklesIcon className="w-5 h-5" />}
          {isLoading ? 'Generating Plan...' : 'Generate with AI'}
        </button>
      </div>

      {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-md">{error}</div>}

      {plan && (
        <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center md:flex md:items-center md:justify-between">
                <div className="md:text-left">
                    <h2 className="text-xl font-bold text-white">{plan.plan_title}</h2>
                    <p className="text-slate-400">A {plan.duration_weeks}-week roadmap for {plan.subject} ({plan.curriculum})</p>
                </div>
                <div className="mt-4 md:mt-0">
                     <button
                        onClick={handleSavePlan}
                        disabled={isPlanSaved}
                        className="flex items-center justify-center gap-2 w-full md:w-auto bg-cyan-600 hover:bg-cyan-700 disabled:bg-green-800/50 disabled:border-green-700 disabled:text-green-300 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition duration-200 border border-transparent"
                    >
                        {isPlanSaved ? <CheckCircleIcon className="w-5 h-5" /> : <BookmarkIcon className="w-5 h-5" />}
                        {isPlanSaved ? 'Saved to History' : 'Save Plan'}
                    </button>
                </div>
            </div>
            <div className="space-y-4">
                {plan.weekly_plans.map((week, index) => (
                    <WeeklyPlanCard 
                        key={week.week} 
                        weekData={week} 
                        onToggleTask={(day, taskIndex) => handleToggleTask(index, day, taskIndex)}
                    />
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;