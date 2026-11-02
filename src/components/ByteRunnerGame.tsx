import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Trophy,
  ArrowLeft,
  HelpCircle,
  ChevronRight,
  RefreshCw,
  Clock,
} from 'lucide-react';

export interface ByteRunnerProps {
  onShieldEarned: () => void;
  onGamePlayed?: (score: number, unlockedShield: boolean) => void;
  hasShield?: boolean;
  streakShieldActive?: boolean;
  highScore?: number;
  initialHighScore?: number;
  streakDays?: number;
  currentStreak?: number;
  onExit?: () => void;
}

export interface Coord {
  r: number;
  c: number;
}

export interface Checkpoint {
  r: number;
  c: number;
  num: number;
}

export interface ZipLevel {
  id: string;
  size: number;
  checkpoints: Checkpoint[];
  solution: Coord[];
  parTimeSec: number;
  baseScore: number;
}

// -------------------------------------------------------------
// Procedural Hamiltonian Path Generator (Oberman/Lovász MCMC)
// Guarantees 100% solvable, full-grid covering path on every generation
// -------------------------------------------------------------
export function generateProceduralLevel(size: number = 5): ZipLevel {
  const totalCells = size * size;

  // 1. Initialize with a valid serpentine Hamiltonian path
  const path: Coord[] = [];
  for (let r = 0; r < size; r++) {
    const cols = Array.from({ length: size }, (_, i) => i);
    if (r % 2 === 1) cols.reverse();
    for (const c of cols) {
      path.push({ r, c });
    }
  }

  // 2. Perform random backbite moves to thoroughly shuffle the path
  const backbiteSteps = size * size * 10;
  const isAdjacent = (a: Coord, b: Coord) =>
    (Math.abs(a.r - b.r) === 1 && a.c === b.c) ||
    (Math.abs(a.c - b.c) === 1 && a.r === b.r);

  for (let step = 0; step < backbiteSteps; step++) {
    const mutateTail = Math.random() < 0.5;
    if (mutateTail) {
      const tail = path[path.length - 1];
      const validIndices: number[] = [];
      for (let k = 0; k < path.length - 2; k++) {
        if (isAdjacent(tail, path[k])) {
          validIndices.push(k);
        }
      }
      if (validIndices.length > 0) {
        const k = validIndices[Math.floor(Math.random() * validIndices.length)];
        let i = k + 1;
        let j = path.length - 1;
        while (i < j) {
          const temp = path[i];
          path[i] = path[j];
          path[j] = temp;
          i++;
          j--;
        }
      }
    } else {
      const head = path[0];
      const validIndices: number[] = [];
      for (let k = 2; k < path.length; k++) {
        if (isAdjacent(head, path[k])) {
          validIndices.push(k);
        }
      }
      if (validIndices.length > 0) {
        const k = validIndices[Math.floor(Math.random() * validIndices.length)];
        let i = 0;
        let j = k - 1;
        while (i < j) {
          const temp = path[i];
          path[i] = path[j];
          path[j] = temp;
          i++;
          j--;
        }
      }
    }
  }

  // 3. Place checkpoints along the generated path
  const numCheckpoints = size === 4 ? 3 : size === 5 ? 4 : size === 6 ? 5 : 6;
  const checkpoints: Checkpoint[] = [];

  // Checkpoint 1 at start of path
  checkpoints.push({ r: path[0].r, c: path[0].c, num: 1 });

  // Intermediate checkpoints spaced roughly evenly
  const stepSize = Math.floor(totalCells / numCheckpoints);
  for (let cp = 1; cp < numCheckpoints - 1; cp++) {
    const idealIdx = cp * stepSize;
    const jitter = Math.floor(Math.random() * 3) - 1;
    const chosenIdx = Math.min(totalCells - 2, Math.max(1, idealIdx + jitter));
    checkpoints.push({
      r: path[chosenIdx].r,
      c: path[chosenIdx].c,
      num: cp + 1,
    });
  }

  // Final checkpoint at end of path
  checkpoints.push({
    r: path[totalCells - 1].r,
    c: path[totalCells - 1].c,
    num: numCheckpoints,
  });

  const parTimeSec = size === 4 ? 30 : size === 5 ? 60 : size === 6 ? 90 : 120;
  const baseScore = size === 4 ? 400 : size === 5 ? 600 : size === 6 ? 850 : 1200;
  const uniqueCode = Math.floor(1000 + Math.random() * 9000);

  return {
    id: `proc-${Date.now()}-${uniqueCode}`,
    size,
    parTimeSec,
    baseScore,
    checkpoints,
    solution: path,
  };
}

// -------------------------------------------------------------
// Web Audio Synthesizer for Realistic Tactile Audio Feedback
// -------------------------------------------------------------
class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    try {
      const saved = localStorage.getItem('zip_sound_enabled');
      this.enabled = saved !== null ? saved === 'true' : true;
    } catch {
      this.enabled = true;
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playStep() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(580, this.ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Audio fallback
    }
  }

  playUndo() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.055);
    } catch {
      // Audio fallback
    }
  }

  playCheckpoint() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // Audio fallback
    }
  }

  playVictory() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.09);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.09 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.09);
        osc.stop(this.ctx.currentTime + i * 0.09 + 0.35);
      });
    } catch {
      // Audio fallback
    }
  }

  playError() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // Audio fallback
    }
  }
}

const soundManager = new SoundManager();

export const ByteRunnerGame: React.FC<ByteRunnerProps> = ({
  onShieldEarned,
  onGamePlayed,
  hasShield,
  streakShieldActive,
  highScore = 0,
  initialHighScore = 0,
  streakDays = 0,
  currentStreak = 0,
  onExit,
}) => {
  const effectiveHasShield = Boolean(hasShield ?? streakShieldActive);
  const effectiveHighScore = Math.max(highScore, initialHighScore);

  // Procedural dynamic puzzle generated on every game open so it changes every time!
  const [currentLevel, setCurrentLevel] = useState<ZipLevel>(() => {
    return generateProceduralLevel(5);
  });

  // Path coordinates array: starts at checkpoint 1
  const [path, setPath] = useState<Coord[]>(() => {
    const startCp = currentLevel.checkpoints.find((c) => c.num === 1);
    return startCp ? [{ r: startCp.r, c: startCp.c }] : [{ r: 0, c: 0 }];
  });

  const [isDragging, setIsDragging] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [moveCount, setMoveCount] = useState(0);
  const [undoCount, setUndoCount] = useState(0);
  const [hintCoord, setHintCoord] = useState<Coord | null>(null);
  const [hintTimer, setHintTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isWinModalOpen, setIsWinModalOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(soundManager.enabled);
  const [lastWinStats, setLastWinStats] = useState<{
    timeSec: number;
    moves: number;
    score: number;
    unlockedShield: boolean;
  } | null>(null);

  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const boardSize = currentLevel.size;
  const totalTiles = boardSize * boardSize;

  // Toggle Sound
  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      soundManager.enabled = next;
      try {
        localStorage.setItem('zip_sound_enabled', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  // Timer increment
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timerActive && !isWinModalOpen) {
      interval = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, isWinModalOpen]);

  // Generate a completely fresh procedural puzzle on demand
  const handleGenerateFresh = useCallback(
    (size: number = currentLevel.size || 5) => {
      const newLvl = generateProceduralLevel(size);
      setCurrentLevel(newLvl);
      const startCp = newLvl.checkpoints.find((c) => c.num === 1);
      setPath(startCp ? [{ r: startCp.r, c: startCp.c }] : [{ r: 0, c: 0 }]);
      setTimerSeconds(0);
      setTimerActive(true);
      setMoveCount(0);
      setUndoCount(0);
      setHintCoord(null);
      setIsWinModalOpen(false);
      soundManager.playCheckpoint();
    },
    [currentLevel.size]
  );

  // Checkpoint map for current level
  const checkpointMap = useMemo(() => {
    const map = new Map<string, Checkpoint>();
    currentLevel.checkpoints.forEach((cp) => {
      map.set(`${cp.r},${cp.c}`, cp);
    });
    return map;
  }, [currentLevel]);

  // Determine which checkpoints have been legitimately reached along current path
  const reachedCheckpointNums = useMemo(() => {
    const set = new Set<number>([1]);
    for (const coord of path) {
      const cp = checkpointMap.get(`${coord.r},${coord.c}`);
      if (cp) {
        set.add(cp.num);
      }
    }
    return set;
  }, [path, checkpointMap]);

  // Highest checkpoint reached so far
  const highestCheckpointReached = useMemo(() => {
    let max = 1;
    for (const n of reachedCheckpointNums) {
      if (n > max) max = n;
    }
    return max;
  }, [reachedCheckpointNums]);

  // Total checkpoints count
  const totalCheckpoints = currentLevel.checkpoints.length;
  const nextTargetCheckpoint = highestCheckpointReached < totalCheckpoints ? highestCheckpointReached + 1 : totalCheckpoints;

  // Path lookup set for quick collision testing
  const pathSet = useMemo(() => {
    const set = new Set<string>();
    path.forEach((p) => set.add(`${p.r},${p.c}`));
    return set;
  }, [path]);

  // Attempt to step into (r, c)
  const attemptMove = useCallback(
    (targetR: number, targetC: number) => {
      if (isWinModalOpen) return;
      if (targetR < 0 || targetR >= boardSize || targetC < 0 || targetC >= boardSize) return;

      const head = path[path.length - 1];
      if (!head) return;

      // If already on the same cell, no action
      if (head.r === targetR && head.c === targetC) return;

      const targetKey = `${targetR},${targetC}`;

      // 1. Backtrack / Rewind Check:
      // If target cell is ALREADY in path, rewind to it! (Instant intuitive correction)
      const existingIdx = path.findIndex((p) => p.r === targetR && p.c === targetC);
      if (existingIdx !== -1) {
        // Rewind path up to this existing cell
        setPath(path.slice(0, existingIdx + 1));
        setMoveCount((m) => m + 1);
        setUndoCount((u) => u + 1);
        soundManager.playUndo();
        try {
          navigator.vibrate?.(10);
        } catch {}
        return;
      }

      // 2. Must be orthogonally adjacent to the head
      const isOrthogonal =
        (Math.abs(head.r - targetR) === 1 && head.c === targetC) ||
        (Math.abs(head.c - targetC) === 1 && head.r === targetR);

      if (!isOrthogonal) {
        soundManager.playError();
        return;
      }

      // 3. Sequential Checkpoint Validation:
      // If the target cell is a checkpoint, it must be exactly nextTargetCheckpoint!
      const targetCp = checkpointMap.get(targetKey);
      if (targetCp) {
        if (targetCp.num !== nextTargetCheckpoint) {
          // Cannot skip checkpoints or visit out of order!
          soundManager.playError();
          return;
        }
      }

      // Valid forward step!
      const nextPath = [...path, { r: targetR, c: targetC }];
      setPath(nextPath);
      setMoveCount((m) => m + 1);

      if (targetCp) {
        soundManager.playCheckpoint();
      } else {
        soundManager.playStep();
      }

      try {
        navigator.vibrate?.(15);
      } catch {}

      // Clear any active hint
      if (hintCoord && hintCoord.r === targetR && hintCoord.c === targetC) {
        setHintCoord(null);
      }

      // 4. Win Condition Validation:
      // All tiles filled AND all checkpoints collected in order!
      if (nextPath.length === totalTiles) {
        const hasAllCp = currentLevel.checkpoints.every((cp) =>
          nextPath.some((p) => p.r === cp.r && p.c === cp.c)
        );

        if (hasAllCp) {
          // Puzzle Solved!
          setTimerActive(false);
          soundManager.playVictory();

          // Calculate Score
          const timeBonus = Math.max(0, (currentLevel.parTimeSec - timerSeconds) * 15);
          const moveBonus = Math.max(50, 200 - undoCount * 10);
          const totalScore = currentLevel.baseScore + timeBonus + moveBonus;

          const shouldUnlockShield = totalScore >= 500 || currentLevel.size >= 5;

          if (shouldUnlockShield) {
            onShieldEarned();
          }
          onGamePlayed?.(totalScore, shouldUnlockShield);

          setLastWinStats({
            timeSec: timerSeconds,
            moves: moveCount + 1,
            score: totalScore,
            unlockedShield: shouldUnlockShield,
          });

          setIsWinModalOpen(true);
        }
      }
    },
    [
      isWinModalOpen,
      boardSize,
      path,
      totalTiles,
      checkpointMap,
      nextTargetCheckpoint,
      hintCoord,
      currentLevel,
      timerSeconds,
      undoCount,
      moveCount,
      onShieldEarned,
      onGamePlayed,
    ]
  );

  // Undo last step
  const handleUndo = useCallback(() => {
    if (path.length <= 1) return;
    setPath((prev) => prev.slice(0, -1));
    setUndoCount((u) => u + 1);
    soundManager.playUndo();
  }, [path.length]);

  // Full reset of current level
  const handleReset = useCallback(() => {
    const startCp = currentLevel.checkpoints.find((c) => c.num === 1);
    setPath(startCp ? [{ r: startCp.r, c: startCp.c }] : [{ r: 0, c: 0 }]);
    setMoveCount(0);
    setHintCoord(null);
    soundManager.playUndo();
  }, [currentLevel]);

  // Hint feature: highlight next canonical cell
  const handleHint = useCallback(() => {
    if (path.length >= currentLevel.solution.length) return;
    // Find next cell in solution
    const nextSolCoord = currentLevel.solution[path.length];
    if (nextSolCoord) {
      setHintCoord(nextSolCoord);
      soundManager.playCheckpoint();
      if (hintTimer) clearTimeout(hintTimer);
      const timer = setTimeout(() => {
        setHintCoord(null);
      }, 3500);
      setHintTimer(timer);
    }
  }, [path.length, currentLevel.solution, hintTimer]);

  // Touch Drag Support across grid
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      if (!touch) return;
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!element) return;
      const target = element.closest('[data-grid-cell]') as HTMLElement | null;
      if (target) {
        const r = parseInt(target.getAttribute('data-row') || '-1', 10);
        const c = parseInt(target.getAttribute('data-col') || '-1', 10);
        if (r >= 0 && c >= 0) {
          attemptMove(r, c);
        }
      }
    },
    [isDragging, attemptMove]
  );

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isWinModalOpen || isHelpOpen) return;
      const head = path[path.length - 1];
      if (!head) return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        attemptMove(head.r - 1, head.c);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        attemptMove(head.r + 1, head.c);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        attemptMove(head.r, head.c - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        attemptMove(head.r, head.c + 1);
      } else if (e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [path, isWinModalOpen, isHelpOpen, attemptMove, handleUndo]);

  // Global mouseup to cancel drag
  useEffect(() => {
    const onMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, []);

  // Format timer
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Completion percentage
  const progressPercent = Math.round((path.length / totalTiles) * 100);

  return (
    <div className="relative min-h-screen bg-[#FDFDFE] text-stone-900 font-sans flex flex-col select-none antialiased">
      {/* Top Ambient Subtle Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-blue-50/60 via-stone-50/20 to-transparent" />

      {/* ------------------------------------------------------------- */}
      {/* Top Header Bar: Clean White Luxury Bar */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 py-3 transition-all shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Return & Clean Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              title="Return to Course Syllabus"
              aria-label="Go to Syllabus"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go to Syllabus</span>
            </button>
            <h1 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-stone-900">
              Byte Runner
            </h1>
          </div>

          {/* Right: Stats & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Timer Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 font-mono text-xs sm:text-sm font-semibold">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{formatTime(timerSeconds)}</span>
            </div>

            {/* Instant New Puzzle Generator Button */}
            <button
              onClick={() => handleGenerateFresh()}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50/90 hover:bg-blue-100 border border-blue-200/90 shadow-2xs transition-all cursor-pointer"
              title="Generate a brand new puzzle"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>New Puzzle</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
              title={soundOn ? 'Mute Sound' : 'Enable Sound'}
              aria-label="Toggle Sound"
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
            </button>

            {/* How to Play Help */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
              title="How to Play"
              aria-label="Rules"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* Main Game Stage: Center Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-2xl mx-auto w-full">
        {/* Minimal Clean Track */}
        <div className="w-full max-w-[460px] h-1 bg-stone-100 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-blue-600 transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Realistic Ceramic Board Surface */}
        <div
          ref={gridContainerRef}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
          className="relative bg-white rounded-3xl p-3 sm:p-5 border border-stone-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)] touch-none transition-all w-full max-w-[460px] aspect-square flex flex-col"
        >
          {/* Subtle Ceramic Grid Backdrop */}
          <div
            className="relative w-full h-full grid gap-2 sm:gap-2.5 flex-1"
            style={{
              gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`,
            }}
          >
            {/* SVG Continuous Path Line Overlay */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              viewBox={`0 0 ${boardSize * 100} ${boardSize * 100}`}
              preserveAspectRatio="none"
            >
              {/* Outer soft shadow path */}
              {path.length > 1 && (
                <polyline
                  points={path
                    .map((p) => `${p.c * 100 + 50},${p.r * 100 + 50}`)
                    .join(' ')}
                  fill="none"
                  stroke="#1D4ED8"
                  strokeWidth="24"
                  strokeOpacity="0.12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {/* Primary Ribbon Path */}
              {path.length > 1 && (
                <polyline
                  points={path
                    .map((p) => `${p.c * 100 + 50},${p.r * 100 + 50}`)
                    .join(' ')}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {/* Inner core luminous highlight */}
              {path.length > 1 && (
                <polyline
                  points={path
                    .map((p) => `${p.c * 100 + 50},${p.r * 100 + 50}`)
                    .join(' ')}
                  fill="none"
                  stroke="#93C5FD"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.85"
                />
              )}
              {/* Animated pulsating head marker */}
              {path.length > 0 && (
                <circle
                  cx={path[path.length - 1].c * 100 + 50}
                  cy={path[path.length - 1].r * 100 + 50}
                  r="8"
                  fill="#1E40AF"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  className="animate-pulse"
                />
              )}
            </svg>

            {/* Individual Interactive Cells */}
            {Array.from({ length: boardSize }).map((_, r) =>
              Array.from({ length: boardSize }).map((_, c) => {
                const cellKey = `${r},${c}`;
                const checkpoint = checkpointMap.get(cellKey);
                const isVisited = pathSet.has(cellKey);
                const pathIndex = path.findIndex((p) => p.r === r && p.c === c);
                const isHead = path.length > 0 && path[path.length - 1].r === r && path[path.length - 1].c === c;
                const isHint = hintCoord && hintCoord.r === r && hintCoord.c === c;
                const isReachedCheckpoint = checkpoint && reachedCheckpointNums.has(checkpoint.num);
                const isNextTarget = checkpoint && checkpoint.num === nextTargetCheckpoint;

                return (
                  <button
                    key={cellKey}
                    type="button"
                    data-grid-cell="true"
                    data-row={r}
                    data-col={c}
                    onMouseEnter={() => {
                      if (isDragging) {
                        attemptMove(r, c);
                      }
                    }}
                    onClick={() => attemptMove(r, c)}
                    className={`relative rounded-2xl flex items-center justify-center transition-all duration-150 cursor-pointer select-none outline-none ${
                      isVisited
                        ? 'bg-blue-50/70 border border-blue-200/80 shadow-inner'
                        : isHint
                        ? 'bg-amber-50 border-2 border-amber-400 animate-pulse'
                        : 'bg-[#F9FAFB] hover:bg-stone-100 border border-stone-200/80 hover:border-stone-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]'
                    }`}
                  >
                    {/* Numbered Waypoint Token: Realistic 3D Puck */}
                    {checkpoint ? (
                      <div
                        className={`z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-mono font-bold text-sm sm:text-base transition-transform duration-200 ${
                          isReachedCheckpoint
                            ? 'bg-gradient-to-b from-blue-600 to-indigo-700 text-white shadow-[0_4px_12px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] scale-105'
                            : isNextTarget
                            ? 'bg-white text-blue-700 border-2 border-blue-600 shadow-[0_4px_14px_rgba(37,99,235,0.25)] ring-4 ring-blue-500/20 animate-pulse'
                            : 'bg-gradient-to-b from-white to-stone-100 text-stone-800 border-2 border-stone-300 shadow-[0_3px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]'
                        }`}
                      >
                        {checkpoint.num}
                      </div>
                    ) : isVisited ? (
                      /* Small index dot or quiet center locator */
                      <div className="z-10 w-2 h-2 rounded-full bg-blue-400/40" />
                    ) : null}

                    {/* Hint beacon */}
                    {isHint && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3 z-30">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Bottom Tactile Action Toolbar */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4 w-full max-w-[460px]">
          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={path.length <= 1}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200/90 text-stone-700 font-medium text-xs sm:text-sm shadow-xs active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-stone-500" />
            <span>Undo</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={path.length <= 1}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200/90 text-stone-700 font-medium text-xs sm:text-sm shadow-xs active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-stone-500" />
            <span>Clear</span>
          </button>

          {/* Hint Button */}
          <button
            onClick={handleHint}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-b from-blue-50 to-indigo-50/50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 text-blue-700 font-semibold text-xs sm:text-sm shadow-xs active:translate-y-0.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Hint</span>
          </button>
        </div>

      </main>

      {/* ------------------------------------------------------------- */}
      {/* Rules / How to Play Modal */}
      {/* ------------------------------------------------------------- */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                How to Play Byte Runner
              </h3>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs sm:text-sm text-stone-600 leading-relaxed">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <p>
                  <strong>Sequential Order:</strong> Start at node <strong>1</strong> and connect to <strong>2</strong>, <strong>3</strong>, and so on in strict numerical order.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <p>
                  <strong>Fill Every Tile:</strong> You must visit <strong>100%</strong> of the cells on the grid before reaching the final node to complete the Zip!
                </p>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <p>
                  <strong>No Crossings:</strong> Moves can only be horizontal or vertical into adjacent squares. The path cannot overlap or branch.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  4
                </span>
                <p>
                  <strong>Instant Rewind:</strong> Click or tap on any previous cell along your path to instantly rewind back to that step!
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Victory Celebration Modal */}
      {/* ------------------------------------------------------------- */}
      {isWinModalOpen && lastWinStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center animate-in zoom-in-95 duration-200">
            {/* Celebration Icon */}
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 mb-4">
              <Trophy className="w-8 h-8" />
            </div>

            <h3 className="font-serif text-2xl font-bold text-stone-900 mb-1">
              Byte Runner Complete!
            </h3>
            <p className="text-xs text-stone-500 mb-5">
              100% Filled
            </p>

            {/* Score & Stats Pill Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5 text-left">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                <span className="text-[11px] text-stone-500 font-medium block">
                  Time Taken
                </span>
                <span className="text-base font-bold font-mono text-stone-900">
                  {formatTime(lastWinStats.timeSec)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                <span className="text-[11px] text-stone-500 font-medium block">
                  Moves
                </span>
                <span className="text-base font-bold font-mono text-stone-900">
                  {lastWinStats.moves}
                </span>
              </div>

              <div className="col-span-2 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-blue-700 font-medium block">
                    Score Earned
                  </span>
                  <span className="text-xl font-extrabold font-mono text-blue-900">
                    +{lastWinStats.score} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handleGenerateFresh()}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Next Puzzle</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExit}
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4 text-stone-600" />
                <span>Go to Syllabus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ZipLogicGame = ByteRunnerGame;
