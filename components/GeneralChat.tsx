import React, { useState, useEffect, useRef, useCallback } from 'react';
import { startGeneralChat, getGeneralChatResponseStream } from '../services/geminiService';
import { getCompanionChatHistory, saveCompanionChatHistory } from '../services/authService';
import { ChatMessage } from '../types';
import Spinner from './Spinner';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { SendIcon } from './icons/SendIcon';
import { UserMessage, ModelMessage } from './ChatMessage';
import { fileToDataUrl } from '../utils/fileUtils';

const GeneralChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  useEffect(() => {
    if (selectedImage) {
        const objectUrl = URL.createObjectURL(selectedImage);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    } else {
        setPreviewUrl(null);
    }
  }, [selectedImage]);

  useEffect(() => {
    startGeneralChat();
    
    const savedChat = getCompanionChatHistory();
    if (savedChat && savedChat.length > 0) {
        setMessages(savedChat);
    } else {
        setMessages([{ role: 'model', text: "Hi there! Feel free to chat with me about anything on your mind. How's your day going?", image: undefined }]);
    }
    
    // Cleanup function to save chat on unmount
    return () => {
      saveCompanionChatHistory(messagesRef.current);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = useCallback(async () => {
    if ((!input.trim() && !selectedImage) || isTyping) return;

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
        const stream = await getGeneralChatResponseStream(userMessageText, imagePayload);
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
        console.error("Error from AI companion:", error);
        setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.', image: undefined }]);
    } finally {
        setIsTyping(false);
    }
  }, [input, selectedImage, isTyping]);
  
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

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700">
        <h2 className="text-lg font-bold text-white">AI Companion</h2>
        <p className="text-sm text-slate-400">Your friendly space to chat and unwind</p>
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
            placeholder="Type your message or add a photo..."
            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 pr-24 text-white resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            rows={2}
            disabled={isTyping}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isTyping || !!selectedImage}
                className="p-2 text-slate-400 hover:text-cyan-400 disabled:text-slate-600 disabled:cursor-not-allowed transition rounded-full hover:bg-slate-600"
                aria-label="Attach image"
            >
                <PaperclipIcon className="w-6 h-6" />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={(!input.trim() && !selectedImage) || isTyping}
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

export default GeneralChat;