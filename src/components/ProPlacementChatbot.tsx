import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  Loader2,
  Bot,
  AlertCircle,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

interface ProPlacementChatbotProps {
  userName?: string;
  activeTab?: string;
}

const STARTER_PROMPTS = [
  'Explain Sliding Window vs Two Pointers with code',
  'Solve: Two trains cross in 12s & 18s — relative speed',
  'How do ACID properties and Indexing work in SQL?',
  'How does the 24-hour Streak & Voice Coach work?',
];

function renderInlineFormatting(text: string): React.ReactNode[] {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-200/80 text-[#0B2545] font-mono text-[11px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      return (
        <strong key={idx} className="font-bold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}

const SafeFormattedReply: React.FC<{ text: string }> = ({ text }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const segments = text.split(/(```[\s\S]*?```)/g);

  const handleCopyCode = (code: string, index: number) => {
    try {
      navigator.clipboard?.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div className="space-y-2 text-xs sm:text-[13px] leading-relaxed text-slate-800 break-words">
      {segments.map((segment, segIdx) => {
        if (segment.startsWith('```') && segment.endsWith('```')) {
          const inner = segment.slice(3, -3);
          const firstNewline = inner.indexOf('\n');
          const lang =
            firstNewline > -1 ? inner.slice(0, firstNewline).trim() : '';
          const codeBody =
            firstNewline > -1 ? inner.slice(firstNewline + 1) : inner;

          return (
            <div
              key={segIdx}
              className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 text-slate-100 my-1.5"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400">
                <span>{lang || 'code'}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(codeBody.trim(), segIdx)}
                  className="inline-flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer"
                >
                  {copiedIndex === segIdx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-[11px] font-mono leading-relaxed">
                <code>{codeBody.trim()}</code>
              </pre>
            </div>
          );
        }

        const lines = segment.split('\n');
        return (
          <div key={segIdx} className="space-y-1">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lineIdx} className="h-1" />;

              if (trimmed.startsWith('### ')) {
                return (
                  <div
                    key={lineIdx}
                    className="font-bold text-[#0B2545] text-xs pt-1"
                  >
                    {renderInlineFormatting(trimmed.slice(4))}
                  </div>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <div
                    key={lineIdx}
                    className="font-extrabold text-[#0B2545] text-[13px] pt-1"
                  >
                    {renderInlineFormatting(trimmed.slice(3))}
                  </div>
                );
              }
              if (/^[-*]\s+/.test(trimmed)) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-1">
                    <span className="text-[#D4AF37] font-bold mt-0.5">&bull;</span>
                    <span className="flex-1">
                      {renderInlineFormatting(trimmed.replace(/^[-*]\s+/, ''))}
                    </span>
                  </div>
                );
              }

              return <p key={lineIdx}>{renderInlineFormatting(trimmed)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
};

export const ProPlacementChatbot: React.FC<ProPlacementChatbotProps> = ({
  userName,
  activeTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen, messages, isLoading]);

  const sendQuestion = async (rawQuestion?: string) => {
    const text = (rawQuestion ?? input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!rawQuestion) {
      setInput('');
    }
    setIsLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => !m.isError)
        .slice(-12)
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/chatbot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          userContext: {
            name: userName || '',
            activeTab: activeTab || 'contents',
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `e_${Date.now()}`,
            role: 'model',
            text:
              data?.error ||
              'Unable to get an answer right now. Please try again.',
            isError: true,
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          role: 'model',
          text: String(data.reply),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e_${Date.now()}`,
          role: 'model',
          text: 'Network error contacting the assistant. Please check your connection and try again.',
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuestion();
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 print:hidden">
      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-2rem)] sm:w-[400px] h-[520px] max-h-[75vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-[#0B2545] via-[#13315C] to-[#1D4E89] text-white px-4 py-3.5 flex items-center justify-between gap-2 border-b border-[#D4AF37]/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">
                  Pro Placement Assistant
                </h3>
                <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                  Accurate Answers · DSA, Aptitude, CS &amp; App Help
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  title="New conversation"
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close assistant"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 bg-slate-50/70">
            {messages.length === 0 ? (
              <div className="space-y-3 py-2">
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B2545]">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>
                      Hello{userName ? `, ${userName}` : ''}! Ask me anything.
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Get accurate explanations, verified code solutions, step-by-step aptitude math, system design breakdowns, or help using Pro Placement.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                    Try Asking:
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => sendQuestion(prompt)}
                        className="text-left px-3 py-2 rounded-xl bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-xs font-medium text-slate-700 hover:text-[#0B2545] transition cursor-pointer shadow-2xs"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2.5 bg-[#0B2545] text-white text-xs sm:text-[13px] leading-relaxed shadow-xs">
                      {msg.text}
                    </div>
                  ) : msg.isError ? (
                    <div className="max-w-[92%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 shadow-2xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{msg.text}</span>
                    </div>
                  ) : (
                    <div className="max-w-[94%] rounded-2xl rounded-bl-sm px-3.5 py-3 bg-white border border-slate-200 shadow-2xs">
                      <SafeFormattedReply text={msg.text} />
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex items-start">
                <div className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 bg-white border border-slate-200 text-xs text-slate-600 flex items-center gap-2 shadow-2xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0B2545]" />
                  <span>Thinking carefully...</span>
                </div>
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask any DSA, aptitude, CS, or app question..."
              maxLength={4000}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B2545] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send question"
              className="p-2.5 rounded-xl bg-[#0B2545] hover:bg-[#13315C] text-white disabled:opacity-40 transition cursor-pointer shadow-xs shrink-0"
            >
              <Send className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? 'Minimize Assistant' : 'Open Pro Placement Assistant'}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#0B2545] to-[#1D4E89] hover:from-[#13315C] hover:to-[#0B2545] text-white font-bold text-xs shadow-xl border border-[#D4AF37]/60 transition transform hover:scale-[1.03] active:scale-95 cursor-pointer"
        >
          {isOpen ? (
            <>
              <X className="w-4 h-4 text-[#D4AF37]" />
              <span>Close Chat</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
              <span>Ask Chatbot</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
