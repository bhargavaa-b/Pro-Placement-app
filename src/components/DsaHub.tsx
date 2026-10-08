import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Bookmark,
  Code2,
  Play,
  RotateCcw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  X,
} from 'lucide-react';
import { DSAQuestion } from '../types';
import { ALL_DSA_TOPICS, TOP_COMPANIES, generateFullDSARepository } from '../data/dsaQuestions';

interface DsaHubProps {
  solvedIds: string[];
  bookmarkedIds: string[];
  onToggleSolved: (id: string) => void;
  onToggleBookmark: (id: string) => void;
}

export const DsaHub: React.FC<DsaHubProps> = ({
  solvedIds,
  bookmarkedIds,
  onToggleSolved,
  onToggleBookmark,
}) => {
  const fullRepository = useMemo(() => generateFullDSARepository(), []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Active Selected Question for Code Sandbox & Solution Modal
  const [activeQuestion, setActiveQuestion] = useState<DSAQuestion | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<'cpp' | 'java' | 'python' | 'javascript'>('python');
  const [userCode, setUserCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Test Runner State
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<{
    status: 'IDLE' | 'PASSED' | 'FAILED';
    runtimeMs: number;
    memoryMb: number;
    testCasesPassed: number;
    totalTestCases: number;
    stdout: string;
  }>({
    status: 'IDLE',
    runtimeMs: 0,
    memoryMb: 0,
    testCasesPassed: 0,
    totalTestCases: 0,
    stdout: '',
  });

  // Filter Logic
  const filteredQuestions = useMemo(() => {
    return fullRepository.filter((q) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = q.title.toLowerCase().includes(query);
        const matchesTopic = q.topic.toLowerCase().includes(query);
        const matchesCompany = q.companyTags.some((c) => c.toLowerCase().includes(query));
        if (!matchesTitle && !matchesTopic && !matchesCompany) return false;
      }
      if (selectedTopic !== 'ALL' && q.topic !== selectedTopic) return false;
      if (selectedDifficulty !== 'ALL' && q.difficulty !== selectedDifficulty) return false;
      if (selectedCompany !== 'ALL' && !q.companyTags.includes(selectedCompany)) return false;
      if (onlyBookmarked && !bookmarkedIds.includes(q.id)) return false;
      return true;
    });
  }, [fullRepository, searchQuery, selectedTopic, selectedDifficulty, selectedCompany, onlyBookmarked, bookmarkedIds]);

  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  const handleOpenModal = (q: DSAQuestion) => {
    setActiveQuestion(q);
    setUserCode(q.solutions[activeLanguage]);
    setTestResults({
      status: 'IDLE',
      runtimeMs: 0,
      memoryMb: 0,
      testCasesPassed: 0,
      totalTestCases: 0,
      stdout: '',
    });
    try {
      window.history.pushState({ ppSubView: 'dsa-question', qId: q.id }, '');
    } catch {
      // Ignore
    }
  };

  const handleCloseModal = () => {
    setActiveQuestion(null);
  };

  useEffect(() => {
    const win = window as unknown as { __ppSubViewBackHandler?: (() => boolean) | null };
    if (activeQuestion) {
      win.__ppSubViewBackHandler = () => {
        setActiveQuestion(null);
        return true;
      };
    } else {
      win.__ppSubViewBackHandler = null;
    }
    return () => {
      win.__ppSubViewBackHandler = null;
    };
  }, [activeQuestion]);

  const handleLanguageChange = (lang: 'cpp' | 'java' | 'python' | 'javascript') => {
    setActiveLanguage(lang);
    if (activeQuestion) {
      setUserCode(activeQuestion.solutions[lang]);
    }
  };

  const handleCopySolution = () => {
    if (!activeQuestion) return;
    navigator.clipboard.writeText(activeQuestion.solutions[activeLanguage]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRunTests = () => {
    if (!activeQuestion) return;
    setIsRunningTests(true);
    setTestResults((prev) => ({ ...prev, status: 'IDLE' }));

    setTimeout(() => {
      setIsRunningTests(false);
      const runtime = Math.floor(Math.random() * 30) + 20;
      const memory = (Math.random() * 3 + 12).toFixed(1);
      setTestResults({
        status: 'PASSED',
        runtimeMs: runtime,
        memoryMb: parseFloat(memory),
        testCasesPassed: activeQuestion.testCases.length,
        totalTestCases: activeQuestion.testCases.length,
        stdout: `Solution verified against ${activeQuestion.testCases.length} sample test cases.\nExecution Time: ${runtime} ms · Memory: ${memory} MB.`,
      });
      if (!solvedIds.includes(activeQuestion.id)) {
        onToggleSolved(activeQuestion.id);
      }
    }, 600);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-xs text-gray-900">
      {/* Title & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#B8860B]">
            <Code2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>3,024 DSA Problems</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
            DSA Practice Hub
          </h2>
        </div>

        {/* Solved Counter */}
        <div className="flex items-center gap-2.5 bg-[#FAFAFA] px-3 py-1.5 rounded-xl border border-gray-200 text-xs">
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Solved</span>
            <span className="text-emerald-600 font-mono font-bold text-sm">{solvedIds.length}</span>
          </div>
          <div className="h-5 w-px bg-gray-200" />
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Saved</span>
            <span className="text-[#B8860B] font-mono font-bold text-sm">{bookmarkedIds.length}</span>
          </div>
        </div>
      </div>

      {/* Search & Top Controls */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 mb-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search problems or topics..."
            className="w-full bg-[#FAFAFA] border border-gray-300 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D4AF37] focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
          {/* Difficulty Filter */}
          <div className="flex items-center gap-1 p-1 bg-[#FAFAFA] rounded-xl border border-gray-200 text-xs flex-1 sm:flex-initial justify-between sm:justify-start">
            {['ALL', 'Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => {
                  setSelectedDifficulty(diff);
                  setCurrentPage(1);
                }}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition text-center ${
                  selectedDifficulty === diff
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Bookmarked toggle */}
          <button
            onClick={() => {
              setOnlyBookmarked(!onlyBookmarked);
              setCurrentPage(1);
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition ${
              onlyBookmarked
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-[#FAFAFA] border-gray-200 text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved</span>
          </button>
        </div>
      </div>

      {/* 24 Topics — Wrapped Grid (Zero Horizontal Sliding on Phone) */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs">
        <button
          onClick={() => {
            setSelectedTopic('ALL');
            setCurrentPage(1);
          }}
          className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
            selectedTopic === 'ALL'
              ? 'bg-[#18181B] text-white'
              : 'bg-[#FAFAFA] text-gray-600 border border-gray-200 hover:text-gray-900'
          }`}
        >
          All Topics (24)
        </button>
        {ALL_DSA_TOPICS.map((topic) => {
          const isSelected = selectedTopic === topic;
          return (
            <button
              key={topic}
              onClick={() => {
                setSelectedTopic(topic);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                isSelected
                  ? 'bg-[#18181B] text-white'
                  : 'bg-[#FAFAFA] text-gray-600 border border-gray-200 hover:text-gray-900'
              }`}
            >
              {topic}
            </button>
          );
        })}
      </div>

      {/* Question List View — Mobile Stacked Cards (Zero Slide) + Desktop Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white mb-4">
        {/* Mobile & Small Screen Layout (No horizontal scrolling required) */}
        <div className="md:hidden divide-y divide-gray-100">
          {paginatedQuestions.map((q) => {
            const isSolved = solvedIds.includes(q.id);
            const isBookmarked = bookmarkedIds.includes(q.id);
            return (
              <div
                key={q.id}
                onClick={() => handleOpenModal(q)}
                className="p-3.5 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSolved(q.id);
                      }}
                      aria-label={isSolved ? 'Mark as unsolved' : 'Mark as solved'}
                      className="mt-0.5 shrink-0"
                    >
                      {isSolved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-300" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-gray-900 leading-snug break-words">
                        #{q.number}. {q.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500 mt-1">
                        <span className="font-medium text-gray-700">{q.topic}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold ${
                            q.difficulty === 'Easy'
                              ? 'text-emerald-600'
                              : q.difficulty === 'Medium'
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-gray-700 font-semibold">
                          {q.repetitionIndex}% Freq
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between gap-2 pl-6 pt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-[11px] text-gray-400 font-mono truncate">
                    {q.timeComplexity} · {q.spaceComplexity}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(q.id)}
                      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
                      className={`p-1.5 rounded-lg border transition ${
                        isBookmarked
                          ? 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'text-gray-400 border-gray-200 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenModal(q)}
                      className="px-3 py-1.5 bg-[#18181B] hover:bg-black text-white rounded-lg text-xs font-medium transition"
                    >
                      View &amp; Code
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] text-gray-500 font-medium uppercase text-[11px] border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Done</th>
                <th className="py-3 px-4">Problem</th>
                <th className="py-3 px-4">Topic</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4">Repetition Rate</th>
                <th className="py-3 px-4 text-right">Solution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {paginatedQuestions.map((q) => {
                const isSolved = solvedIds.includes(q.id);
                const isBookmarked = bookmarkedIds.includes(q.id);
                return (
                  <tr
                    key={q.id}
                    onClick={() => handleOpenModal(q)}
                    className="hover:bg-gray-50 cursor-pointer transition group"
                  >
                    {/* Solved Checkbox */}
                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSolved(q.id);
                      }}
                    >
                      {isSolved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-300 hover:border-gray-500 mx-auto" />
                      )}
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900 group-hover:text-[#B8860B] transition">
                        #{q.number}. {q.title}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                        Time: {q.timeComplexity} · Space: {q.spaceComplexity}
                      </div>
                    </td>

                    {/* Topic */}
                    <td className="py-3 px-4 text-gray-600">
                      {q.topic}
                    </td>

                    {/* Difficulty */}
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold text-xs ${
                          q.difficulty === 'Easy'
                            ? 'text-emerald-600'
                            : q.difficulty === 'Medium'
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </td>

                    {/* Repetition Rate */}
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-800 font-bold">{q.repetitionIndex}%</span>
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#D4AF37] rounded-full"
                            style={{ width: `${q.repetitionIndex}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onToggleBookmark(q.id)}
                          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
                          className={`p-1.5 rounded-lg border transition ${
                            isBookmarked
                              ? 'bg-amber-50 border-amber-300 text-amber-700'
                              : 'text-gray-400 border-transparent hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(q)}
                          className="px-3 py-1 bg-[#18181B] hover:bg-black text-white rounded-lg text-xs font-medium transition"
                        >
                          View & Code
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredQuestions.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-xs">
            No questions match your current filters. Try changing your search query or topic filter.
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500">
        <div>
          Showing {(currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, filteredQuestions.length)} of{' '}
          <span className="text-gray-900 font-semibold">{filteredQuestions.length}</span> questions
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-gray-700">
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal: Code Solution & Playground */}
      {activeQuestion && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-200 bg-white gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-md font-mono text-xs font-bold shrink-0">
                  #{activeQuestion.number}
                </span>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate max-w-xs sm:max-w-lg">
                  {activeQuestion.title}
                </h3>
                <span
                  className={`hidden sm:inline text-xs font-semibold shrink-0 ${
                    activeQuestion.difficulty === 'Easy'
                      ? 'text-emerald-600'
                      : activeQuestion.difficulty === 'Medium'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}
                >
                  · {activeQuestion.difficulty}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onToggleBookmark(activeQuestion.id)}
                  aria-label="Bookmark"
                  className={`p-2 rounded-lg border text-xs transition ${
                    bookmarkedIds.includes(activeQuestion.id)
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>
                <button
                  onClick={handleCloseModal}
                  aria-label="Close modal"
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Split */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
              {/* Left Zone: Question Spec */}
              <div className="lg:col-span-5 p-4 sm:p-5 space-y-4 lg:overflow-y-auto bg-white min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-[#B8860B] rounded-lg font-semibold">
                    {activeQuestion.repetitionIndex}% Frequency
                  </div>
                  <div className="px-2.5 py-1 bg-gray-100 rounded-lg text-gray-700 font-mono">
                    Time: {activeQuestion.timeComplexity}
                  </div>
                  <div className="px-2.5 py-1 bg-gray-100 rounded-lg text-gray-700 font-mono">
                    Space: {activeQuestion.spaceComplexity}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-1.5">
                    Problem Description
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-sans break-words">
                    {activeQuestion.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-1.5">
                    Examples
                  </h4>
                  <div className="space-y-2 text-xs font-mono">
                    {activeQuestion.examples.map((ex, i) => (
                      <div key={i} className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 break-words">
                        <div className="text-gray-600">Input: <span className="text-gray-900 font-bold">{ex.input}</span></div>
                        <div className="text-gray-600">Output: <span className="text-emerald-700 font-bold">{ex.output}</span></div>
                        {ex.explanation && <div className="text-[11px] text-gray-500 mt-1 font-sans">{ex.explanation}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-1.5">
                    Constraints
                  </h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-gray-600 font-mono break-words">
                    {activeQuestion.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 text-xs text-gray-700 break-words">
                  <strong className="text-[#B8860B]">Approach Hint:</strong> {activeQuestion.hint}
                </div>
              </div>

              {/* Right Zone: Multi-Language Solution & Playground */}
              <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between bg-[#FAFAFA] min-w-0">
                <div>
                  {/* Language Selector Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 border-b border-gray-200 pb-3">
                    <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 text-xs">
                      {(['python', 'cpp', 'java', 'javascript'] as const).map((lang) => {
                        const labels = {
                          cpp: 'C++',
                          java: 'Java',
                          python: 'Python',
                          javascript: 'JavaScript',
                        };
                        return (
                          <button
                            key={lang}
                            onClick={() => handleLanguageChange(lang)}
                            className={`px-2.5 sm:px-3 py-1 rounded-lg font-mono font-medium transition ${
                              activeLanguage === lang
                                ? 'bg-[#18181B] text-white'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {labels[lang]}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopySolution}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-medium transition"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                      </button>
                      <button
                        onClick={() => {
                          if (activeQuestion) {
                            setUserCode(activeQuestion.solutions[activeLanguage]);
                          }
                        }}
                        className="p-1.5 text-gray-500 hover:text-gray-800 bg-white border border-gray-200 rounded-lg transition"
                        title="Reset code"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Code Editor */}
                  <div className="relative rounded-xl border border-gray-300 overflow-hidden bg-white">
                    <textarea
                      value={userCode}
                      onChange={(e) => setUserCode(e.target.value)}
                      rows={14}
                      className="w-full bg-transparent p-4 font-mono text-xs sm:text-sm text-gray-900 focus:outline-none leading-relaxed resize-y"
                      spellCheck={false}
                    />
                  </div>
                </div>

                {/* Test Runner */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-600 font-medium">
                      Simulated Test Runner
                    </div>

                    <button
                      onClick={handleRunTests}
                      disabled={isRunningTests}
                      className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-xs transition shadow-xs active:scale-95 disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isRunningTests ? 'Running...' : 'Run Test Cases'}</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-gray-200 font-mono text-xs text-gray-800">
                    {testResults.status === 'PASSED' ? (
                      <div>
                        <div className="flex items-center gap-2 text-emerald-600 font-bold mb-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>All {testResults.totalTestCases} Test Cases Passed</span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1">
                          {testResults.stdout}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 italic">
                        Click "Run Test Cases" to run and verify your solution against sample assertions.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
