import React from 'react';
import {
  LogIn,
  Code2,
  Brain,
  Mic,
  Calendar,
  Compass,
  Check,
  Minus,
  ArrowRight,
} from 'lucide-react';
import { ThreeLlionLogo } from './ThreeLlionLogo';
import { ProPlacementAppLogo } from './ProPlacementAppLogo';
import { LegalModalType } from './LegalModals';

interface AboutProPlacementPageProps {
  onProceedToLogin: () => void;
  onOpenLegalModal?: (modal: LegalModalType) => void;
}

const CAPABILITIES = [
  {
    index: '01',
    title: '3,000+ DSA Engineering Hub',
    summary:
      'Structured data structures and algorithms bank covering arrays, graphs, dynamic programming, and system coding patterns with solution walkthroughs.',
    detail: 'Topic Mastery · Solution Guides · Bookmark Vault',
    icon: Code2,
  },
  {
    index: '02',
    title: '10,000+ Aptitude Arena',
    summary:
      'Quantitative aptitude, logical deduction, and verbal reasoning drills engineered for online screening assessments across top recruiters.',
    detail: 'Timed Mock Tests · Accuracy Analytics · Step Explanations',
    icon: Brain,
  },
  {
    index: '03',
    title: 'Multi-Accent Voice Coach',
    summary:
      'Real-time spoken English practice with live waveform response, speech transcription, and pronunciation fluency coaching for HR and technical rounds.',
    detail: 'Live Mic Waveform · Instant Transcripts · Accent Tuning',
    icon: Mic,
  },
  {
    index: '04',
    title: '270-Day Structured Syllabus',
    summary:
      'A disciplined 9-month execution calendar uniting daily coding targets, aptitude quotas, and communication tasks with 24-hour streak accountability.',
    detail: 'Daily Checklists · Question Targets · Streak Tracking',
    icon: Calendar,
  },
  {
    index: '05',
    title: 'Byte Runner Logic & Interview Suite',
    summary:
      'Infinite procedural spatial logic puzzles alongside an ATS-compliant resume builder and a 5-stage technical and HR interview framework.',
    detail: 'Unlimited Logic Puzzles · ATS Resume Builder · 5-Stage Guide',
    icon: Compass,
  },
];

const COMPARISON_ROWS = [
  {
    dimension: 'Preparation Structure',
    others: 'Scattered problem lists with no daily pacing or completion roadmap',
    proPlacement:
      'Guided 270-day (9-month) daily curriculum uniting DSA, aptitude, and voice tasks',
  },
  {
    dimension: 'Communication & HR Rounds',
    others: 'Text-only coding editors; spoken interview fluency is ignored',
    proPlacement:
      'Integrated Voice Coach with live audio waveform capture and spoken feedback',
  },
  {
    dimension: 'Screening Readiness',
    others: 'Separate tools needed for aptitude tests, resumes, and coding prep',
    proPlacement:
      'All-in-one suite: 10,000+ aptitude drills, 3,000+ DSA problems, ATS resume & logic arena',
  },
  {
    dimension: 'Habit & Consistency',
    others: 'Passive accounts where learners stall without daily accountability',
    proPlacement:
      '24-hour active streak enforcement ensuring consistent daily execution',
  },
  {
    dimension: 'Workspace Environment',
    others: 'Ad-cluttered feeds, distracting forums, and upsell paywalls',
    proPlacement:
      'Focused, engineering-grade studio with cloud sync and cohort benchmarking',
  },
];

export const AboutProPlacementPage: React.FC<AboutProPlacementPageProps> = ({
  onProceedToLogin,
  onOpenLegalModal,
}) => {
  return (
    <div className="relative min-h-screen pp-ambient-bg text-[#18181B] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-white">
      {/* Subtle architectural grid layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 pp-architectural-grid"
      />

      {/* Top Navigation Bar — Clean 3-Zone Contract */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          <a
            href="#top"
            className="text-lg font-bold tracking-tight text-[#0B2545] whitespace-nowrap shrink-0"
          >
            Pro Placement
          </a>

          <nav
            aria-label="About sections"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <a
              href="#what-it-is"
              className="hover:text-[#0B2545] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              What It Is
            </a>
            <a
              href="#why-pro-placement"
              className="hover:text-[#0B2545] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Why Pro Placement
            </a>
            <a
              href="#how-different"
              className="hover:text-[#0B2545] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              How It Differs
            </a>
            <a
              href="#about-3llion"
              className="hover:text-[#0B2545] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              3LLION
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={onProceedToLogin}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0B2545] hover:bg-[#13315C] rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Candidate Login</span>
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-20">
        {/* Hero Introduction */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <span>Pro Placement Suite</span>
              <span aria-hidden="true">·</span>
              <span>A Project by 3LLION</span>
              <span aria-hidden="true">·</span>
              <span>Founded by Bhargava B</span>
            </div>

            <h1
              className="font-bold tracking-tight text-[#0B2545] leading-[1.12] max-w-2xl"
              style={{
                fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                textWrap: 'balance',
              }}
            >
              A unified placement engineering environment built to turn preparation into offers.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Pro Placement brings technical coding, aptitude mastery, spoken interview coaching,
              logical puzzle training, and structured daily accountability into one cohesive workspace—crafted
              by 3LLION for engineering candidates who take career readiness seriously.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onProceedToLogin}
                className="px-6 py-3 bg-[#0B2545] hover:bg-[#13315C] text-white font-semibold text-sm rounded-xl transition-colors inline-flex items-center gap-2.5 cursor-pointer shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Enter Candidate Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#what-it-is"
                className="px-5 py-3 bg-white hover:bg-slate-50 text-[#0B2545] font-semibold text-sm rounded-xl border border-slate-200 transition-colors inline-flex items-center gap-2"
              >
                <span>Explore Platform</span>
              </a>
            </div>
          </div>

          {/* Right Brand Monolith Featuring Exact 3LLION & Pro Placement Logos */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-10 shadow-xs flex flex-col items-center text-center space-y-6">
            <ThreeLlionLogo size="lg" />
            <div className="w-full h-px bg-slate-200/80" />
            <div className="flex flex-col items-center gap-3">
              <ProPlacementAppLogo size="lg" />
              <div>
                <div className="font-cinzel text-lg font-bold tracking-wider text-[#0B2545]">
                  PRO PLACEMENT
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Engineering the future · Built by 3LLION
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Scope Metrics Bar */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 border-y border-slate-200/90 py-8">
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0B2545]">
              3,000+
            </div>
            <div className="text-xs sm:text-sm text-slate-600 mt-1">
              DSA Problems &amp; Patterns
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0B2545]">
              10,000+
            </div>
            <div className="text-xs sm:text-sm text-slate-600 mt-1">
              Aptitude &amp; Reasoning Drills
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0B2545]">
              270 Days
            </div>
            <div className="text-xs sm:text-sm text-slate-600 mt-1">
              9-Month Structured Syllabus
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0B2545]">
              1 Suite
            </div>
            <div className="text-xs sm:text-sm text-slate-600 mt-1">
              Code, Aptitude, Voice &amp; Resume
            </div>
          </div>
        </section>

        {/* Section 1: What Is Pro Placement? */}
        <section id="what-it-is" className="scroll-mt-24 space-y-8">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-semibold text-[#B8860B] tracking-wide">
              01 · Overview
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B2545]">
              What is Pro Placement?
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Pro Placement is an end-to-end placement engineering suite developed to prepare
              university students and software job seekers for every round of campus and off-campus
              technical hiring. Rather than functioning as an isolated question bank, it connects
              coding fluency, quantitative speed, spoken English articulation, spatial logic, and
              ATS-ready resumes into a single structured workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CAPABILITIES.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.index}
                  className={`bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between space-y-5 ${
                    idx === 0 ? 'lg:col-span-2' : ''
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-slate-400">
                        {cap.index}
                      </span>
                      <Icon className="w-5 h-5 text-[#0B2545]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0B2545]">
                      {cap.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {cap.summary}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 text-xs font-medium text-slate-500">
                    {cap.detail}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Why Pro Placement? */}
        <section
          id="why-pro-placement"
          className="scroll-mt-24 bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 space-y-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-semibold text-[#B8860B] tracking-wide">
                02 · The Purpose
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B2545]">
                Why Pro Placement?
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Most capable engineering students miss top offers not because they lack effort,
                but because their preparation is fragmented across disconnected websites, unverified
                PDFs, and inconsistent routines.
              </p>
            </div>

            <div className="lg:col-span-7 divide-y divide-slate-100">
              <div className="pb-5">
                <h3 className="text-base font-bold text-[#0B2545]">
                  01. Eliminates Fragmented Study
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Replaces jumping between separate coding sheets, aptitude websites, resume templates,
                  and English speaking apps with a unified workflow that tracks everything in one profile.
                </p>
              </div>
              <div className="py-5">
                <h3 className="text-base font-bold text-[#0B2545]">
                  02. Bridges Technical Skill &amp; Interview Delivery
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Solving an algorithm silently is only half the interview. Pro Placement trains both
                  algorithmic correctness and clear spoken articulation through its dedicated Voice Coach.
                </p>
              </div>
              <div className="pt-5">
                <h3 className="text-base font-bold text-[#0B2545]">
                  03. Enforces Daily Consistency Over Cramming
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  With a 270-day execution plan, daily question checklists, and 24-hour streak rules,
                  candidates build compound readiness well before placement season arrives.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: How Pro Placement Is Different From Other Platforms */}
        <section id="how-different" className="scroll-mt-24 space-y-6">
          <div className="max-w-3xl space-y-2">
            <div className="text-xs font-semibold text-[#B8860B] tracking-wide">
              03 · Comparative Advantage
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B2545]">
              How Pro Placement is different from other platforms
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Designed from first principles around complete hiring readiness rather than single-skill practice.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-[#0B2545]">
                    <th className="py-4 px-5 w-1/4">Capability Area</th>
                    <th className="py-4 px-5 w-3/8 text-slate-500">Conventional Platforms</th>
                    <th className="py-4 px-5 w-3/8 text-[#0B2545]">Pro Placement by 3LLION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.dimension} className="align-top">
                      <td className="py-4 px-5 font-semibold text-[#0B2545]">
                        {row.dimension}
                      </td>
                      <td className="py-4 px-5 text-slate-500">
                        <div className="flex items-start gap-2">
                          <Minus className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span>{row.others}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-800 font-medium">
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-[#0B2545] shrink-0 mt-0.5" />
                          <span>{row.proPlacement}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 4: A Project by 3LLION — Founded by Bhargava B */}
        <section
          id="about-3llion"
          className="scroll-mt-24 bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-xl bg-slate-50/70 border border-slate-200/70">
              <ThreeLlionLogo size="lg" />
              <div className="mt-4 text-xs font-medium text-slate-500">
                3LLION · Software Technology Startup
              </div>
            </div>

            <div className="md:col-span-7 space-y-4">
              <div className="text-xs font-semibold text-[#B8860B] tracking-wide">
                04 · Maker &amp; Vision
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B2545]">
                A Project by 3LLION
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Pro Placement is built by <strong>3LLION</strong>, a software tech startup founded by{' '}
                <strong>Bhargava B</strong>. Dedicated to engineering practical, high-craft software
                products, 3LLION designed Pro Placement to give ambitious students the clarity,
                technical depth, and daily discipline required to clear competitive engineering
                interviews with confidence.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                <span>Organization: 3LLION</span>
                <span aria-hidden="true">·</span>
                <span>Founder: Bhargava B</span>
                <span aria-hidden="true">·</span>
                <span>Product: Pro Placement Suite</span>
              </div>
            </div>
          </div>
        </section>

        {/* Centered Login Action Below */}
        <section
          aria-label="Proceed to Candidate Login"
          className="py-6 flex flex-col items-center justify-center text-center space-y-4"
        >
          <p className="text-sm text-slate-600 font-medium">
            Ready to begin your structured placement preparation?
          </p>

          <button
            type="button"
            onClick={onProceedToLogin}
            aria-label="Open Candidate Login"
            className="group flex flex-col items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2545] rounded-2xl p-2 cursor-pointer"
          >
            <span className="w-16 h-16 rounded-2xl bg-[#0B2545] group-hover:bg-[#13315C] text-white flex items-center justify-center shadow-md group-hover:-translate-y-0.5 transition-all duration-200 border border-[#D4AF37]/40">
              <LogIn className="w-7 h-7" />
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0B2545] group-hover:underline underline-offset-4">
              <span>Login to Pro Placement</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>

          <p className="text-xs text-slate-400">
            Click the login icon above to sign in or create your candidate profile
          </p>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="relative z-10 border-t border-slate-200/80 bg-white/80 py-6 px-4 text-center text-xs text-slate-500 space-y-2">
        <div className="font-medium text-slate-600">
          Pro Placement · A Project by 3LLION · Founded by Bhargava B
        </div>
        {onOpenLegalModal && (
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-medium text-slate-500">
            <button
              type="button"
              onClick={() => onOpenLegalModal('PRIVACY')}
              className="hover:text-slate-900 underline-offset-4 hover:underline cursor-pointer"
            >
              Privacy Policy
            </button>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <button
              type="button"
              onClick={() => onOpenLegalModal('TERMS')}
              className="hover:text-slate-900 underline-offset-4 hover:underline cursor-pointer"
            >
              Terms &amp; Conditions
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};
