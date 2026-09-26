import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Headphones,
  CheckCircle,
  Clock,
  ArrowRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';

interface ChatMessage {
  id: string;
  senderType: 'USER' | 'BOT' | 'AGENT';
  message: string;
  intent?: string;
  suggestedActions?: Array<{ label: string; action: string; payload?: any }>;
  extractedData?: any;
  createdAt: string;
}

export const ChatbotWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [sessionToken] = useState<string>(() => {
    const saved = localStorage.getItem('resolvai_chat_session');
    if (saved) return saved;
    const newToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('resolvai_chat_session', newToken);
    return newToken;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  // Load chat session history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get(`/chatbot/history/${sessionToken}`);
        if (res.data.success && res.data.data.messages?.length > 0) {
          setMessages(res.data.data.messages);
        } else {
          // Send initial greeting
          sendInitialGreeting();
        }
      } catch {
        sendInitialGreeting();
      }
    };

    loadHistory();
  }, [sessionToken]);

  // Socket listener for live agent messages
  useEffect(() => {
    const socket = getSocket();
    socket.emit('join:chat', sessionToken);

    const handleIncomingMessage = (newMsg: any) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setIsTyping(false);
    };

    socket.on('chat:message', handleIncomingMessage);
    return () => {
      socket.off('chat:message', handleIncomingMessage);
    };
  }, [sessionToken]);

  const sendInitialGreeting = () => {
    const greetingMsg: ChatMessage = {
      id: 'greeting_1',
      senderType: 'BOT',
      message: `Hello${user ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm ResolvAI, your 24/7 intelligent municipal & service assistant.\n\nI can help you file a complaint, check real-time ticket progress, or answer questions. How can I help you today?`,
      intent: 'GREETING',
      suggestedActions: [
        { label: '📝 File a Complaint', action: 'START_COMPLAINT' },
        { label: '🔍 Check Status (CMP-2026-1001)', action: 'CHECK_STATUS', payload: 'CMP-2026-1001' },
        { label: '⏱️ What are your SLAs?', action: 'ASK_QUESTION', payload: 'What are the expected resolution times?' },
        { label: '🎧 Talk to Human Agent', action: 'ESCALATE' },
      ],
      createdAt: new Date().toISOString(),
    };
    setMessages([greetingMsg]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputValue).trim();
    if (!content) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      senderType: 'USER',
      message: content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await api.post('/chatbot/message', {
        sessionToken,
        message: content,
      });

      if (res.data.success) {
        const botData = res.data.data;
        const botMsg: ChatMessage = {
          id: botData.messageId || `bot_${Date.now()}`,
          senderType: 'BOT',
          message: botData.reply,
          intent: botData.intent,
          suggestedActions: botData.suggestedActions,
          extractedData: botData.extractedData,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        senderType: 'BOT',
        message: 'Sorry, I encountered a temporary connection glitch. Please try again or reach out to human support.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = async (actionItem: { label: string; action: string; payload?: any }) => {
    if (actionItem.action === 'CONFIRM_SUBMIT_COMPLAINT') {
      setIsTyping(true);
      try {
        const res = await api.post('/chatbot/submit-complaint', {
          sessionToken,
          draft: actionItem.payload,
        });

        if (res.data.success) {
          const comp = res.data.data;
          const confirmMsg: ChatMessage = {
            id: `submit_${Date.now()}`,
            senderType: 'BOT',
            message: `🎉 **Success! Ticket Registered**\n\n• **Ticket ID**: \`${comp.ticketNumber}\`\n• **Title**: ${comp.title}\n• **Assigned Department**: ${comp.department?.name || 'Operations'}\n• **Status**: ⏳ Pending Review\n\nOur team has received this and will keep you notified!`,
            intent: 'FILE_COMPLAINT',
            suggestedActions: [
              { label: 'Check Status', action: 'CHECK_STATUS', payload: comp.ticketNumber },
              { label: 'File Another Complaint', action: 'START_COMPLAINT' },
            ],
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, confirmMsg]);
        }
      } catch (err: any) {
        // Fallback
        handleSendMessage('Please submit this complaint.');
      } finally {
        setIsTyping(false);
      }
      return;
    }

    if (actionItem.action === 'START_COMPLAINT') {
      handleSendMessage('I want to file a new complaint.');
      return;
    }

    if (actionItem.action === 'CHECK_STATUS' && actionItem.payload) {
      handleSendMessage(`Check status of ${actionItem.payload}`);
      return;
    }

    if (actionItem.action === 'ASK_QUESTION' && actionItem.payload) {
      handleSendMessage(actionItem.payload);
      return;
    }

    if (actionItem.action === 'ESCALATE') {
      handleSendMessage('Please escalate this to a human agent.');
      return;
    }

    // Default: send label text
    handleSendMessage(actionItem.label);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500 text-white shadow-xl shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all duration-300"
          aria-label="Open AI Assistant"
        >
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 opacity-60 blur-sm group-hover:opacity-100 transition duration-300 animate-pulse"></div>
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <span className="sr-only">Open AI Chatbot</span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          className={`flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 animate-slide-up ${
            isExpanded
              ? 'w-[92vw] sm:w-[650px] h-[85vh] max-h-[750px]'
              : 'w-[92vw] sm:w-[420px] h-[580px]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-brand-900 to-indigo-950 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-cyan-400 flex items-center justify-center text-white shadow-md">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-bold text-sm">ResolvAI Assistant</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div className="text-[11px] text-cyan-200">24/7 Automated Triage & Support</div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 dark:bg-slate-950/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.senderType === 'USER' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-end space-x-2 max-w-[85%]">
                  {msg.senderType !== 'USER' && (
                    <div className="w-6 h-6 rounded-lg bg-brand-600 flex-shrink-0 flex items-center justify-center text-white text-[10px] mb-1">
                      {msg.senderType === 'AGENT' ? <Headphones className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm whitespace-pre-line ${
                      msg.senderType === 'USER'
                        ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-br-none'
                        : msg.senderType === 'AGENT'
                        ? 'bg-amber-500 text-white rounded-bl-none'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none'
                    }`}
                  >
                    {msg.message}
                  </div>

                  {msg.senderType === 'USER' && (
                    <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center text-slate-600 dark:text-slate-300 text-[10px] mb-1">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Suggested Action Buttons if present */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-2 ml-8 flex flex-wrap gap-1.5">
                    {msg.suggestedActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleActionClick(action)}
                        className="px-2.5 py-1 text-xs rounded-full font-medium bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-colors flex items-center space-x-1"
                      >
                        <span>{action.label}</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs">
                <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center text-white text-[10px]">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="flex space-x-1 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Footer Controls / Input Box */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question or file a complaint..."
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="p-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
