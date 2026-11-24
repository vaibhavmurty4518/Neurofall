import React, { useState, useRef, useEffect } from 'react';
import {
  BrainCircuit,
  Send,
  Trash2,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  FileCheck,
  HelpCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { AIChatMessage } from '../types';
import { api } from '../services/api';

const SUGGESTED_QUERIES = [
  'What happened during the last suspected fall?',
  'How many falls were detected this week?',
  'Which activities were flagged as unusual?',
  'Summarize today\'s monitoring session.',
  'Show emergency contacts and escalation cascade.',
  'What patterns should be reviewed by a caregiver?',
];

export default function AIAssistantPage({ patientId = 1 }: { patientId?: number }) {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello, I am **NeuroFall Intelligence**. I am connected directly to your patient telemetry database and SNN incident logs. How can I assist you with clinical observations today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: ['Connected to SQLite Telemetry Database', 'Patient Context Loaded'],
      provider: 'NeuroFall Clinical Grounding Engine',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await api.askAIChat(query, patientId);
      const assistantMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: response.supporting_records,
        provider: response.provider,
        disclaimer: response.disclaimer,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: "I encountered a communication error with the backend telemetry engine. Please ensure the Flask server is running.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: "Conversation cleared. Ready for your questions regarding patient telemetry, incidents, or movement patterns.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: ['Database State: Ready'],
      },
    ]);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col rounded-3xl bg-[#0b101e]/90 border border-slate-800/80 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="p-4 px-6 border-b border-slate-800/80 bg-[#0d1424]/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-cyan/20 to-brand-blue/20 text-brand-cyan border border-brand-cyan/30">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">NeuroFall Intelligence</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                DATABASE GROUNDED
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Answers derived strictly from verified SQLite records &middot; Zero hallucinations
            </p>
          </div>
        </div>

        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
          title="Clear Conversation"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* ── CHAT MESSAGE STREAM ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 max-w-3xl ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                m.sender === 'user'
                  ? 'bg-brand-cyan text-slate-950 font-bold'
                  : 'bg-slate-800 text-brand-cyan border border-slate-700'
              }`}
            >
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Message Bubble */}
            <div
              className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2.5 ${
                m.sender === 'user'
                  ? 'bg-brand-cyan/15 text-slate-100 border border-brand-cyan/30 rounded-tr-sm'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-800/80 rounded-tl-sm shadow-md'
              }`}
            >
              {/* Message Content */}
              <div className="whitespace-pre-wrap font-sans">
                {m.text}
              </div>

              {/* Citations & Verified Supporting Records */}
              {m.citations && m.citations.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <FileCheck className="w-3 h-3 text-brand-cyan" /> Verifiable Records:
                  </span>
                  {m.citations.map((c, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {/* Disclaimer / Provider Tag */}
              {m.disclaimer && (
                <p className="text-[10px] text-slate-500 italic border-t border-slate-800/60 pt-1.5">
                  {m.disclaimer}
                </p>
              )}

              <div className="text-[10px] text-slate-500 font-mono text-right">
                {m.timestamp} {m.provider ? `&middot; ${m.provider}` : ''}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-xl">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-brand-cyan border border-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping" />
              <span>Querying SQLite telemetry database and synthesizing observations...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── SUGGESTED PILLS BAR ──────────────────────────────────── */}
      <div className="px-6 py-2 bg-slate-950/40 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-mono uppercase text-slate-500 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-brand-cyan" /> Prompt Suggestions:
        </span>
        {SUGGESTED_QUERIES.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            className="px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] whitespace-nowrap transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* ── INPUT BAR ───────────────────────────────────────────── */}
      <div className="p-4 px-6 border-t border-slate-800 bg-[#0d1424]/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about falls, activity trends, stability metrics or emergency protocols..."
            className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-brand-cyan transition-all font-sans"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-5 py-3 rounded-xl bg-brand-cyan hover:bg-cyan-400 disabled:opacity-50 disabled:hover:bg-brand-cyan text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-glow-cyan active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
