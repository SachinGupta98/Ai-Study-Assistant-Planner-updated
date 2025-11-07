import React, { useState, useEffect, useRef, useCallback } from 'react';
import { startTutorChat, getTutorResponseStream, formatCode } from '../services/geminiService';
import { getTutorChatHistory, saveTutorChatSession } from '../services/authService';
import { Curriculum, ChatMessage } from '../types';
import TopicSelector from './TopicSelector';
import Spinner from './Spinner';
import { ACADEMIC_DATA } from '../constants';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { SendIcon } from './icons/SendIcon';
import { UserMessage, ModelMessage } from './ChatMessage';
import { CodeBracketIcon } from './icons/CodeBracketIcon';
import { fileToDataUrl } from '../utils/fileUtils';


const TutorChat: React.FC = () => {
  const [curriculum, setCurriculum] = useState<Curriculum>('Programming Help');
  const [subject, setSubject] = useState<string>(ACADEMIC_DATA['Programming Help'].subjects[0]);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesRef = useRef(messages);
  const sessionDetailsRef = useRef({ curriculum, subject });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Save chat on component unmount
  useEffect(() => {
    return () => {
      if (isSessionStarted) {
          saveTutorChatSession({
              curriculum: sessionDetailsRef.current.curriculum,
              subject: sessionDetailsRef.current.subject,
              messages: messagesRef.current,
          });
      }
    };
  }, [isSessionStarted]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (selectedImage) {
        const objectUrl = URL.createObjectURL(selectedImage);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    } else {
        setPreviewUrl(null);
    }
  }, [selectedImage]);

  const handleStartSession = useCallback(() => {
    // Save previous chat session if one was active
    if (isSessionStarted) {
        saveTutorChatSession({
            curriculum: sessionDetailsRef.current.curriculum,
            subject: sessionDetailsRef.current.subject,
            messages: messagesRef.current,
        });
    }

    sessionDetailsRef.current = { curriculum, subject };
    startTutorChat(curriculum, subject);
    setIsSessionStarted(true);
    
    // Check for existing chat history for this topic
    const history = getTutorChatHistory();
    const savedSession = history.find(s => s.curriculum === curriculum && s.subject === subject);

    if (savedSession && savedSession.messages.length > 0) {
        setMessages(savedSession.messages);
        return;
    }
    
    // No history found, start with a greeting
    let initialMessage = `Hi! I'm Vidya AI, your personal tutor for ${subject}. How can I help you today? You can ask me questions or upload an image of a problem.`;
    if (curriculum === 'Programming Help') {
        initialMessage = `Hi! I'm Vidya AI, your expert coding mentor for ${subject}. Ask me to explain a concept, debug your code, or show you best practices!`;
    }
    setMessages([{ role: 'model', text: initialMessage, image: undefined }]);
  }, [curriculum, subject, isSessionStarted]);
  
  const handleChangeTopic = useCallback(() => {
    if (isSessionStarted) {
        saveTutorChatSession({
            curriculum: sessionDetailsRef.current.curriculum,
            subject: sessionDetailsRef.current.subject,
            messages: messagesRef.current,
        });
    }
    setIsSessionStarted(false);
  }, [isSessionStarted]);


  const handleSendMessage = useCallback(async () => {
    if ((!input.trim() && !selectedImage) || isTyping || isFormatting) return;

    const userMessageText = input.trim();
    let userMessageImage: string | undefined = undefined;
    let imagePayload: { base64: string, mimeType: string } | undefined = undefined;
    
    if (selectedImage) {
        try {
            const dataUrl = await fileToDataUrl(selectedImage);
            userMessageImage = dataUrl;
            imagePayload = {
                base64: dataUrl.split(',')[1],
                mimeType: selectedImage.type
            };
        } catch (error) {
            console.error("Error processing image:", error);
            // Maybe set an error state here
            return;
        }
    }

    const newMessage: ChatMessage = { role: 'user', text: userMessageText, image: userMessageImage };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setSelectedImage(null);
    setPreviewUrl(null);
    setIsTyping(true);

    try {
        const stream = await getTutorResponseStream(userMessageText, imagePayload);
        let responseText = '';
        setMessages(prev => [...prev, { role: 'model', text: '', image: undefined }]);

        for await (const chunk of stream) {
            responseText += chunk.text;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'model', text: responseText, image: undefined };
                return newMessages;
            });
        }
    } catch (error) {
        console.error("Error from AI tutor:", error);
        setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.', image: undefined }]);
    } finally {
        setIsTyping(false);
    }
  }, [input, selectedImage, isTyping, isFormatting]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setSelectedImage(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
      setSelectedImage(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  const handleFormatCode = useCallback(async () => {
    if (!input.trim() || isFormatting || isTyping) return;

    setIsFormatting(true);
    try {
        const formattedCode = await formatCode(input);
        setInput(formattedCode);
    } catch (error) {
        console.error("Failed to format code:", error);
        // We could show a toast or a temporary error message here.
    } finally {
        setIsFormatting(false);
    }
  }, [input, isFormatting, isTyping]);
  
  if (!isSessionStarted) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center h-full">
        <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-white text-center">Start AI Tutor Session</h2>
          <TopicSelector 
            curriculum={curriculum}
            setCurriculum={setCurriculum}
            subject={subject}
            setSubject={setSubject}
            disabled={false}
          />
          <button
            onClick={handleStartSession}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
          >
            Start Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700">
        <h2 className="text-lg font-bold text-white">AI Tutor: {subject} ({curriculum})</h2>
        <button 
          onClick={handleChangeTopic} 
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          Change Topic
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          msg.role === 'user'
            ? <UserMessage key={index} text={msg.text} image={msg.image} />
            : <ModelMessage key={index}>{msg.text}</ModelMessage>
        ))}
        {isTyping && <ModelMessage><Spinner /></ModelMessage>}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 bg-slate-800/80 backdrop-blur-sm border-t border-slate-700">
        <div className="relative">
            {previewUrl && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-slate-900 rounded-lg border border-slate-600">
                    <img src={previewUrl} alt="Preview" className="h-24 w-auto rounded" />
                    <button 
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-slate-700 rounded-full text-white hover:bg-slate-600"
                    >
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
            )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask a question or describe the image..."
            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 pr-36 text-white resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            rows={3}
            disabled={isTyping || isFormatting}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {curriculum === 'Programming Help' && (
                <button
                    onClick={handleFormatCode}
                    disabled={!input.trim() || isFormatting || isTyping}
                    className="p-2 text-slate-400 hover:text-cyan-400 disabled:text-slate-600 disabled:cursor-not-allowed transition rounded-full hover:bg-slate-600"
                    aria-label="Format code"
                    title="Format Code"
                >
                    {isFormatting ? <Spinner /> : <CodeBracketIcon className="w-6 h-6" />}
                </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isTyping || isFormatting || !!selectedImage}
                className="p-2 text-slate-400 hover:text-cyan-400 disabled:text-slate-600 disabled:cursor-not-allowed transition rounded-full hover:bg-slate-600"
                aria-label="Attach image"
            >
                <PaperclipIcon className="w-6 h-6" />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={(!input.trim() && !selectedImage) || isTyping || isFormatting}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-bold p-2 rounded-md transition duration-200"
              aria-label="Send message"
            >
              <SendIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorChat;