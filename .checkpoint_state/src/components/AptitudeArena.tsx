import React, { useState, useEffect } from 'react';
import {
  Brain,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Play,
  Award,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
} from 'lucide-react';
import { AptitudeQuestion, AptitudePillar } from '../types';
import { CORE_APTITUDE_QUESTIONS } from '../data/aptitudeData';
import { generateProceduralAptitudeQuestion, generateMockTest } from '../utils/aptitudeGenerator';

interface AptitudeArenaProps {
  onScoreUpdate?: (score: number) => void;
}

export const AptitudeArena: React.FC<AptitudeArenaProps> = ({ onScoreUpdate }) => {
  const [activeMode, setActiveMode] = useState<'UNLIMITED' | 'TIMED_MOCK'>('UNLIMITED');

  // Unlimited Dynamic Generator State — freshly jumbled every time the user opens the app or tab
  const [selectedPillar, setSelectedPillar] = useState<AptitudePillar | 'ALL'>('ALL');
  const [currentQuestion, setCurrentQuestion] = useState<AptitudeQuestion>(() => {
    return generateProceduralAptitudeQuestion();
  });
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);

  // Jumble and reset whenever the component mounts (every time the user opens the app or switches to Aptitude)
  useEffect(() => {
    setCurrentQuestion(generateProceduralAptitudeQuestion());
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setTotalAttempted(0);
    setTotalCorrect(0);
  }, []);

  // Timed Placement Mock Assessment State
  const [mockQuestionCount, setMockQuestionCount] = useState<number>(10);
  const [mockQuestions, setMockQuestions] = useState<AptitudeQuestion[]>([]);
  const [mockActiveIndex, setMockActiveIndex] = useState(0);
  const [mockAnswers, setMockAnswers] = useState<Record<number, number>>({});
  const [mockFlagged, setMockFlagged] = useState<Record<number, boolean>>({});
  const [mockTimeRemaining, setMockTimeRemaining] = useState(600);
  const [mockStatus, setMockStatus] = useState<'CONFIG' | 'RUNNING' | 'SUBMITTED'>('CONFIG');

  // Mock Timer Loop
  useEffect(() => {
    let timer: any = null;
    if (mockStatus === 'RUNNING') {
      timer = setInterval(() => {
        setMockTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setMockStatus('SUBMITTED');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [mockStatus]);

  const handleGenerateNext = () => {
    const nextQ = generateProceduralAptitudeQuestion(
      selectedPillar === 'ALL' ? undefined : selectedPillar
    );
    setCurrentQuestion(nextQ);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
    setIsAnswerSubmitted(true);
    setTotalAttempted((prev) => prev + 1);
    if (idx === currentQuestion.correctIndex) {
      setTotalCorrect((prev) => prev + 1);
    }
    if (onScoreUpdate) onScoreUpdate(idx === currentQuestion.correctIndex ? 10 : 5);
  };

  const handleStartMockTest = () => {
    const generated = generateMockTest(mockQuestionCount);
    setMockQuestions(generated);
    setMockActiveIndex(0);
    setMockAnswers({});
    setMockFlagged({});
    setMockTimeRemaining(mockQuestionCount * 60);
    setMockStatus('RUNNING');
  };

  const handleSubmitMockTest = () => {
    setMockStatus('SUBMITTED');
    if (onScoreUpdate) onScoreUpdate(10);
  };

  const mockCorrectCount = Object.entries(mockAnswers).filter(
    ([qIdx, ans]) => mockQuestions[parseInt(qIdx, 10)]?.correctIndex === ans
  ).length;
  const mockAccuracy = mockQuestions.length > 0 ? Math.round((mockCorrectCount / mockQuestions.length) * 100) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-xs text-gray-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#B8860B]">
            <Brain className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>10,000+ Aptitude Arena</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
            Aptitude & Core CS
          </h2>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-[#FAFAFA] rounded-xl border border-gray-200 text-xs">
          <button
            onClick={() => setActiveMode('UNLIMITED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeMode === 'UNLIMITED'
                ? 'bg-white text-gray-900 shadow-xs font-semibold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Practice
          </button>
          <button
            onClick={() => setActiveMode('TIMED_MOCK')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeMode === 'TIMED_MOCK'
                ? 'bg-white text-gray-900 shadow-xs font-semibold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Timed Mock
          </button>
        </div>
      </div>

      {activeMode === 'UNLIMITED' ? (
        <div className="space-y-6">
          {/* Pillar Selector & Stats */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {(
                [
                  { id: 'ALL', label: 'All Categories' },
                  { id: 'Quantitative Aptitude', label: 'Quantitative Math' },
                  { id: 'Logical Reasoning', label: 'Logical Reasoning' },
                  { id: 'Verbal Ability', label: 'Verbal Ability' },
                  { id: 'Core CS & Data Interpretation', label: 'Core CS' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPillar(p.id);
                    const q = generateProceduralAptitudeQuestion(p.id === 'ALL' ? undefined : p.id);
                    setCurrentQuestion(q);
                    setSelectedOption(null);
                    setIsAnswerSubmitted(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    selectedPillar === p.id
                      ? 'bg-[#18181B] text-white'
                      : 'bg-[#FAFAFA] text-gray-600 border border-gray-200 hover:text-gray-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Live Stats & Manual Jumble Button */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentQuestion(
                    generateProceduralAptitudeQuestion(
                      selectedPillar === 'ALL' ? undefined : selectedPillar
                    )
                  );
                  setSelectedOption(null);
                  setIsAnswerSubmitted(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition"
                title="Jumble and load a new random question"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>Jumble Question</span>
              </button>

              <div className="flex items-center gap-3 bg-[#FAFAFA] px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs">
                <span className="text-gray-500">
                  Attempted: <strong className="text-gray-900">{totalAttempted}</strong>
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-500">
                  Correct: <strong className="text-emerald-600">{totalCorrect}</strong>
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-500">
                  Accuracy:{' '}
                  <strong className="text-[#B8860B]">
                    {totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0}%
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Current Question Card */}
          <div className="bg-[#FAFAFA] border border-gray-200 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-0.5 bg-white border border-gray-200 rounded-md font-semibold text-gray-700">
                  {currentQuestion.pillar}
                </span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600 font-medium">{currentQuestion.category}</span>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                {currentQuestion.formulaUsed ? 'Formula-based' : 'Conceptual'}
              </span>
            </div>

            <div className="text-base sm:text-lg font-medium text-gray-900 leading-relaxed">
              {currentQuestion.question}
            </div>

            {/* 4 Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQuestion.correctIndex;
                let btnStyle = 'bg-white border-gray-200 text-gray-800 hover:border-gray-400';

                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-1 ring-emerald-400';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-400';
                  } else {
                    btnStyle = 'bg-white border-gray-200 text-gray-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswerSubmitted}
                    className={`flex items-center justify-between p-4 rounded-xl border text-left text-sm font-medium transition ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold font-mono">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {isAnswerSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation & Next Button */}
            {isAnswerSubmitted && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs sm:text-sm text-gray-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-gray-900">
                    <HelpCircle className="w-4 h-4 text-[#B8860B]" />
                    <span>Step-by-Step Solution:</span>
                  </div>
                  <p className="leading-relaxed pl-6 text-gray-700 font-sans">
                    {currentQuestion.explanation}
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleGenerateNext}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#18181B] hover:bg-black text-white font-medium rounded-xl text-xs transition shadow-sm active:scale-95"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Timed Mock Test Section */
        <div>
          {mockStatus === 'CONFIG' && (
            <div className="bg-[#FAFAFA] border border-gray-200 rounded-2xl p-8 max-w-xl mx-auto text-center space-y-5">
              <Clock className="w-12 h-12 text-[#D4AF37] mx-auto" />
              <div>
                <h3 className="text-xl font-bold text-gray-900">Placement Mock Assessment</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  Practice questions in a timed environment simulating company entrance tests.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                {[5, 10, 20].map((count) => (
                  <button
                    key={count}
                    onClick={() => setMockQuestionCount(count)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border transition ${
                      mockQuestionCount === count
                        ? 'bg-[#18181B] text-white border-transparent'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {count} Questions ({count} mins)
                  </button>
                ))}
              </div>

              <button
                onClick={handleStartMockTest}
                className="px-8 py-3 bg-[#18181B] hover:bg-black text-white font-medium rounded-xl text-xs transition shadow-sm"
              >
                Start Assessment Now
              </button>
            </div>
          )}

          {mockStatus === 'RUNNING' && mockQuestions.length > 0 && (
            <div className="space-y-6">
              {/* Timer Bar */}
              <div className="flex items-center justify-between bg-[#FAFAFA] p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                  <Clock className="w-4 h-4 text-[#D4AF37]" />
                  <span>
                    Time Remaining:{' '}
                    <strong className="font-mono text-sm text-gray-900">
                      {Math.floor(mockTimeRemaining / 60)}:
                      {String(mockTimeRemaining % 60).padStart(2, '0')}
                    </strong>
                  </span>
                </div>

                <button
                  onClick={handleSubmitMockTest}
                  className="px-4 py-1.5 bg-[#18181B] hover:bg-black text-white rounded-lg text-xs font-medium transition"
                >
                  Submit Assessment
                </button>
              </div>

              {/* Active Mock Question */}
              <div className="bg-[#FAFAFA] border border-gray-200 rounded-2xl p-6 space-y-4">
                <div className="text-xs text-gray-500">
                  Question {mockActiveIndex + 1} of {mockQuestions.length}
                </div>

                <div className="text-base font-semibold text-gray-900">
                  {mockQuestions[mockActiveIndex].question}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {mockQuestions[mockActiveIndex].options.map((opt, idx) => {
                    const isSelected = mockAnswers[mockActiveIndex] === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setMockAnswers((prev) => ({ ...prev, [mockActiveIndex]: idx }));
                        }}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-left text-sm font-medium transition ${
                          isSelected
                            ? 'bg-amber-50 border-[#D4AF37] text-gray-900 font-semibold'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="w-6 h-6 rounded-md bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-mono font-bold">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setMockActiveIndex((i) => Math.max(0, i - 1))}
                    disabled={mockActiveIndex === 0}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setMockActiveIndex((i) => Math.min(mockQuestions.length - 1, i + 1))}
                    disabled={mockActiveIndex === mockQuestions.length - 1}
                    className="px-4 py-2 rounded-lg bg-[#18181B] text-white text-xs font-medium disabled:opacity-40"
                  >
                    Next Question
                  </button>
                </div>
              </div>
            </div>
          )}

          {mockStatus === 'SUBMITTED' && (
            <div className="bg-[#FAFAFA] border border-gray-200 rounded-2xl p-8 max-w-xl mx-auto text-center space-y-5">
              <Award className="w-12 h-12 text-[#D4AF37] mx-auto" />
              <h3 className="text-2xl font-bold text-gray-900">Assessment Result</h3>
              <div className="text-3xl font-extrabold text-gray-900 font-mono">
                {mockCorrectCount} / {mockQuestions.length} ({mockAccuracy}%)
              </div>
              <p className="text-xs text-gray-500">
                {mockAccuracy >= 70
                  ? 'Great performance! You are well prepared for campus aptitude tests.'
                  : 'Keep practicing with the infinite question generator to boost your speed.'}
              </p>
              <button
                onClick={() => setMockStatus('CONFIG')}
                className="px-6 py-2.5 bg-[#18181B] text-white rounded-xl text-xs font-medium"
              >
                Take Another Assessment
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
