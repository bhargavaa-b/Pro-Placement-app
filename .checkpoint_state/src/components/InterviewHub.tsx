import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  Circle,
  Code2,
  MessageSquare,
  Layers,
  Award,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';

interface InterviewStage {
  step: number;
  title: string;
  duration: string;
  summary: string;
  bullets: string[];
  keyTip: string;
}

const INTERVIEW_STAGES: InterviewStage[] = [
  {
    step: 1,
    title: '1. Resume Shortlist',
    duration: '15–30s Scan',
    summary: 'ATS & recruiter screen for core stack, metrics & 1-page clarity.',
    bullets: [
      '1 page only with standard headers (Education, Skills, Projects).',
      '2–3 deployed projects with GitHub links & % impact metrics.',
      'List only languages/tools you can code & defend live.',
    ],
    keyTip: 'Every bullet on your resume will be questioned in depth.',
  },
  {
    step: 2,
    title: '2. Online Assessment (OA)',
    duration: '60–90 Mins',
    summary: 'Timed Quant, Logical, Verbal + 2–3 DSA coding questions.',
    bullets: [
      'Master Arrays, Strings, Hash Maps, Two Pointers & Sliding Window.',
      'Check constraints first: N ≤ 10⁵ requires O(N) or O(N log N).',
      'Pass base test cases quickly, then handle edge cases.',
    ],
    keyTip: 'Never get stuck >20 mins on one question; secure partial tests.',
  },
  {
    step: 3,
    title: '3. Technical Round 1 (DSA)',
    duration: '45–60 Mins',
    summary: 'Live 1-on-1 problem solving while thinking aloud.',
    bullets: [
      'Clarify constraints & edge cases (empty, duplicates, negatives).',
      'State Brute Force O(N²) first → optimize to O(N) / O(N log N).',
      'Dry-run your code line-by-line with a small sample input.',
    ],
    keyTip: 'Never code in silence—share your thought process aloud.',
  },
  {
    step: 4,
    title: '4. Technical Round 2 (CS & Design)',
    duration: '45–60 Mins',
    summary: 'Core CS (OOPs, DBMS, OS, CN) + Project Architecture deep-dive.',
    bullets: [
      'OOPs: 4 Pillars, SOLID, Interfaces vs Abstract classes.',
      'DBMS: ACID, Normalization (1NF–BCNF), Indexing & SQL Joins.',
      'OS & CN: Threads, Deadlocks, Virtual Memory, TCP/UDP, HTTPS.',
    ],
    keyTip: 'Be ready to explain your project flow from UI to DB schema.',
  },
  {
    step: 5,
    title: '5. Managerial & HR Round',
    duration: '30 Mins',
    summary: 'Evaluates ownership, teamwork, clarity & cultural fit.',
    bullets: [
      'Keep a crisp 60-second self-intro (Skills + Top Project + Goal).',
      'Answer behavioral prompts using S-T-A-R (Situation, Task, Action, Result).',
      'Ask 1–2 smart questions about team stack & 90-day expectations.',
    ],
    keyTip: 'Highlight your specific contribution ("I built...") in team projects.',
  },
];

interface ChecklistCategory {
  id: string;
  category: string;
  items: { id: string; text: string }[];
}

const PREPARATION_CHECKLIST: ChecklistCategory[] = [
  {
    id: 'dsa-check',
    category: 'DSA Core Patterns',
    items: [
      { id: 'c1', text: 'Arrays, Prefix Sum, Two Pointers & Sliding Window' },
      { id: 'c2', text: 'Strings, Hashing & Frequency Maps' },
      { id: 'c3', text: 'Binary Search (Arrays & Answer Space)' },
      { id: 'c4', text: 'Linked Lists (Reverse, Cycle, Fast/Slow Pointers)' },
      { id: 'c5', text: 'Stacks, Monotonic Stack & Queues' },
      { id: 'c6', text: 'Trees & BST (BFS, DFS, Views, LCA)' },
      { id: 'c7', text: 'Heaps / Priority Queue & Top-K' },
      { id: 'c8', text: 'Graphs (BFS, DFS, Topo Sort, Dijkstra)' },
      { id: 'c9', text: 'Dynamic Programming (1D, 2D, Knapsack, LCS)' },
    ],
  },
  {
    id: 'cs-check',
    category: 'Core CS Subjects',
    items: [
      { id: 'c10', text: 'OOPs: 4 Pillars, Polymorphism & SOLID' },
      { id: 'c11', text: 'DBMS: ACID, Normalization, Joins & Indexing' },
      { id: 'c12', text: 'OS: Processes, Threads, Mutex & Deadlocks' },
      { id: 'c13', text: 'CN: OSI, TCP/UDP, DNS, HTTP & REST APIs' },
    ],
  },
  {
    id: 'proj-check',
    category: 'Projects & HR',
    items: [
      { id: 'c14', text: '60-Second Self-Intro ("Tell me about yourself")' },
      { id: 'c15', text: 'Architecture & bottlenecks of top 2 projects' },
      { id: 'c16', text: 'STAR stories: Bug fix, deadline & teamwork' },
    ],
  },
];

export const InterviewHub: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    'ROADMAP' | 'CHECKLIST' | 'CODING_TIPS' | 'HR_GUIDE'
  >('ROADMAP');

  const [checkedItems, setCheckedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pro_placement_prep_checklist');
      return saved ? JSON.parse(saved) : ['c1', 'c2'];
    } catch {
      return ['c1', 'c2'];
    }
  });

  const toggleCheckItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      try {
        localStorage.setItem('pro_placement_prep_checklist', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const totalChecklistItems = PREPARATION_CHECKLIST.reduce(
    (acc, cat) => acc + cat.items.length,
    0
  );
  const completedCount = checkedItems.length;

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0F3057]">
              <Compass className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Interview Playbook</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5">
              Fast Interview Prep Guide
            </h2>
          </div>

          <div className="bg-[#FAFAFA] border border-gray-200 rounded-xl px-3 py-2 text-right">
            <span className="text-[9px] text-gray-500 uppercase font-bold block">
              Checklist
            </span>
            <span className="text-sm font-bold text-[#0B2545] font-mono">
              {completedCount}/{totalChecklistItems} Ready
            </span>
          </div>
        </div>

        {/* Mobile-Friendly Horizontal Scroll Sub-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-4 pt-3 border-t border-gray-100">
          {[
            { id: 'ROADMAP', label: '5 Stages', icon: Layers },
            { id: 'CHECKLIST', label: 'Topic Checklist', icon: CheckCircle2 },
            { id: 'CODING_TIPS', label: 'Coding Rules', icon: Code2 },
            { id: 'HR_GUIDE', label: 'STAR & HR', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                  isActive
                    ? 'bg-[#0B2545] text-white shadow-2xs'
                    : 'bg-[#FAFAFA] text-gray-700 border border-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: 5 STAGES — Stacked One by One Below */}
      {activeSection === 'ROADMAP' && (
        <div className="flex flex-col space-y-3">
          {INTERVIEW_STAGES.map((stage) => (
            <div
              key={stage.step}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#0B2545] text-white font-mono text-[11px] font-bold flex items-center justify-center">
                      0{stage.step}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">
                      {stage.title}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                    {stage.duration}
                  </span>
                </div>

                <p className="text-xs text-gray-700 font-medium leading-snug">
                  {stage.summary}
                </p>

                <ul className="space-y-1 text-xs text-gray-600 pl-4 list-disc">
                  {stage.bullets.map((point, idx) => (
                    <li key={idx} className="leading-snug">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200/80 rounded-xl px-3 py-2 text-[11px] text-amber-950">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-medium">{stage.keyTip}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 2: CHECKLIST */}
      {activeSection === 'CHECKLIST' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {PREPARATION_CHECKLIST.map((group) => (
            <div
              key={group.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs space-y-3"
            >
              <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                  {group.category}
                </h3>
                <span className="text-[10px] text-gray-400">Tap to mark</span>
              </div>

              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const isDone = checkedItems.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleCheckItem(item.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                        isDone
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-semibold'
                          : 'bg-[#FAFAFA] border-gray-200 text-gray-700'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      )}
                      <span className="leading-snug">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 3: CODING RULES */}
      {activeSection === 'CODING_TIPS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>6-Step Live Coding Formula</span>
            </div>
            <ol className="space-y-2 text-xs text-gray-700 list-decimal pl-4 leading-snug">
              <li><strong>Clarify (0–3m):</strong> Confirm constraints, types & edge cases.</li>
              <li><strong>Example (3–6m):</strong> Trace 1 small input-output by hand.</li>
              <li><strong>Brute Force (6–10m):</strong> State naive approach & Big-O first.</li>
              <li><strong>Optimize (10–18m):</strong> Use Hash Map, 2-Pointers, Binary Search or DP.</li>
              <li><strong>Clean Code (18–32m):</strong> Write modular code with clear variable names.</li>
              <li><strong>Dry Run (32–40m):</strong> Test `n=0`, `n=1`, negatives & state final Big-O.</li>
            </ol>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>5 Mistakes to Avoid</span>
            </div>
            <ul className="space-y-2 text-xs text-gray-700 list-disc pl-4 leading-snug">
              <li><strong>Coding immediately:</strong> Always clarify constraints before typing.</li>
              <li><strong>Long silence:</strong> Think aloud so the interviewer follows your logic.</li>
              <li><strong>Ignoring hints:</strong> Pause and apply interviewer clues immediately.</li>
              <li><strong>Guessing Big-O:</strong> Prove Time & Space complexity from loops/recursion.</li>
              <li><strong>Skipping edge cases:</strong> Check empty arrays, duplicates & overflow.</li>
            </ul>
          </div>
        </div>
      )}

      {/* SECTION 4: HR & STAR */}
      {activeSection === 'HR_GUIDE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0B2545]">
              <Award className="w-4 h-4 text-[#C5A059]" />
              <span>STAR Answer Formula</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-gray-200">
                <strong className="text-gray-900 block">S — Situation (15%)</strong>
                <span className="text-gray-600 text-[11px]">Project context & goal.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-gray-200">
                <strong className="text-gray-900 block">T — Task (15%)</strong>
                <span className="text-gray-600 text-[11px]">Core challenge or bottleneck.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-gray-200">
                <strong className="text-gray-900 block">A — Action (50%)</strong>
                <span className="text-gray-600 text-[11px]">Exact steps & code YOU wrote.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-gray-200">
                <strong className="text-gray-900 block">R — Result (20%)</strong>
                <span className="text-gray-600 text-[11px]">Measurable speedup or impact.</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs space-y-2">
            <div className="text-xs sm:text-sm font-bold text-[#0B2545]">
              Top 3 HR Prompts Ready
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-gray-200">
                <strong className="text-gray-900">1. Tell me about yourself (60s):</strong>{' '}
                <span className="text-gray-600">Degree + Core Stack + Top 2 Projects + Career Goal.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-gray-200">
                <strong className="text-gray-900">2. Best Project Walkthrough:</strong>{' '}
                <span className="text-gray-600">Problem → Architecture → Hardest Bug Fixed → Scale.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-gray-200">
                <strong className="text-gray-900">3. Questions for Interviewer:</strong>{' '}
                <span className="text-gray-600">"What does success in the first 90 days look like?"</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
