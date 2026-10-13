import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Target,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import {
  CURRICULUM_MONTHS,
  generate270DaysCurriculum,
} from '../data/curriculumData';
import { CurriculumDay } from '../types';

interface CurriculumRoadmapProps {
  onStartDSA?: (dsaTitle: string) => void;
  onStartComm?: () => void;
  onStartAptitude?: () => void;
  onDayCompleted?: () => void;
}

export const CurriculumRoadmap: React.FC<CurriculumRoadmapProps> = ({
  onStartDSA,
  onStartComm,
  onStartAptitude,
  onDayCompleted,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [allDays, setAllDays] = useState<CurriculumDay[]>(() => {
    const fresh = generate270DaysCurriculum();
    const saved = localStorage.getItem('pro_placement_curriculum_days');
    if (saved) {
      try {
        const parsed: CurriculumDay[] = JSON.parse(saved);
        return fresh.map((fd) => {
          const match = parsed.find((p) => p.day === fd.day);
          return match
            ? {
                ...fd,
                completed: match.completed,
                dailyTasks:
                  match.dailyTasks && match.dailyTasks.length === (fd.dailyTasks?.length || 0)
                    ? match.dailyTasks
                    : fd.dailyTasks,
              }
            : fd;
        });
      } catch {
        return fresh;
      }
    }
    return fresh;
  });

  const [activeDayNumber, setActiveDayNumber] = useState<number>(1);

  const saveDays = (days: CurriculumDay[]) => {
    setAllDays(days);
    localStorage.setItem('pro_placement_curriculum_days', JSON.stringify(days));
  };

  const toggleAnswer = (questionId: string) => {
    setRevealedAnswers((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const toggleTask = (dayNum: number, taskId: string) => {
    const updated = allDays.map((d) => {
      if (d.day !== dayNum) return d;
      const tasks = (d.dailyTasks || []).map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      const allDone = tasks.length > 0 && tasks.every((t) => t.completed);
      return { ...d, dailyTasks: tasks, completed: allDone ? true : d.completed };
    });
    saveDays(updated);
  };

  const toggleDayCompletion = (dayNum: number) => {
    const targetDay = allDays.find((d) => d.day === dayNum);
    const markingComplete = targetDay ? !targetDay.completed : false;
    const updated = allDays.map((d) => {
      if (d.day !== dayNum) return d;
      const nextCompleted = !d.completed;
      const nextTasks = (d.dailyTasks || []).map((t) => ({ ...t, completed: nextCompleted }));
      return { ...d, completed: nextCompleted, dailyTasks: nextTasks };
    });
    saveDays(updated);
    if (markingComplete && onDayCompleted) {
      onDayCompleted();
    }
  };

  const currentMonthData =
    CURRICULUM_MONTHS.find((m) => m.month === selectedMonth) ||
    CURRICULUM_MONTHS[0];
  const monthDays = allDays.filter((d) => d.month === selectedMonth);
  const activeDay =
    allDays.find((d) => d.day === activeDayNumber) ||
    monthDays[0] ||
    allDays[0];

  const totalCompleted = allDays.filter((d) => d.completed).length;
  const progressPercent = Math.round((totalCompleted / 270) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-xs text-gray-900 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#B8860B]">
            <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>270-Day Step-by-Step Syllabus</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
            9-Month Course Syllabus
          </h2>
        </div>

        <div className="flex items-center gap-2.5 bg-[#FAFAFA] px-3 py-2 rounded-xl border border-gray-200">
          <div className="text-xs font-bold text-gray-900 tabular-nums">
            <span className="text-[#B8860B] font-mono">{totalCompleted}</span>
            /270d
            <span className="text-emerald-600 ml-1 font-mono">
              ({progressPercent}%)
            </span>
          </div>
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D4AF37]"
              style={{ width: `${Math.max(4, progressPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 9-Month Syllabus Selector — Stacked One by One Below */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-gray-700">
          Select Syllabus Month (Months 1 to 9):
        </div>
        <div className="flex flex-col space-y-2">
          {CURRICULUM_MONTHS.map((m) => {
            const isSelected = m.month === selectedMonth;
            const completedInMonth = allDays.filter(
              (d) => d.month === m.month && d.completed
            ).length;
            return (
              <button
                key={m.month}
                type="button"
                onClick={() => {
                  setSelectedMonth(m.month);
                  setActiveDayNumber((m.month - 1) * 30 + 1);
                }}
                className={`w-full px-4 py-3 rounded-xl border text-left transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-[#0B2545] border-[#0B2545] text-white'
                    : 'bg-[#FAFAFA] border-gray-200 text-gray-800 hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#D4AF37]">
                      Month 0{m.month}
                    </span>
                    <span className="text-sm font-bold">{m.title}</span>
                  </div>
                  <div
                    className={`text-xs mt-0.5 ${
                      isSelected ? 'text-gray-200' : 'text-gray-500'
                    }`}
                  >
                    Focus: {m.primaryFocus}
                  </div>
                </div>
                <div
                  className={`text-xs font-mono font-bold shrink-0 ${
                    isSelected ? 'text-[#FDE047]' : 'text-gray-600'
                  }`}
                >
                  {completedInMonth}/30 Days Done
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Action Card — All Tasks Stacked One by One Below */}
      <div className="bg-[#FAFAFA] border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
          <div>
            <span className="text-xs text-[#B8860B] font-mono font-bold uppercase">
              Month {selectedMonth} · Day {activeDay.day} Syllabus
            </span>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug mt-0.5">
              {activeDay.topic}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => toggleDayCompletion(activeDay.day)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeDay.completed
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {activeDay.completed ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
            <span>{activeDay.completed ? 'Day Completed ✓' : 'Mark Day Done'}</span>
          </button>
        </div>

        {/* 1. Daily Tasks Checklist for this Day */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
              <CheckCircle2 className="w-4 h-4 text-[#B8860B]" />
              <span>Daily Tasks for Day {activeDay.day}</span>
            </div>
            <span className="text-[11px] font-mono text-gray-500">
              {(activeDay.dailyTasks || []).filter((t) => t.completed).length}/{(activeDay.dailyTasks || []).length} Completed
            </span>
          </div>

          <div className="flex flex-col space-y-2">
            {(activeDay.dailyTasks || []).map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(activeDay.day, task.id)}
                className={`flex items-start justify-between gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                  task.completed
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-[#FAFAFA] border-gray-200 text-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0 text-emerald-600">
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 fill-emerald-600 text-white" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className={`font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                      <span className="font-semibold text-[#B8860B] uppercase">{task.category}</span>
                      <span>·</span>
                      <span>~{task.estimatedMinutes} mins</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                    task.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {task.completed ? 'Done ✓' : 'To-Do'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Daily Practice Questions for this Day */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
              <BookOpen className="w-4 h-4 text-[#D4AF37]" />
              <span>Daily Questions for Day {activeDay.day} ({activeDay.topic})</span>
            </div>
            <span className="text-[11px] font-medium text-gray-500">
              3 Questions (Tech · Quant · Interview)
            </span>
          </div>

          <div className="flex flex-col space-y-2.5">
            {(activeDay.dailyQuestions || []).map((q, idx) => {
              const isExpanded = revealedAnswers[q.id];
              const badgeColor =
                q.type === 'technical'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : q.type === 'aptitude'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200';

              return (
                <div
                  key={q.id}
                  className="bg-[#FAFAFA] border border-gray-200 rounded-xl p-3 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border uppercase ${badgeColor}`}>
                        Q{idx + 1} · {q.type}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleAnswer(q.id)}
                      className="text-[11px] font-bold text-[#0B2545] hover:underline flex items-center gap-1 shrink-0"
                    >
                      {isExpanded ? 'Hide Solution ▲' : 'Show Solution ▼'}
                    </button>
                  </div>

                  <p className="font-semibold text-gray-900 leading-relaxed">
                    {q.question}
                  </p>

                  {q.hint && (
                    <div className="bg-amber-50/60 border border-amber-100 rounded-lg px-2.5 py-1.5 text-[11px] text-amber-900">
                      <strong>Hint: </strong>{q.hint}
                    </div>
                  )}

                  {isExpanded && (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-[11px] space-y-1.5 text-gray-800 animate-in fade-in duration-150">
                      <p className="font-bold text-emerald-700 uppercase tracking-wide text-[10px]">
                        Detailed Solution &amp; Answer Derivation:
                      </p>
                      <p className="leading-relaxed whitespace-pre-line text-gray-700">
                        {q.answerExplanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Quick Action Hubs for this Day */}
        <div className="flex flex-col space-y-3">
          {/* DSA Practice Hub */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
              <Target className="w-4 h-4 text-[#D4AF37]" />
              <span>DSA Target Problems ({activeDay.topic})</span>
            </div>
            <div className="flex flex-col space-y-1.5">
              {activeDay.dsaTargets.map((dsa, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-[#FAFAFA] px-3 py-2 rounded-lg border border-gray-200 text-xs"
                >
                  <span className="text-gray-800 font-medium">{dsa}</span>
                  {onStartDSA && (
                    <button
                      type="button"
                      onClick={() => onStartDSA(dsa)}
                      className="text-xs text-[#0B2545] font-bold ml-3 shrink-0 hover:underline"
                    >
                      Solve →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Aptitude Drill */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-gray-800">
                <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                <span>Aptitude &amp; Core CS Drill</span>
              </div>
              <p className="text-gray-600">{activeDay.aptitudeTarget}</p>
            </div>
            {onStartAptitude && (
              <button
                type="button"
                onClick={onStartAptitude}
                className="px-3 py-1.5 rounded-lg bg-[#0B2545] text-white font-bold shrink-0"
              >
                Practice →
              </button>
            )}
          </div>

          {/* Voice Coach Session */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-gray-800">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>Voice Coach Behavioral Drill</span>
              </div>
              <p className="text-gray-600">{activeDay.communicationTarget}</p>
            </div>
            {onStartComm && (
              <button
                type="button"
                onClick={onStartComm}
                className="px-3 py-1.5 rounded-lg bg-[#0B2545] text-white font-bold shrink-0"
              >
                Speak →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Month Days Syllabus List — Shown Vertically One by One Below */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="font-bold text-gray-800">
            Month {selectedMonth} Day-by-Day Syllabus (Days{' '}
            {(selectedMonth - 1) * 30 + 1} to {selectedMonth * 30})
          </span>
          <span>Tap any day below to view or mark complete</span>
        </div>

        <div className="flex flex-col space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {monthDays.map((d) => {
            const isActive = d.day === activeDayNumber;
            return (
              <div
                key={d.day}
                onClick={() => setActiveDayNumber(d.day)}
                className={`w-full p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-[#0B2545] border-[#0B2545] text-white'
                    : d.completed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-white border-gray-200 text-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isActive ? 'text-[#FDE047]' : 'text-[#B8860B]'
                      }`}
                    >
                      Day {d.day}
                    </span>
                    <span className="text-xs sm:text-sm font-bold truncate">
                      {d.topic}
                    </span>
                  </div>
                  <div
                    className={`text-[11px] truncate mt-0.5 ${
                      isActive ? 'text-gray-200' : 'text-gray-500'
                    }`}
                  >
                    DSA: {d.dsaTargets.join(' · ')}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDayCompletion(d.day);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition ${
                    d.completed
                      ? 'bg-emerald-600 text-white'
                      : isActive
                      ? 'bg-white/15 text-white hover:bg-white/25'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {d.completed ? 'Done ✓' : 'Mark Done'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
