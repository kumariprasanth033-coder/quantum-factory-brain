import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Minimize2, 
  Maximize2, 
  Sparkles, 
  Zap, 
  RefreshCw, 
  CalendarClock, 
  Cpu, 
  Layers, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { ChatMessage } from '../types';

interface FactoryChatbotProps {
  onTriggerReoptimize?: () => void;
  onNavigateToGantt?: () => void;
  onNavigateToMachines?: () => void;
  onNavigateToJobs?: () => void;
  onNavigateToAnalytics?: () => void;
}

export const FactoryChatbot: React.FC<FactoryChatbotProps> = ({
  onTriggerReoptimize,
  onNavigateToGantt,
  onNavigateToMachines,
  onNavigateToJobs,
  onNavigateToAnalytics
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "👋 Hello! I am your **Quantum Factory Brain Copilot**. I have real-time access to your floor telemetry, active schedule metrics, and machine status. How can I help you optimize production today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await api.sendChatMessage(query);
      const assistantMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'assistant',
        text: res.reply || 'Factory telemetry synced.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: res.suggestedAction
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'assistant',
        text: `⚠️ Telemetry sync note: ${err.message || 'Unable to query live factory backend.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: { type: string; label: string }) => {
    if (action.type === 'reoptimize' && onTriggerReoptimize) {
      onTriggerReoptimize();
      setMessages((prev) => [
        ...prev,
        {
          id: 'action-' + Date.now(),
          sender: 'system',
          text: '⚡ Triggered Quantum-Inspired Schedule Re-optimization across active machines.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else if (action.type === 'view_gantt' && onNavigateToGantt) {
      onNavigateToGantt();
    } else if (action.type === 'view_machines' && onNavigateToMachines) {
      onNavigateToMachines();
    } else if (action.type === 'view_jobs' && onNavigateToJobs) {
      onNavigateToJobs();
    } else if (action.type === 'view_analytics' && onNavigateToAnalytics) {
      onNavigateToAnalytics();
    }
  };

  const quickPrompts = [
    "How many machines are available?",
    "Which machine is the bottleneck?",
    "Are any jobs delayed?",
    "What is our current schedule makespan?",
    "Re-optimize schedule"
  ];

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right) */}
      {!isOpen && (
        <button
          id="floating-factory-chatbot-btn"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold text-xs shadow-2xl shadow-cyan-900/50 hover:from-cyan-500 hover:to-blue-500 hover:scale-105 active:scale-95 transition-all border border-cyan-400/30 group"
          title="Open Factory AI Copilot"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-300"></span>
          </span>
          <Bot className="w-5 h-5 text-white" />
          <span className="tracking-wide">Factory Copilot</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          id="factory-chatbot-window"
          className={`fixed bottom-6 right-6 z-50 flex flex-col bg-[#0b1329] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
            isMinimized ? 'w-80 h-16' : 'w-96 sm:w-[420px] h-[550px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#070d1e] border-b border-slate-800 text-white select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold tracking-tight text-white">Quantum Factory Brain AI</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Connected to active shop floor</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Copilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#070e24]/70">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-cyan-600 text-slate-950 font-medium rounded-tr-none'
                          : msg.sender === 'system'
                          ? 'bg-slate-850/80 border border-cyan-500/30 text-cyan-300 rounded-tl-none font-mono text-[11px]'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      <div className="whitespace-pre-line">
                        {msg.text}
                      </div>

                      {msg.suggestedAction && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => handleActionClick(msg.suggestedAction!)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-[11px] font-semibold transition-all hover:scale-102"
                          >
                            <Zap className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{msg.suggestedAction.label}</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span className="text-[11px]">Consulting factory telemetry...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Bar */}
              <div className="px-3 py-2 bg-[#091024] border-t border-slate-850 overflow-x-auto no-scrollbar flex items-center gap-1.5">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="flex-shrink-0 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-medium transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-[#070d1e] border-t border-slate-800 flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  id="factory-chat-input"
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about machines, bottlenecks, delays..."
                  className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  id="factory-chat-send-btn"
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-all disabled:opacity-40 disabled:hover:bg-cyan-600"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
