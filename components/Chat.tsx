import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, PrescriptionData } from '../types';
import { getChatResponse } from '../services/geminiService';
import { UserIcon, HealthBotIcon, TrashIcon } from './icons';
import { saveChatHistory, loadChatHistory, clearChatHistory } from '../utils/cookieManager';

interface AIChatProps {
  prescriptionData: PrescriptionData | null;
  storageConsent: 'pending' | 'accepted' | 'declined';
}

const AIChat: React.FC<AIChatProps> = ({ prescriptionData, storageConsent }) => {
  const initialMessage: ChatMessage = {
      role: 'model',
      content: "Hello! I'm your health & wellness assistant. You can ask me general questions about health topics. How can I help you today?\n\nRemember, I am not a doctor and this is not medical advice."
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (storageConsent === 'accepted') {
      const savedMessages = loadChatHistory();
      if (savedMessages && savedMessages.length > 0) {
        return savedMessages;
      }
    }
    return [initialMessage];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  useEffect(() => {
    // Only save if consent is given and there's more than the initial welcome message.
    if (storageConsent === 'accepted' && messages.length > 1) {
      saveChatHistory(messages);
    }
  }, [messages, storageConsent]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMessage];
      const response = await getChatResponse(chatHistory, prescriptionData);
      const modelMessage: ChatMessage = { role: 'model', content: response };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        role: 'model',
        content: "Sorry, I encountered an error. Please try again. \n\nDisclaimer: This is for informational purposes only and not a substitute for professional medical advice."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (storageConsent === 'accepted') {
      clearChatHistory();
    }
    setMessages([initialMessage]);
  };


  return (
    <div className="flex flex-col h-full max-h-[80vh] bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
      <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
        <h3 className="font-bold text-gray-800 dark:text-slate-200">AI Health Assistant</h3>
        <button
          onClick={handleClearChat}
          title="Clear chat history"
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors py-1 px-3 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
        >
          <TrashIcon className="h-4 w-4" />
          Clear Chat
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="w-9 h-9 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex-shrink-0 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <HealthBotIcon className="w-5 h-5" />
              </div>
            )}
            <div
              className={`max-w-xl p-3 px-4 rounded-2xl shadow-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-cyan-600 dark:bg-cyan-500 text-white rounded-br-none'
                  : 'bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
             {msg.role === 'user' && (
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-600 flex-shrink-0 flex items-center justify-center">
                 <UserIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex-shrink-0 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                    <HealthBotIcon className="w-5 h-5 animate-pulse-bot" />
                </div>
                <div className="max-w-lg p-3 px-4 rounded-2xl shadow-sm bg-slate-100 dark:bg-slate-700 rounded-bl-none flex items-center">
                   <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-slate-400">
                      <span>Thinking...</span>
                   </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-slate-700">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="w-full p-3 pr-24 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-transparent transition"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-5 rounded-full transition-colors disabled:bg-cyan-300 dark:disabled:bg-cyan-800 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-cyan-300"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIChat;