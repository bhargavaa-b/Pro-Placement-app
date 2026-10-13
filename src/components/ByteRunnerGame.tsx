import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  RotateCcw,
  ShieldCheck,
  Volume2,
  VolumeX,
  Trophy,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Zap,
  Sparkles,
  Play,
} from 'lucide-react';

export type GameStatus = 'READY' | 'PLAYING' | 'GAMEOVER';

interface ByteRunnerProps {
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

const SHIELD_TARGET_SCORE = 500;
const LANE_COUNT = 5;

export const ByteRunnerGame: React.FC<ByteRunnerProps> = ({
  onShieldEarned,
  onGamePlayed,
  hasShield,
  streakShieldActive,
  highScore,
  initialHighScore,
  onExit,
}) => {
  const effectiveHasShield = Boolean(hasShield ?? streakShieldActive);
  const effectiveHighScore = highScore ?? initialHighScore ?? 0;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<GameStatus>('READY');
  const gameStateRef = useRef<GameStatus>('READY');

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = parseInt(
      localStorage.getItem('pro_placement_game_highscore') || '0',
      10
    );
    return Math.max(saved, effectiveHighScore);
  });
  const [shieldUnlocked, setShieldUnlocked] = useState(effectiveHasShield);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [combo, setCombo] = useState(1);
  const [hasActiveArmor, setHasActiveArmor] = useState(false);

  // Keep callbacks in refs so updating parent state on Game Over NEVER restarts the canvas loop
  const onGamePlayedRef = useRef(onGamePlayed);
  useEffect(() => {
    onGamePlayedRef.current = onGamePlayed;
  }, [onGamePlayed]);

  const onShieldEarnedRef = useRef(onShieldEarned);
  useEffect(() => {
    onShieldEarnedRef.current = onShieldEarned;
  }, [onShieldEarned]);

  const effectiveHasShieldRef = useRef(effectiveHasShield);
  useEffect(() => {
    effectiveHasShieldRef.current = effectiveHasShield;
    if (effectiveHasShield) {
      setShieldUnlocked(true);
    }
  }, [effectiveHasShield]);

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (effectiveHighScore > bestScore) {
      setBestScore(effectiveHighScore);
    }
  }, [effectiveHighScore, bestScore]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Lock body scroll while Byte Runner full-screen view is mounted
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const toggleNativeFullscreen = useCallback(() => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(() => {});
        } else if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    } catch {
      // Ignore fullscreen restrictions on mobile browsers
    }
  }, []);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const playSound = useCallback(
    (
      type:
        | 'move'
        | 'orb'
        | 'graze'
        | 'shield'
        | 'dash'
        | 'shatter'
        | 'hit'
    ) => {
      if (!soundEnabledRef.current) return;
      try {
        if (!audioCtxRef.current) {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          if (AudioCtx) audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'move') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(340, now);
          osc.frequency.exponentialRampToValueAtTime(560, now + 0.07);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
          osc.start(now);
          osc.stop(now + 0.07);
        } else if (type === 'graze') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(680, now);
          osc.frequency.exponentialRampToValueAtTime(1180, now + 0.09);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
          osc.start(now);
          osc.stop(now + 0.09);
        } else if (type === 'orb') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(860, now);
          osc.frequency.exponentialRampToValueAtTime(1620, now + 0.11);
          gain.gain.setValueAtTime(0.11, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
          osc.start(now);
          osc.stop(now + 0.11);
        } else if (type === 'shield') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.06);
          osc.frequency.setValueAtTime(1046.5, now + 0.12);
          gain.gain.setValueAtTime(0.13, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
          osc.start(now);
          osc.stop(now + 0.24);
        } else if (type === 'dash') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(240, now);
          osc.frequency.exponentialRampToValueAtTime(940, now + 0.18);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
        } else if (type === 'shatter') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(480, now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);
          gain.gain.setValueAtTime(0.13, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
          osc.start(now);
          osc.stop(now + 0.14);
        } else if (type === 'hit') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(160, now);
          osc.frequency.exponentialRampToValueAtTime(42, now + 0.26);
          gain.gain.setValueAtTime(0.16, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
          osc.start(now);
          osc.stop(now + 0.26);
        }
      } catch {
        // Ignore audio errors
      }
    },
    []
  );

  const controlsRef = useRef<{
    moveLeft: () => void;
    moveRight: () => void;
    setTargetX: (clientX: number) => void;
    restart: () => void;
    start: () => void;
  }>({
    moveLeft: () => {},
    moveRight: () => {},
    setTargetX: () => {},
    restart: () => {},
    start: () => {},
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();
    let W = Math.max(320, window.innerWidth);
    let H = Math.max(480, window.innerHeight);
    let trackLeft = 0;
    let trackRight = W;
    let trackWidth = W;
    let laneWidth = trackWidth / LANE_COUNT;

    const getLaneCenter = (laneIdx: number) =>
      trackLeft +
      laneWidth * (Math.max(0, Math.min(LANE_COUNT - 1, laneIdx)) + 0.5);

    let currentLane = 2;
    const player = {
      x: W / 2,
      targetX: W / 2,
      y: H * 0.75,
      r: 18,
      tilt: 0,
      runCycle: 0,
      trail: [] as { x: number; y: number; dash: boolean; bit: string }[],
    };

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      W = Math.max(300, rect.width || window.innerWidth);
      H = Math.max(440, rect.height || window.innerHeight);

      // Edge-to-edge full screen on mobile phones (< 640px); centered highway on wider screens
      const isMobileScreen = W < 640;
      const maxTrackW = isMobileScreen ? W : Math.min(W * 0.92, 700);
      trackLeft = (W - maxTrackW) / 2;
      trackRight = trackLeft + maxTrackW;
      trackWidth = maxTrackW;
      laneWidth = trackWidth / LANE_COUNT;
      player.r = isMobileScreen ? Math.min(18, Math.max(14, laneWidth * 0.24)) : 19;
      player.targetX = getLaneCenter(currentLane);
      player.x = player.targetX;
      player.y = Math.floor(H * (isMobileScreen ? 0.73 : 0.75));

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateDimensions();
    const resizeObs = new ResizeObserver(updateDimensions);
    resizeObs.observe(container);
    window.addEventListener('resize', updateDimensions);

    interface Hazard {
      x: number;
      y: number;
      w: number;
      h: number;
      vx: number;
      vy: number;
      kind: 'BARRIER' | 'SPINNER' | 'SEEKER' | 'SWEEPER';
      color: string;
      phase: number;
      grazed: boolean;
    }

    interface Pickup {
      x: number;
      y: number;
      r: number;
      kind: 'BYTE' | 'OVERDRIVE' | 'SHIELD';
      bit: string;
      phase: number;
    }

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      color: string;
      alpha: number;
      decay: number;
    }

    interface RingWave {
      x: number;
      y: number;
      r: number;
      maxR: number;
      color: string;
      alpha: number;
    }

    interface FloatingCallout {
      x: number;
      y: number;
      text: string;
      color: string;
      alpha: number;
    }

    const stars = Array.from({ length: 65 }, (_, i) => ({
      rx: ((i * 97) % 1000) / 1000,
      ry: ((i * 61) % 1000) / 1000,
      size: (i % 3) * 0.7 + 0.8,
      speed: 1.5 + (i % 4) * 1.1,
    }));

    let isGameOver = false;
    let currentScore = 0;
    let currentCombo = 1;
    let comboTimer = 0;
    let dashCooldown = 0;
    let dashFrames = 0;
    // Start WITHOUT free armor so getting hit immediately triggers Game Over
    let armorActive = false;
    let shieldEarnedInRun = effectiveHasShieldRef.current;
    let screenShake = 0;
    let gridScroll = 0;
    let hudSyncTick = 0;

    let hazards: Hazard[] = [];
    let pickups: Pickup[] = [];
    let particles: Particle[] = [];
    let rings: RingWave[] = [];
    let callouts: FloatingCallout[] = [];
    let hazardTimer = 0;
    let pickupTimer = 0;

    const addCallout = (
      x: number,
      y: number,
      text: string,
      color = '#38BDF8'
    ) => {
      callouts.push({
        x: Math.max(65, Math.min(W - 65, x)),
        y,
        text,
        color,
        alpha: 1,
      });
    };

    const addBurst = (
      x: number,
      y: number,
      color: string,
      count = 16,
      spd = 6
    ) => {
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
        const v = (0.4 + Math.random() * 0.8) * spd;
        particles.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          r: 2 + Math.random() * 2.5,
          color: i % 4 === 0 ? '#FFFFFF' : color,
          alpha: 1,
          decay: 0.028 + Math.random() * 0.015,
        });
      }
    };

    const addRing = (x: number, y: number, maxR: number, color: string) => {
      rings.push({ x, y, r: 8, maxR, color, alpha: 1 });
    };

    const triggerGameOver = () => {
      if (isGameOver || gameStateRef.current === 'GAMEOVER') return;
      isGameOver = true;
      gameStateRef.current = 'GAMEOVER';
      const finalScore = Math.floor(currentScore);
      heldKeys.left = false;
      heldKeys.right = false;
      screenShake = 14;
      playSound('hit');
      addBurst(player.x, player.y, '#F43F5E', 34, 9);
      addRing(player.x, player.y, 140, '#F43F5E');

      setScore(finalScore);
      setBestScore((prev) => {
        const next = Math.max(prev, finalScore);
        try {
          localStorage.setItem(
            'pro_placement_game_highscore',
            next.toString()
          );
        } catch {
          // Ignore storage error
        }
        return next;
      });
      setGameState('GAMEOVER');

      if (onGamePlayedRef.current) {
        onGamePlayedRef.current(
          finalScore,
          shieldEarnedInRun || finalScore >= SHIELD_TARGET_SCORE
        );
      }
    };

    const moveLeft = () => {
      if (isGameOver || gameStateRef.current !== 'PLAYING') return;
      currentLane = Math.max(0, currentLane - 1);
      player.targetX = getLaneCenter(currentLane);
      playSound('move');
    };

    const moveRight = () => {
      if (isGameOver || gameStateRef.current !== 'PLAYING') return;
      currentLane = Math.min(LANE_COUNT - 1, currentLane + 1);
      player.targetX = getLaneCenter(currentLane);
      playSound('move');
    };

    const setTargetX = (clientX: number) => {
      if (isGameOver || gameStateRef.current !== 'PLAYING') return;
      const clampedX = Math.max(
        trackLeft + player.r + 4,
        Math.min(trackRight - player.r - 4, clientX)
      );
      player.targetX = clampedX;
      const nearestLane = Math.round(
        (clampedX - trackLeft) / laneWidth - 0.5
      );
      currentLane = Math.max(0, Math.min(LANE_COUNT - 1, nearestLane));
    };

    const startGame = () => {
      isGameOver = false;
      gameStateRef.current = 'PLAYING';
      currentScore = 0;
      currentCombo = 1;
      comboTimer = 0;
      armorActive = false;
      screenShake = 0;
      hazards = [];
      pickups = [];
      particles = [];
      rings = [];
      callouts = [];
      hazardTimer = 0;
      pickupTimer = 0;
      currentLane = 2;
      player.x = getLaneCenter(2);
      player.targetX = getLaneCenter(2);
      player.tilt = 0;
      player.runCycle = 0;
      player.trail = [];

      setScore(0);
      setCombo(1);
      setHasActiveArmor(false);
      setGameState('PLAYING');
      playSound('move');
    };

    const restartGame = () => {
      isGameOver = false;
      gameStateRef.current = 'PLAYING';
      currentScore = 0;
      currentCombo = 1;
      comboTimer = 0;
      armorActive = false;
      screenShake = 0;
      hazards = [];
      pickups = [];
      particles = [];
      rings = [];
      callouts = [];
      hazardTimer = 0;
      pickupTimer = 0;
      currentLane = 2;
      player.x = getLaneCenter(2);
      player.targetX = getLaneCenter(2);
      player.tilt = 0;
      player.runCycle = 0;
      player.trail = [];

      setScore(0);
      setCombo(1);
      setHasActiveArmor(false);
      setGameState('PLAYING');
    };

    controlsRef.current = {
      moveLeft,
      moveRight,
      setTargetX,
      restart: restartGame,
      start: startGame,
    };

    const heldKeys = { left: false, right: false };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current === 'READY') {
        if (
          e.code === 'Space' ||
          e.code === 'Enter' ||
          e.code === 'ArrowUp' ||
          e.code === 'KeyW'
        ) {
          e.preventDefault();
          startGame();
        }
        return;
      }
      if (isGameOver || gameStateRef.current === 'GAMEOVER') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          restartGame();
        }
        return;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        heldKeys.left = true;
        moveLeft();
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        heldKeys.right = true;
        moveRight();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') heldKeys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') heldKeys.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const loop = (now: number) => {
      const dt = Math.min(2.2, Math.max(0.5, (now - lastTime) / 16.667));
      lastTime = now;

      // Strictly update game physics and score ONLY while actively playing
      if (!isGameOver && gameStateRef.current === 'PLAYING') {
        const baseSpeed = 6.4 + Math.min(6.8, currentScore / 320);
        const speed = baseSpeed * dt;

        gridScroll = (gridScroll + speed) % 64;
        currentScore += Math.round(1 * dt);
        player.runCycle += 0.28 * dt;

        if (comboTimer > 0) {
          comboTimer -= dt;
          if (comboTimer <= 0 && currentCombo > 1) {
            currentCombo = 1;
          }
        }

        if (currentScore >= SHIELD_TARGET_SCORE && !shieldEarnedInRun) {
          shieldEarnedInRun = true;
          setShieldUnlocked(true);
          playSound('shield');
          addRing(W * 0.5, H * 0.4, 200, '#34D399');
          addCallout(W * 0.5, H * 0.35, 'GOLD SHIELD UNLOCKED!', '#34D399');
          onShieldEarnedRef.current();
        }

        if (heldKeys.left) {
          player.targetX = Math.max(
            trackLeft + player.r + 6,
            player.targetX - 16 * dt
          );
        }
        if (heldKeys.right) {
          player.targetX = Math.min(
            trackRight - player.r - 6,
            player.targetX + 16 * dt
          );
        }

        const dx = player.targetX - player.x;
        // Silky smooth, highly responsive spring interpolation
        player.x += dx * Math.min(1, 0.32 * dt);

        // Smooth dynamic banking tilt
        const targetTilt = Math.max(-0.35, Math.min(0.35, dx * 0.012));
        player.tilt += (targetTilt - player.tilt) * Math.min(1, 0.22 * dt);

        player.trail.push({
          x: player.x,
          y: player.y,
          dash: false,
          bit: Math.random() > 0.5 ? '1' : '0',
        });
        if (player.trail.length > 10) player.trail.shift();

        // Spawn Byte Runner Obstacles
        hazardTimer += dt;
        const spawnInterval = Math.max(24, 54 - Math.floor(currentScore / 65));
        if (hazardTimer >= spawnInterval) {
          hazardTimer = 0;
          const patternRoll = Math.random();

          if (patternRoll < 0.34) {
            const blockedCount = currentScore > 350 ? 2 : 1;
            const chosenLanes = new Set<number>();
            while (chosenLanes.size < blockedCount) {
              chosenLanes.add(Math.floor(Math.random() * LANE_COUNT));
            }
            chosenLanes.forEach((lane) => {
              const cx = getLaneCenter(lane);
              const w = laneWidth * 0.76;
              hazards.push({
                x: cx - w / 2,
                y: -60,
                w,
                h: 24,
                vx: 0,
                vy: baseSpeed * 1.02,
                kind: 'BARRIER',
                color: '#F43F5E',
                phase: 0,
                grazed: false,
              });
            });
          } else if (patternRoll < 0.64) {
            const lane = Math.floor(Math.random() * LANE_COUNT);
            const size = Math.min(48, laneWidth * 0.66);
            const cx = getLaneCenter(lane);
            hazards.push({
              x: cx - size / 2,
              y: -60,
              w: size,
              h: size,
              vx: 0,
              vy: baseSpeed * 1.12,
              kind: 'SPINNER',
              color: '#EC4899',
              phase: Math.random() * Math.PI * 2,
              grazed: false,
            });
          } else if (patternRoll < 0.85) {
            const w = laneWidth * 1.1;
            const startX =
              trackLeft + Math.random() * Math.max(20, trackWidth - w);
            hazards.push({
              x: startX,
              y: -50,
              w,
              h: 22,
              vx: (Math.random() > 0.5 ? 1 : -1) * 3.0,
              vy: baseSpeed * 0.98,
              kind: 'SWEEPER',
              color: '#F59E0B',
              phase: 0,
              grazed: false,
            });
          } else {
            const lane = Math.floor(Math.random() * LANE_COUNT);
            const size = Math.min(38, laneWidth * 0.62);
            const cx = getLaneCenter(lane);
            hazards.push({
              x: cx - size / 2,
              y: -60,
              w: size,
              h: size,
              vx: (player.x - cx) * 0.011,
              vy: baseSpeed * 1.25,
              kind: 'SEEKER',
              color: '#A855F7',
              phase: 0,
              grazed: false,
            });
          }
        }

        // Spawn Data Byte Pickups
        pickupTimer += dt;
        if (pickupTimer >= 34) {
          pickupTimer = 0;
          const lane = Math.floor(Math.random() * LANE_COUNT);
          const cx = getLaneCenter(lane);
          const roll = Math.random();
          if (roll < 0.1 && !armorActive) {
            pickups.push({
              x: cx,
              y: -40,
              r: 14,
              kind: 'SHIELD',
              bit: 'S',
              phase: 0,
            });
          } else if (roll < 0.34) {
            pickups.push({
              x: cx,
              y: -40,
              r: 14,
              kind: 'OVERDRIVE',
              bit: '2X',
              phase: 0,
            });
          } else {
            pickups.push({
              x: cx,
              y: -40,
              r: 12,
              kind: 'BYTE',
              bit: Math.random() > 0.5 ? '1' : '0',
              phase: 0,
            });
          }
        }

        // Update Hazards & Check Collisions
        for (let i = hazards.length - 1; i >= 0; i--) {
          const h = hazards[i];
          h.y += h.vy * dt;
          h.x += h.vx * dt;
          h.phase += 0.14 * dt;

          if (h.kind === 'SWEEPER') {
            if (h.x <= trackLeft) {
              h.x = trackLeft;
              h.vx = Math.abs(h.vx);
            } else if (h.x + h.w >= trackRight) {
              h.x = trackRight - h.w;
              h.vx = -Math.abs(h.vx);
            }
          }

          const nearestX = Math.max(h.x, Math.min(player.x, h.x + h.w));
          const nearestY = Math.max(h.y, Math.min(player.y, h.y + h.h));
          const dist = Math.hypot(player.x - nearestX, player.y - nearestY);

          if (dist < player.r - 2) {
            if (armorActive) {
              armorActive = false;
              setHasActiveArmor(false);
              screenShake = 9;
              playSound('shatter');
              addBurst(player.x, player.y, '#34D399', 24, 8);
              addRing(player.x, player.y, 115, '#34D399');
              addCallout(player.x, player.y - 24, 'SHIELD USED!', '#34D399');
              hazards.splice(i, 1);
              continue;
            } else {
              // Immediate Game Over — stop score counting right here
              triggerGameOver();
              break;
            }
          } else if (
            !isGameOver &&
            !h.grazed &&
            dist < player.r + 22 &&
            Math.abs(player.y - (h.y + h.h / 2)) < 26
          ) {
            h.grazed = true;
            currentCombo = Math.min(10, currentCombo + 1);
            comboTimer = 210;
            const grazePts = 75 * currentCombo;
            currentScore += grazePts;
            playSound('graze');
            addBurst(nearestX, nearestY, '#FDE047', 10, 4.5);
            addCallout(
              player.x,
              player.y - 26,
              `CLOSE DODGE +${grazePts}!`,
              '#FDE047'
            );
          }

          if (h.y > H + 80) {
            hazards.splice(i, 1);
          }
        }

        // Only update pickups and HUD if player did NOT get out on this frame
        if (!isGameOver && gameStateRef.current === 'PLAYING') {
          for (let i = pickups.length - 1; i >= 0; i--) {
            const p = pickups[i];
            p.y += speed * 0.92;
            p.phase += 0.1 * dt;

            const d = Math.hypot(player.x - p.x, player.y - p.y);
            if (d < player.r + p.r + 6) {
              if (p.kind === 'SHIELD') {
                armorActive = true;
                setHasActiveArmor(true);
                playSound('shield');
                addBurst(p.x, p.y, '#34D399', 18, 6);
                addCallout(p.x, p.y - 16, 'SHIELD ACTIVE!', '#34D399');
              } else {
                currentCombo = Math.min(10, currentCombo + 1);
                comboTimer = 220;
                const pts = (p.kind === 'OVERDRIVE' ? 120 : 50) * currentCombo;
                currentScore += pts;
                playSound('orb');
                addBurst(
                  p.x,
                  p.y,
                  p.kind === 'OVERDRIVE' ? '#FDE047' : '#38BDF8',
                  14,
                  5.5
                );
                addCallout(
                  p.x,
                  p.y - 14,
                  `+${pts} BYTE (${currentCombo}x)`,
                  p.kind === 'OVERDRIVE' ? '#FDE047' : '#38BDF8'
                );
              }
              pickups.splice(i, 1);
              continue;
            }

            if (p.y > H + 60) {
              pickups.splice(i, 1);
            }
          }

          hudSyncTick += dt;
          if (hudSyncTick >= 3) {
            hudSyncTick = 0;
            setScore(Math.floor(currentScore));
            setCombo(currentCombo);
          }
        }
      }

      // ============================================================================
      // RENDER FULL-SCREEN BYTE RUNNER CYBER ARENA
      // ============================================================================
      ctx.save();
      if (screenShake > 0) {
        ctx.translate(
          (Math.random() - 0.5) * screenShake * 2,
          (Math.random() - 0.5) * screenShake * 2
        );
        screenShake = Math.max(0, screenShake - 0.55 * dt);
      }

      const isOverdrive = dashFrames > 0 || currentCombo >= 5;

      // 1. Premium Cyber Deep Cosmic Backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#020617');
      bgGrad.addColorStop(0.4, isOverdrive ? '#0B254E' : '#081226');
      bgGrad.addColorStop(1, '#030712');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Neon Horizon Ambient Glow
      const horizonGrad = ctx.createRadialGradient(
        W / 2,
        0,
        10,
        W / 2,
        0,
        Math.max(W * 0.7, 320)
      );
      horizonGrad.addColorStop(
        0,
        isOverdrive ? 'rgba(56, 189, 248, 0.32)' : 'rgba(99, 102, 241, 0.22)'
      );
      horizonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, 0, W, H * 0.45);

      // 2. Parallax Starfield & Cyber Dust Particles
      stars.forEach((s) => {
        if (!isGameOver) {
          s.ry = (s.ry + (s.speed * dt) / H) % 1;
        }
        ctx.fillStyle = isOverdrive
          ? 'rgba(186, 230, 253, 0.65)'
          : 'rgba(226, 232, 240, 0.4)';
        ctx.beginPath();
        ctx.arc(s.rx * W, s.ry * H, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Byte Runner Track & Luminous Lane Dividers
      const trackGrad = ctx.createLinearGradient(trackLeft, 0, trackRight, 0);
      trackGrad.addColorStop(0, 'rgba(8, 15, 34, 0.92)');
      trackGrad.addColorStop(0.5, 'rgba(12, 24, 52, 0.82)');
      trackGrad.addColorStop(1, 'rgba(8, 15, 34, 0.92)');
      ctx.fillStyle = trackGrad;
      ctx.fillRect(trackLeft, 0, trackWidth, H);

      // Perspective Speed Grid Lines
      ctx.strokeStyle = isOverdrive
        ? 'rgba(56, 189, 248, 0.22)'
        : 'rgba(99, 102, 241, 0.16)';
      ctx.lineWidth = 1;
      for (let y = gridScroll; y < H; y += 64) {
        ctx.beginPath();
        ctx.moveTo(trackLeft, y);
        ctx.lineTo(trackRight, y);
        ctx.stroke();
      }

      // Vertical Laser Lane Dividers with Electric Cyan Border Glow
      for (let l = 0; l <= LANE_COUNT; l++) {
        const lx = trackLeft + l * laneWidth;
        const isBorder = l === 0 || l === LANE_COUNT;
        ctx.strokeStyle = isBorder
          ? isOverdrive
            ? '#00F2FE'
            : '#38BDF8'
          : 'rgba(99, 102, 241, 0.22)';
        ctx.lineWidth = isBorder ? 3.5 : 1;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, H);
        ctx.stroke();
      }

      // 4. Render Data Byte Pickups (Glowing Cyber Cubes & Streak Shields)
      pickups.forEach((p) => {
        ctx.save();
        const pulseR = p.r + Math.sin(p.phase * 2) * 2;
        if (p.kind === 'SHIELD') {
          // 3D Golden Streak Shield with Energy Ring
          ctx.translate(p.x, p.y);
          const shieldGrad = ctx.createLinearGradient(0, -pulseR, 0, pulseR);
          shieldGrad.addColorStop(0, '#FEF08A');
          shieldGrad.addColorStop(0.5, '#F59E0B');
          shieldGrad.addColorStop(1, '#B45309');

          ctx.fillStyle = shieldGrad;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          // Hexagonal Shield Crest
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const hx = Math.cos(angle) * (pulseR + 2);
            const hy = Math.sin(angle) * (pulseR + 2);
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Rotating Outer Gold Halo
          ctx.strokeStyle = 'rgba(253, 224, 71, 0.65)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, pulseR + 6, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.kind === 'OVERDRIVE') {
          // Electric Hyper-Drive Core
          ctx.fillStyle = '#6366F1';
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, pulseR, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          // Glowing Isometric Cyber Byte Cube
          ctx.translate(p.x, p.y);
          const cubeGrad = ctx.createLinearGradient(-pulseR, -pulseR, pulseR, pulseR);
          cubeGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
          cubeGrad.addColorStop(1, 'rgba(99, 102, 241, 0.35)');
          ctx.fillStyle = cubeGrad;
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-pulseR, -pulseR, pulseR * 2, pulseR * 2, 5);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#F0F9FF';
          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.bit, 0, 0);
        }
        ctx.restore();
      });

      // 5. Render Cyber Hazards (Sleek High-Tech Crimson Firewalls)
      hazards.forEach((h) => {
        ctx.save();
        if (h.kind === 'SPINNER') {
          // Rotating Laser Hazard Star
          const cx = h.x + h.w / 2;
          const cy = h.y + h.h / 2;
          ctx.translate(cx, cy);
          ctx.rotate(h.phase);
          const r = h.w / 2;
          ctx.fillStyle = '#DC2626';
          ctx.strokeStyle = '#FCA5A5';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const rad = i % 2 === 0 ? r : r * 0.45;
            const ang = (i * Math.PI) / 4;
            if (i === 0) ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
            else ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Glowing Center Energy Core
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (h.kind === 'SEEKER') {
          // Stealth Cyber Drone
          const cx = h.x + h.w / 2;
          const cy = h.y + h.h / 2;
          ctx.translate(cx, cy);
          ctx.fillStyle = '#0F172A';
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, h.h / 2);
          ctx.lineTo(h.w / 2, -h.h / 2);
          ctx.lineTo(0, -h.h * 0.2);
          ctx.lineTo(-h.w / 2, -h.h / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Red Optical Sensor
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Crimson Laser Firewall Barrier
          const hazGrad = ctx.createLinearGradient(h.x, h.y, h.x, h.y + h.h);
          hazGrad.addColorStop(0, '#EF4444');
          hazGrad.addColorStop(0.6, '#B91C1C');
          hazGrad.addColorStop(1, '#7F1D1D');

          ctx.fillStyle = hazGrad;
          ctx.strokeStyle = '#FCA5A5';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(h.x, h.y, h.w, h.h, 6);
          ctx.fill();
          ctx.stroke();

          // Hazard Warning Stripe
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.fillRect(h.x + 6, h.y + h.h * 0.35, Math.max(4, h.w - 12), 3);
        }
        ctx.restore();
      });

      // 6. Render Byte Runner Binary Trail
      player.trail.forEach((t, idx) => {
        const ratio = (idx + 1) / player.trail.length;
        ctx.save();
        ctx.globalAlpha = ratio * (t.dash ? 0.65 : 0.35);
        ctx.fillStyle = t.dash ? '#00F2FE' : '#38BDF8';
        ctx.beginPath();
        ctx.arc(
          t.x,
          t.y + (player.trail.length - idx) * 2.5,
          player.r * ratio * 0.65,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      });

      // 7. Render Animated Byte Runner Cyber Sprinter Avatar
      ctx.save();
      if (armorActive) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.strokeStyle = '#00F2FE';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.r + 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.translate(player.x, player.y);
      ctx.rotate(player.tilt);

      const stride = Math.sin(player.runCycle) * 6;

      // Animated Cyber Runner Thruster Boots with Dual Ion Flame Exhaust
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.roundRect(-10, 6 + stride, 6, 11, 3);
      ctx.roundRect(4, 6 - stride, 6, 11, 3);
      ctx.fill();

      // Ion Flame Particles under boots
      ctx.fillStyle = isOverdrive ? '#00F2FE' : '#38BDF8';
      ctx.beginPath();
      ctx.arc(-7, 18 + stride, 2.5, 0, Math.PI * 2);
      ctx.arc(7, 18 - stride, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Cyber Sprinter Suit Torso — High-End Titanium Cobalt & Electric Cyan
      const suitGrad = ctx.createLinearGradient(0, -22, 0, 14);
      suitGrad.addColorStop(0, '#E0F2FE');
      suitGrad.addColorStop(0.35, isOverdrive ? '#00F2FE' : '#38BDF8');
      suitGrad.addColorStop(0.75, isOverdrive ? '#0284C7' : '#1D4ED8');
      suitGrad.addColorStop(1, '#0F172A');

      ctx.fillStyle = suitGrad;
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-14, -8, 28, 18, 7);
      ctx.fill();
      ctx.stroke();

      // Swinging Mecha Cyber Arms
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-19, -6 - stride * 0.7, 5, 13, 2.5);
      ctx.roundRect(14, -6 + stride * 0.7, 5, 13, 2.5);
      ctx.fill();
      ctx.stroke();

      // Cyber Runner Helmet & Glowing Electric Cyan Visor
      ctx.fillStyle = '#0B1324';
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -13, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing Neon Laser Visor
      ctx.fillStyle = isOverdrive ? '#00F2FE' : '#38BDF8';
      ctx.beginPath();
      ctx.roundRect(-7, -16, 14, 4.5, 2.5);
      ctx.fill();

      ctx.restore();

      // 8. Render Shockwave Rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const rw = rings[i];
        rw.r += (rw.maxR - rw.r) * 0.18 * dt;
        rw.alpha -= 0.045 * dt;
        if (rw.alpha <= 0.02) {
          rings.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = rw.alpha;
          ctx.strokeStyle = rw.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(rw.x, rw.y, rw.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 9. Render Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.alpha -= pt.decay * dt;
        if (pt.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = pt.alpha;
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 10. Render Floating Callouts
      for (let i = callouts.length - 1; i >= 0; i--) {
        const c = callouts[i];
        c.y -= 1.6 * dt;
        c.alpha -= 0.024 * dt;
        if (c.alpha <= 0) {
          callouts.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = c.alpha;
          ctx.font = 'bold 13px "JetBrains Mono", monospace';
          ctx.fillStyle = c.color;
          ctx.textAlign = 'center';
          ctx.fillText(c.text, c.x, c.y);
          ctx.restore();
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      resizeObs.disconnect();
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playSound]);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] w-screen h-[100dvh] bg-[#040711] text-white overflow-hidden select-none touch-none flex flex-col justify-between"
    >
      {/* Full-Screen High-DPI Byte Runner Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          if (gameStateRef.current !== 'PLAYING') return;
          isDraggingRef.current = true;
          touchStartRef.current = { x: e.clientX, y: e.clientY };
          controlsRef.current.setTargetX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (gameStateRef.current !== 'PLAYING') return;
          // Ultra-smooth gliding across mobile touch and desktop mouse
          controlsRef.current.setTargetX(e.clientX);
        }}
        onPointerUp={() => {
          isDraggingRef.current = false;
          touchStartRef.current = null;
        }}
        onPointerCancel={() => {
          isDraggingRef.current = false;
          touchStartRef.current = null;
        }}
        className="absolute inset-0 w-full h-full block cursor-pointer touch-none"
      />

      {/* Compact Full-Screen Mobile & Desktop Top Bar HUD */}
      <div className="relative z-10 px-2.5 sm:px-6 pt-2.5 sm:pt-4 flex items-center justify-between gap-1.5 pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {onExit && (
            <button
              type="button"
              onClick={() => {
                try {
                  if (document.fullscreenElement) {
                    document.exitFullscreen?.().catch(() => {});
                  }
                } catch {
                  // Ignore
                }
                onExit();
              }}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-black/80 hover:bg-black border border-white/20 text-xs font-bold text-white transition"
            >
              <ArrowLeft className="w-4 h-4 text-[#FDE047]" />
              <span>Exit</span>
            </button>
          )}

          <div className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#38BDF8] fill-[#38BDF8] shrink-0" />
            <span className="text-[11px] sm:text-sm font-extrabold tracking-tight text-white whitespace-nowrap">
              BYTE RUNNER
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          <div className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 flex items-center gap-1.5 font-mono shadow-[0_0_15px_rgba(6,182,212,0.12)]">
            <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider">
              Score
            </span>
            <span className="text-sm sm:text-xl font-extrabold text-cyan-300 tabular-nums">
              {score}
            </span>
          </div>

          <div
            className={`px-2 sm:px-3 py-1.5 rounded-xl border font-mono text-[11px] sm:text-xs font-extrabold transition ${
              combo >= 5
                ? 'bg-cyan-500/90 text-white border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : combo > 1
                ? 'bg-indigo-600 text-white border-indigo-300'
                : 'bg-slate-950/75 text-gray-300 border-white/15'
            }`}
          >
            {combo}x
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/15 text-xs font-mono">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-gray-400">Best:</span>
            <span className="font-bold text-white tabular-nums">{bestScore}</span>
          </div>

          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              shieldUnlocked || hasActiveArmor
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-slate-950/75 border-white/15 text-gray-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {shieldUnlocked
                ? 'Gold Shield'
                : hasActiveArmor
                ? 'Shield Active'
                : '500 Pts Goal'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/20 text-gray-200 transition"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-400" />
            )}
          </button>

          <button
            type="button"
            onClick={toggleNativeFullscreen}
            aria-label="Toggle Fullscreen"
            className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/20 text-gray-200 transition"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Start Game Screen Overlay — Very Simple, Just START (No text or instructions) */}
      {gameState === 'READY' && (
        <div className="relative z-20 flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => controlsRef.current.start()}
              className="group flex items-center justify-center gap-3 px-10 py-5 sm:px-14 sm:py-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 active:scale-95 text-white font-black text-xl sm:text-2xl tracking-wider shadow-[0_0_50px_rgba(6,182,212,0.45)] transition duration-200 cursor-pointer"
            >
              <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current transition group-hover:scale-110" />
              <span>START</span>
            </button>

            {onExit && (
              <div>
                <button
                  type="button"
                  onClick={onExit}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Exit
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Over Overlay — Clean High-Tech Card */}
      {gameState === 'GAMEOVER' && (
        <div className="relative z-20 flex-1 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
          <div className="max-w-md w-full bg-gradient-to-b from-[#0B152B]/95 via-[#070E22]/95 to-[#040816]/98 border border-red-500/30 rounded-2xl p-6 text-center space-y-5 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RUNNER OUT</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Simulation Complete
            </h2>

            <div className="grid grid-cols-2 gap-3 bg-slate-950/70 border border-white/10 rounded-xl p-4 font-mono">
              <div>
                <div className="text-[10px] text-gray-400 uppercase">
                  Final Score
                </div>
                <div className="text-xl font-extrabold text-white tabular-nums">
                  {score}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase">
                  Best Score
                </div>
                <div className="text-xl font-extrabold text-cyan-300 tabular-nums">
                  {bestScore}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => controlsRef.current.restart()}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-white font-extrabold text-sm tracking-wide transition active:scale-95 shadow-[0_0_25px_rgba(6,182,212,0.35)] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>PLAY AGAIN</span>
              </button>

              {onExit && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      if (document.fullscreenElement) {
                        document.exitFullscreen?.().catch(() => {});
                      }
                    } catch {
                      // Ignore
                    }
                    onExit();
                  }}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition"
                >
                  Back to Syllabus
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
