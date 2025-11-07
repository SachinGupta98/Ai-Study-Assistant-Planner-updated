

import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { Curriculum, StudyPlan, Task } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = ai.models;

/**
 * A centralized error handler for Gemini API calls.
 * It inspects the error and returns a more user-friendly error message.
 * @param error - The error object caught.
 * @param context - A string describing the operation that failed (e.g., 'generateStudyPlan').
 * @returns An Error object with a user-friendly message.
 */
const handleGeminiError = (error: any, context: string): Error => {
    console.error(`Error during '${context}':`, error);

    let userMessage = "An unexpected error occurred. Please try again.";

    // Check for network connectivity issues first
    if (!navigator.onLine) {
        return new Error("You appear to be offline. Please check your internet connection.");
    }

    const errorMessage = (error?.message || '').toLowerCase();

    if (error instanceof SyntaxError) {
        userMessage = "The AI returned a response in an unexpected format. Please try again.";
    } else if (errorMessage.includes('api_key') || errorMessage.includes('permission denied')) {
        // Per guidelines, we don't ask the user for a key, but we can signal a config issue.
        userMessage = "There's a configuration issue with the AI service. Unable to proceed.";
    } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        userMessage = "The service is currently busy. Please wait a moment and try again.";
    } else if (errorMessage.includes('500') || errorMessage.includes('internal')) {
        userMessage = "The AI service is experiencing technical difficulties. Please try again later.";
    } else if (errorMessage.includes('safety') || errorMessage.includes('blocked')) {
        userMessage = "The request was blocked for safety reasons. Please adjust your prompt and try again.";
    } else if (errorMessage.includes('failed to fetch')) {
        // Generic network-related error
        userMessage = "Could not connect to the AI service. Please check your network connection.";
    } else {
        // Use a context-specific fallback message
        switch (context) {
            case 'generateStudyPlan':
                userMessage = "Failed to generate study plan. The model might be unable to create a plan for the selected options.";
                break;
            case 'getTutorResponseStream':
                userMessage = "Failed to get a response from the AI tutor.";
                break;
            case 'getGeneralChatResponseStream':
                userMessage = "Failed to get a response from the AI companion.";
                break;
            case 'formatCode':
                userMessage = "Failed to format the code. Please try again.";
                break;
        }
    }

    return new Error(userMessage);
};


const studyPlanSchema = {
    type: Type.OBJECT,
    properties: {
        plan_title: {
            type: Type.STRING,
            description: "A creative and motivating title for the study plan."
        },
        duration_weeks: {
            type: Type.INTEGER,
            description: "The total number of weeks for the study plan."
        },
        weekly_plans: {
            type: Type.ARRAY,
            description: "An array of weekly study plans.",
            items: {
                type: Type.OBJECT,
                properties: {
                    week: {
                        type: Type.INTEGER,
                        description: "The week number (e.g., 1, 2, 3)."
                    },
                    topic_focus: {
                        type: Type.STRING,
                        description: "The main topics or chapters to focus on for the week."
                    },
                    daily_tasks: {
                        type: Type.ARRAY,
                        description: "A breakdown of tasks for each day of the week.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                day: {
                                    type: Type.STRING,
                                    description: "The day of the week (e.g., Monday, Tuesday)."
                                },
                                tasks: {
                                    type: Type.ARRAY,
                                    description: "A list of specific tasks or sub-topics for the day.",
                                    items: { type: Type.STRING }
                                }
                            },
                             required: ['day', 'tasks']
                        }
                    }
                },
                required: ['week', 'topic_focus', 'daily_tasks']
            }
        }
    },
    required: ['plan_title', 'duration_weeks', 'weekly_plans']
};


export const generateStudyPlan = async (curriculum: Curriculum, subject: string, goal: string, duration: string): Promise<any> => {
    const prompt = `
        You are an expert academic planner. Create a detailed, week-by-week plan based on the user's request.
        
        Category: ${curriculum}
        Topic: ${subject}
        User's Goal: "${goal}"
        Desired Duration: ${duration}
        
        Generate a comprehensive plan that breaks down the learning goal into manageable weekly and daily tasks. 
        The plan should be practical and motivating. Ensure the daily tasks are specific and actionable.
        If the topic is academic, focus on syllabus coverage. 
        If it's for a competitive exam like CAT, GATE, or UPSC, create a rigorous, strategy-focused plan covering core concepts, practice, and revision.
    `;

    try {
        const response = await model.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: studyPlanSchema,
                temperature: 0.7
            }
        });
        
        const jsonText = response.text.trim();
        const parsedPlan = JSON.parse(jsonText);

        // Transform tasks from strings to objects for progress tracking
        const transformedWeeklyPlans = parsedPlan.weekly_plans.map((week: any) => ({
            ...week,
            daily_tasks: week.daily_tasks.map((day: any) => ({
                ...day,
                tasks: day.tasks.map((taskText: string): Task => ({ text: taskText, completed: false }))
            }))
        }));

        return { ...parsedPlan, weekly_plans: transformedWeeklyPlans };

    } catch (error) {
        throw handleGeminiError(error, 'generateStudyPlan');
    }
};

let tutorChatInstance: Chat | null = null;
let generalChatInstance: Chat | null = null;

export const startTutorChat = (curriculum: Curriculum, subject: string) => {
    let systemInstruction;

    if (curriculum === 'Programming Help') {
        systemInstruction = `You are "Vidya AI", an expert AI coding mentor.
        Your current context is helping with: ${subject}.
        Adopt the persona of an expert programmer and senior developer. 
        Provide clear explanations for programming concepts, help debug code, suggest best practices, and write efficient, well-documented code examples.
        When an image of code is provided, analyze it, identify errors, and suggest improvements.
        Use markdown for clear formatting, especially for code blocks (\`\`\`language). Be precise and encouraging.`;
    } else if (['CAT', 'GATE', 'UPSC'].includes(curriculum)) {
        systemInstruction = `You are "Vidya AI", an expert AI mentor for Indian competitive exams.
        Your current context is ${curriculum} - ${subject}.
        Adopt the persona of a seasoned coach. Provide in-depth explanations of complex topics, offer strategic advice for exam preparation, analyze past trends, and help with time management and revision strategies.
        If an image of a problem is provided, solve it with a detailed, step-by-step explanation suitable for a high-level competitive exam.
        Use markdown for clear formatting of formulas, lists, and key points.`;
    } else {
        systemInstruction = `You are "Vidya AI", an expert AI tutor specializing in Indian academic curricula like NCERT, JEE, and NEET. 
        Your current context is ${curriculum} - ${subject}.
        Explain concepts clearly, provide step-by-step solutions to problems, and be encouraging and friendly. 
        If an image is provided, analyze it and answer any questions related to it.
        Use markdown for formatting, especially for code blocks, formulas, and lists to make your explanations easy to understand.`;
    }

    tutorChatInstance = ai.chats.create({
        model: 'gemini-2.5-pro',
        config: {
            systemInstruction: systemInstruction,
        },
    });
};


export const getTutorResponseStream = async (
    message: string,
    image?: { base64: string, mimeType: string }
) => {
    if (!tutorChatInstance) {
        throw new Error("Chat not initialized. Call startTutorChat first.");
    }

    const parts: ({ text: string } | { inlineData: { data: string, mimeType: string } })[] = [];

    if (image) {
        parts.push({
            inlineData: {
                data: image.base64,
                mimeType: image.mimeType,
            }
        });
    }

    if (message) {
        parts.push({ text: message });
    }

    if (parts.length === 0) {
        throw new Error("Cannot send an empty message.");
    }

    try {
        const result = await tutorChatInstance.sendMessageStream({ message: { parts } });
        return result;
    } catch (error) {
        throw handleGeminiError(error, 'getTutorResponseStream');
    }
};

export const startGeneralChat = () => {
    const systemInstruction = `You are "Vidya AI" in a friendly, conversational mode. 
        Your role is to be a supportive and empathetic companion. 
        You can chat with students about their day, hobbies, real-life problems, or any general topic they want to discuss, including images they might share. 
        Your tone should be encouraging, positive, and non-judgmental. 
        You are not a formal tutor in this mode, so avoid academic lectures unless the user specifically asks for help with a concept. 
        Focus on being a good listener and a friendly conversational partner. Use markdown for readability.`;
    
    generalChatInstance = ai.chats.create({
        model: 'gemini-2.5-pro',
        config: {
            systemInstruction: systemInstruction,
        },
    });
};

export const getGeneralChatResponseStream = async (
    message: string,
    image?: { base64: string, mimeType: string }
) => {
    if (!generalChatInstance) {
        throw new Error("General chat not initialized. Call startGeneralChat first.");
    }
    
    const parts: ({ text: string } | { inlineData: { data: string, mimeType: string } })[] = [];

    if (image) {
        parts.push({
            inlineData: {
                data: image.base64,
                mimeType: image.mimeType,
            }
        });
    }

    if (message) {
        parts.push({ text: message });
    }

    if (parts.length === 0) {
        throw new Error("Cannot send an empty message.");
    }


    try {
        const result = await generalChatInstance.sendMessageStream({ message: { parts } });
        return result;
    } catch (error) {
        throw handleGeminiError(error, 'getGeneralChatResponseStream');
    }
};

export const formatCode = async (code: string): Promise<string> => {
    const prompt = `
        You are a code formatting tool. 
        Your ONLY task is to format the following code snippet according to standard conventions for its language.
        Do NOT add explanations, comments, or change the logic.
        Only return the formatted code inside a single markdown code block.
        
        Code to format:
        ${code}
    `;

    try {
        const response = await model.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                temperature: 0.1
            }
        });

        const fullText = response.text.trim();
        // Regex to extract code from a markdown block, handles optional language identifier
        const codeBlockRegex = /```(?:\w*\n)?([\s\S]*?)```/;
        const match = fullText.match(codeBlockRegex);

        if (match && match[1]) {
            return match[1].trim();
        }

        // Fallback if the model doesn't use a code block, just returns the raw code
        return fullText;

    } catch (error) {
        throw handleGeminiError(error, 'formatCode');
    }
};
