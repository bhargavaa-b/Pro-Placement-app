import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Award,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Clock,
  UserCheck,
  Square,
  Smartphone,
  Lock,
  Settings,
  X,
  HelpCircle,
  Send,
} from 'lucide-react';
import { VoiceAccent, AccentConfig } from '../types';

export type VoiceGender = 'Male' | 'Female';

export const GLOBAL_ACCENTS: AccentConfig[] = [
  {
    id: 'Indian',
    name: 'Indian Voice Coach',
    label: 'Indian Accent (Default)',
    flag: '🇮🇳',
    interviewerName: 'Voice Coach',
    roleTitle: '',
    langCode: 'en-IN',
    pitch: 1.0,
    rate: 1.0,
  },
  {
    id: 'US',
    name: 'US Voice Coach',
    label: 'US Accent',
    flag: '🇺🇸',
    interviewerName: 'Voice Coach',
    roleTitle: '',
    langCode: 'en-US',
    pitch: 1.0,
    rate: 1.0,
  },
  {
    id: 'UK',
    name: 'UK Voice Coach',
    label: 'UK Accent',
    flag: '🇬🇧',
    interviewerName: 'Voice Coach',
    roleTitle: '',
    langCode: 'en-GB',
    pitch: 1.0,
    rate: 0.98,
  },
  {
    id: 'Australian',
    name: 'Australian Voice Coach',
    label: 'Australian Accent',
    flag: '🇦🇺',
    interviewerName: 'Voice Coach',
    roleTitle: '',
    langCode: 'en-AU',
    pitch: 1.0,
    rate: 0.98,
  },
  {
    id: 'Canadian',
    name: 'Canadian Voice Coach',
    label: 'Canadian Accent',
    flag: '🇨🇦',
    interviewerName: 'Voice Coach',
    roleTitle: '',
    langCode: 'en-CA',
    pitch: 1.0,
    rate: 1.0,
  },
];

const DEFAULT_MODE_TITLE = '';
const PAUSE_AUTO_SEND_MS = 2500; // Reliable 2.5s natural silence auto-send
const VOICE_RMS_MIN_FLOOR = 0.018; // Baseline RMS noise gate (adaptively raised in noisy rooms)
const VOICE_FREQ_MIN_FLOOR = 24; // Baseline human vocal-band energy gate

interface CritiqueResult {
  rating: number;
  fluencyScore: number;
  grammarScore: number;
  vocabularyScore: number;
  clarityScore: number;
  confidenceScore: number;
  spokenReply: string;
  sectionToImprove: string;
  fluencyCritique: string;
  grammarCritique: string;
  vocabularyCritique: string;
  refinedVersion: string;
}

interface UserLanguageAnalytics {
  totalWordsSpoken: number;
  uniqueWordsCount: number;
  totalSentences: number;
  avgWordsPerSentence: number;
  turnsCount: number;
  lexicalDiversityPct: number;
  pronunciationClarityPct: number;
  confidencePacingPct: number;
  paceLabel: string;
  allUserWords: string[];
  lastAnalyzedText: string;
}

// Module-level session store: persists across Stop and tab switches until the user refreshes the browser
const SESSION_VOICE_STORE: {
  dialogueLog: { speaker: 'COACH' | 'YOU'; text: string }[];
  critique: CritiqueResult | null;
  speakingTime: number;
  wpm: number;
  fillerWordsCount: number;
  detectedFillers: string[];
  currentCoachPrompt: string;
  analytics: UserLanguageAnalytics;
} = {
  dialogueLog: [],
  critique: null,
  speakingTime: 0,
  wpm: 0,
  fillerWordsCount: 0,
  detectedFillers: [],
  currentCoachPrompt: '',
  analytics: {
    totalWordsSpoken: 0,
    uniqueWordsCount: 0,
    totalSentences: 0,
    avgWordsPerSentence: 0,
    turnsCount: 0,
    lexicalDiversityPct: 0,
    pronunciationClarityPct: 0,
    confidencePacingPct: 0,
    paceLabel: 'Optimal',
    allUserWords: [],
    lastAnalyzedText: '',
  },
};

const FEMALE_VOICE_HINTS = [
  'female',
  'heera',
  'veena',
  'lekha',
  'neerja',
  'swara',
  'aditi',
  'raveena',
  'priya',
  'samantha',
  'victoria',
  'zira',
  'aria',
  'jenny',
  'sonia',
  'hazel',
  'libby',
  'karen',
  'catherine',
  'linda',
  'moira',
  'tessa',
  'allison',
  'ava',
  'susan',
];

const MALE_VOICE_HINTS = [
  'male',
  'ravi',
  'prabhat',
  'madhur',
  'rishi',
  'hemant',
  'daniel',
  'david',
  'mark',
  'guy',
  'george',
  'ryan',
  'james',
  'richard',
  'aaron',
  'alex',
  'fred',
  'oliver',
  'thomas',
  'liam',
];

export const VoiceCoach: React.FC<{
  onSessionComplete?: () => void;
}> = ({ onSessionComplete }) => {
  const [selectedAccent, setSelectedAccent] = useState<VoiceAccent>('Indian');
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('Female');
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.5);
  const [currentCoachPrompt, setCurrentCoachPrompt] = useState<string>(
    SESSION_VOICE_STORE.currentCoachPrompt
  );

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoResumeAfterReply, setAutoResumeAfterReply] = useState(true);
  const [voiceDetectedActive, setVoiceDetectedActive] = useState(false);
  const [livePreviewWords, setLivePreviewWords] = useState('');
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [showMicGuideModal, setShowMicGuideModal] = useState(false);
  const [micGuideTab, setMicGuideTab] = useState<'android' | 'ios'>('android');
  const [testingMicState, setTestingMicState] = useState<'idle' | 'testing' | 'granted' | 'denied'>('idle');

  // Silence Auto-Send Countdown State
  const [silenceElapsedMs, setSilenceElapsedMs] = useState(0);

  // Live Speech Analytics (Initialized from persistent session store until page refresh)
  const [speakingTime, setSpeakingTime] = useState<number>(
    SESSION_VOICE_STORE.speakingTime
  );
  const [wpm, setWpm] = useState<number>(SESSION_VOICE_STORE.wpm);
  const [fillerWordsCount, setFillerWordsCount] = useState<number>(
    SESSION_VOICE_STORE.fillerWordsCount
  );
  const [detectedFillers, setDetectedFillers] = useState<string[]>(
    SESSION_VOICE_STORE.detectedFillers
  );
  const [languageAnalytics, setLanguageAnalytics] =
    useState<UserLanguageAnalytics>(SESSION_VOICE_STORE.analytics);

  // Interactive Two-Way Conversation Log
  const [dialogueLog, setDialogueLog] = useState<
    { speaker: 'COACH' | 'YOU'; text: string }[]
  >(SESSION_VOICE_STORE.dialogueLog);

  // Detailed Fluency & Language Critique State
  const [critique, setCritique] = useState<CritiqueResult | null>(
    SESSION_VOICE_STORE.critique
  );

  // Synchronous Refs
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const neuralAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const autoResumeTimerRef = useRef< any >(null);
  const recRestartTimerRef = useRef< any >(null);
  const userManuallyStoppedRef = useRef<boolean>(false);
  const speechRecognitionFailedRef = useRef<boolean>(false);

  const isListeningRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const isAnalyzingRef = useRef<boolean>(false);
  const isTranscribingRef = useRef<boolean>(false);
  const hasRecordedVoiceRef = useRef<boolean>(false);
  const voiceFrameCountRef = useRef<number>(0);
  const micStartedAtRef = useRef<number>(0);
  const finalTranscriptRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');
  const lastSeenTranscriptRef = useRef<string>('');
  const lastSpeechActivityRef = useRef<number>(0);
  const speechEventBoostRef = useRef<number>(0);
  const noiseFloorRmsRef = useRef<number>(0.008);
  const noiseFloorFreqRef = useRef<number>(12);
  const acousticSpeechActiveRef = useRef<boolean>(false);
  const ttsWatchdogRef = useRef<any>(null);

  const dialogueLogRef = useRef<{ speaker: 'COACH' | 'YOU'; text: string }[]>(
    dialogueLog
  );
  const currentCoachPromptRef = useRef<string>(currentCoachPrompt);
  const selectedAccentRef = useRef<VoiceAccent>(selectedAccent);
  const voiceGenderRef = useRef<VoiceGender>(voiceGender);
  const voiceSpeedRef = useRef<number>(voiceSpeed);
  const autoResumeRef = useRef<boolean>(autoResumeAfterReply);

  const timerRef = useRef<any>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    dialogueLogRef.current = dialogueLog;
    SESSION_VOICE_STORE.dialogueLog = dialogueLog;
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [dialogueLog, livePreviewWords, isAnalyzing, isTranscribingAudio]);

  useEffect(() => {
    currentCoachPromptRef.current = currentCoachPrompt;
    SESSION_VOICE_STORE.currentCoachPrompt = currentCoachPrompt;
  }, [currentCoachPrompt]);

  useEffect(() => {
    SESSION_VOICE_STORE.critique = critique;
  }, [critique]);

  useEffect(() => {
    SESSION_VOICE_STORE.speakingTime = speakingTime;
    SESSION_VOICE_STORE.wpm = wpm;
    SESSION_VOICE_STORE.fillerWordsCount = fillerWordsCount;
    SESSION_VOICE_STORE.detectedFillers = detectedFillers;
    SESSION_VOICE_STORE.analytics = languageAnalytics;
  }, [
    speakingTime,
    wpm,
    fillerWordsCount,
    detectedFillers,
    languageAnalytics,
  ]);

  useEffect(() => {
    selectedAccentRef.current = selectedAccent;
  }, [selectedAccent]);

  useEffect(() => {
    voiceGenderRef.current = voiceGender;
  }, [voiceGender]);

  useEffect(() => {
    voiceSpeedRef.current = voiceSpeed;
  }, [voiceSpeed]);

  useEffect(() => {
    autoResumeRef.current = autoResumeAfterReply;
  }, [autoResumeAfterReply]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Preload browser speechSynthesis voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener?.(
        'voiceschanged',
        handleVoicesChanged
      );
      return () => {
        window.speechSynthesis.removeEventListener?.(
          'voiceschanged',
          handleVoicesChanged
        );
      };
    }
  }, []);

  const currentAccent =
    GLOBAL_ACCENTS.find((a) => a.id === selectedAccent) || GLOBAL_ACCENTS[0];

  // High-Graphic Voice Wave Canvas — Completely flat horizontal line during silence; waves animate ONLY when voice is actively speaking
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;
    let smoothedEnergy = 0;
    const timeDomainData = new Uint8Array(128);
    const freqData = new Uint8Array(64);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const midY = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Measure real-time voice energy ONLY when speaking above adaptive ambient noise floor
      let targetEnergy = 0;
      const sinceMicStart = Date.now() - micStartedAtRef.current;

      if (isListeningRef.current && analyserRef.current) {
        try {
          analyserRef.current.getByteTimeDomainData(timeDomainData);
          analyserRef.current.getByteFrequencyData(freqData);

          let sumSquares = 0;
          for (let i = 0; i < timeDomainData.length; i++) {
            const norm = (timeDomainData[i] - 128) / 128;
            sumSquares += norm * norm;
          }
          const rms = Math.sqrt(sumSquares / timeDomainData.length);

          // Measure frequency energy in human vocal band (85Hz - 2500Hz)
          let freqSum = 0;
          for (let i = 2; i < 28; i++) {
            freqSum += freqData[i];
          }
          const avgVoiceFreq = freqSum / 26; // 0..255

          // Calibrate ambient room/hardware noise floor during first 450ms of opening mic
          if (sinceMicStart <= 450) {
            noiseFloorRmsRef.current = noiseFloorRmsRef.current * 0.75 + rms * 0.25;
            noiseFloorFreqRef.current = noiseFloorFreqRef.current * 0.75 + avgVoiceFreq * 0.25;
            targetEnergy = 0;
          } else {
            const rmsGate = Math.max(
              VOICE_RMS_MIN_FLOOR,
              Math.min(0.065, noiseFloorRmsRef.current * 2.5 + 0.006)
            );
            const freqGate = Math.max(
              VOICE_FREQ_MIN_FLOOR,
              Math.min(85, noiseFloorFreqRef.current * 1.85 + 8)
            );

            const isAcousticVoiceNow =
              (rms >= rmsGate && avgVoiceFreq >= freqGate) ||
              rms >= rmsGate * 1.45;

            if (isAcousticVoiceNow) {
              const rmsExcess = Math.max(0, rms - rmsGate);
              const freqExcess = Math.max(0, avgVoiceFreq - freqGate) / 55;
              targetEnergy = Math.max(
                0.35,
                Math.min(1, rmsExcess * 18 + freqExcess * 0.6 + 0.25)
              );
            } else {
              // Slowly track true ambient silence floor without letting silence trigger wave motion
              noiseFloorRmsRef.current = noiseFloorRmsRef.current * 0.98 + rms * 0.02;
              noiseFloorFreqRef.current =
                noiseFloorFreqRef.current * 0.98 + avgVoiceFreq * 0.02;
              targetEnergy = 0;
            }
          }
        } catch {
          targetEnergy = 0;
        }
      }

      // Respond when Web Speech API freshly recognizes new words
      if (isListeningRef.current && speechEventBoostRef.current > 0.04) {
        targetEnergy = Math.max(targetEnergy, speechEventBoostRef.current);
        speechEventBoostRef.current *= 0.84;
      } else {
        speechEventBoostRef.current = 0;
      }

      // Respond when Voice Coach TTS is actively speaking
      if (isSpeakingRef.current) {
        const pulse =
          0.48 +
          0.24 * Math.sin(phase * 2.3) +
          0.16 * Math.cos(phase * 3.7);
        targetEnergy = Math.max(targetEnergy, pulse);
      }

      // Fast snap-to-zero decay when silent so waves settle immediately into a constant straight line
      if (!isListeningRef.current && !isSpeakingRef.current) {
        targetEnergy = 0;
        smoothedEnergy = 0;
      } else if (targetEnergy > smoothedEnergy) {
        smoothedEnergy = smoothedEnergy * 0.45 + targetEnergy * 0.55;
      } else {
        smoothedEnergy = smoothedEnergy * 0.65 + targetEnergy * 0.35;
        if (targetEnergy === 0 && smoothedEnergy < 0.05) {
          smoothedEnergy = 0;
        }
      }

      // Strict rule: Waves move ONLY while human speech or coach voice is actively speaking
      const isVoiceActive =
        (isListeningRef.current && sinceMicStart > 450 && smoothedEnergy >= 0.06) ||
        (isSpeakingRef.current && smoothedEnergy >= 0.06);

      if (!isVoiceActive) {
        // CONSTANT STEADY LINE: zero vertical wave motion during silence
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(w, midY);
        ctx.strokeStyle = isListeningRef.current ? '#0284C7' : '#94A3B8';
        ctx.lineWidth = 2.0;
        ctx.stroke();

        animId = requestAnimationFrame(render);
        return;
      }

      // Subtle guide baseline while wave is animating
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.16)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Wave Motion: active ONLY when speech / voice is detected
      phase += 0.14 + smoothedEnergy * 0.16;
      const maxAmp = Math.max(6, h * 0.44 * smoothedEnergy);

      const layers = [
        {
          freq: 0.022,
          speed: 1.0,
          ampScale: 1.0,
          lineWidth: 2.8,
          color: isSpeakingRef.current
            ? 'rgba(217, 119, 6, 0.95)'
            : 'rgba(2, 132, 199, 0.95)',
        },
        {
          freq: 0.036,
          speed: -1.35,
          ampScale: 0.68,
          lineWidth: 2.0,
          color: isSpeakingRef.current
            ? 'rgba(245, 158, 11, 0.85)'
            : 'rgba(217, 119, 6, 0.85)',
        },
        {
          freq: 0.052,
          speed: 1.75,
          ampScale: 0.42,
          lineWidth: 1.5,
          color: 'rgba(16, 185, 129, 0.75)',
        },
      ];

      // Draw vertical acoustic spectrum bars in center when mic is active or voice is detected
      const barCount = 38;
      const barSpacing = w / barCount;
      ctx.fillStyle = isSpeakingRef.current
        ? 'rgba(217, 119, 6, 0.22)'
        : 'rgba(2, 132, 199, 0.2)';
      for (let i = 0; i < barCount; i++) {
        const normX = i / barCount;
        const envelope = Math.sin(normX * Math.PI);
        const binVal = analyserRef.current && isListeningRef.current
          ? freqData[i % freqData.length] / 255
          : 0.3 + 0.3 * Math.sin(i * 0.5 + phase);
        const barH = Math.max(2, binVal * maxAmp * 1.4 * envelope);
        const bx = i * barSpacing + barSpacing * 0.25;
        ctx.fillRect(bx, midY - barH / 2, barSpacing * 0.5, barH);
      }

      // Draw 3 smooth harmonic sine waves
      for (const layer of layers) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const normX = x / w;
          const windowEnvelope = Math.pow(Math.sin(normX * Math.PI), 1.6);
          const wave1 = Math.sin(x * layer.freq + phase * layer.speed);
          const wave2 =
            0.45 * Math.cos(x * (layer.freq * 1.8) - phase * layer.speed * 0.7);
          const y =
            midY +
            (wave1 + wave2) *
              (maxAmp * layer.ampScale * 0.75) *
              windowEnvelope;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = layer.lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Cleanup mic stream & speech synthesis on unmount (analytics stay in SESSION_VOICE_STORE until page refresh)
  useEffect(() => {
    return () => {
      stopMicrophoneCapture();
      stopVoicePlaybackOnly();
    };
  }, []);

  const updateCumulativeLanguageAnalytics = (
    spokenSegment: string,
    isCompletedTurn: boolean
  ) => {
    const clean = spokenSegment.trim();
    if (!clean) return;

    const fillerRegex =
      /\b(um|uh|err|like|you know|basically|actually|sort of|kind of|literally|i mean)\b/gi;
    const allDialogueUserText = [
      ...dialogueLogRef.current
        .filter((d) => d.speaker === 'YOU')
        .map((d) => d.text),
      ...(isCompletedTurn ? [] : [clean]),
    ].join(' ');

    const combinedCorpus = (allDialogueUserText || clean).trim();
    const matches = combinedCorpus.match(fillerRegex) || [];
    const uniqueFillers = Array.from(
      new Set(matches.map((m) => m.toLowerCase()))
    );
    setFillerWordsCount(matches.length);
    setDetectedFillers(uniqueFillers);

    const wordsList = combinedCorpus
      .toLowerCase()
      .replace(/[^a-z0-9'\s-]/gi, ' ')
      .split(/\s+/)
      .filter(Boolean);
    const totalWords = wordsList.length;
    const uniqueWords = new Set(wordsList).size;

    const sentencesList = combinedCorpus
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const totalSentences = Math.max(1, sentencesList.length);
    const avgWordsPerSentence = Math.round(totalWords / totalSentences);

    let computedWpm = wpm;
    if (speakingTime > 0 && totalWords > 0) {
      const minutes = Math.max(0.1, speakingTime / 60);
      computedWpm = Math.min(205, Math.max(85, Math.round(totalWords / minutes)));
      setWpm(computedWpm);
    } else if (totalWords > 0 && computedWpm === 0) {
      computedWpm = 132;
      setWpm(132);
    }

    const rawRatio = totalWords > 0 ? uniqueWords / totalWords : 0.75;
    const lexicalDiversityPct = Math.min(
      98,
      Math.max(65, Math.round(rawRatio * 100 + Math.min(18, totalWords * 0.4)))
    );

    const pronunciationClarityPct = Math.min(
      98,
      Math.max(
        72,
        Math.round(92 - matches.length * 2.5 + (avgWordsPerSentence >= 7 ? 4 : 0))
      )
    );

    const wpmDeviation = Math.abs((computedWpm || 132) - 138);
    const confidencePacingPct = Math.min(
      98,
      Math.max(
        70,
        Math.round(94 - wpmDeviation * 0.25 - matches.length * 3)
      )
    );

    const paceLabel =
      computedWpm > 165
        ? 'Fast Pace'
        : computedWpm < 105 && computedWpm > 0
        ? 'Calm / Deliberate'
        : 'Optimal Pace';

    const userTurnsCount =
      dialogueLogRef.current.filter((d) => d.speaker === 'YOU').length +
      (isCompletedTurn ? 0 : 1);

    const updatedAnalytics: UserLanguageAnalytics = {
      totalWordsSpoken: totalWords,
      uniqueWordsCount: uniqueWords,
      totalSentences,
      avgWordsPerSentence,
      turnsCount: Math.max(1, userTurnsCount),
      lexicalDiversityPct,
      pronunciationClarityPct,
      confidencePacingPct,
      paceLabel,
      allUserWords: wordsList,
      lastAnalyzedText: clean,
    };

    SESSION_VOICE_STORE.analytics = updatedAnalytics;
    setLanguageAnalytics(updatedAnalytics);
  };

  const analyzeSpeechTelemetry = (text: string) => {
    updateCumulativeLanguageAnalytics(text, false);
  };

  // Timer while speaking
  useEffect(() => {
    if (isListening) {
      timerRef.current = setInterval(() => {
        setSpeakingTime((t) => {
          const next = t + 1;
          const combined = (
            finalTranscriptRef.current +
            ' ' +
            interimTranscriptRef.current
          ).trim();
          const words = combined.split(/\s+/).filter(Boolean).length;
          const minutes = next / 60;
          if (minutes > 0 && words > 0) {
            setWpm(Math.min(210, Math.round(words / minutes)));
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening]);

  // Real-Time Voice Activity Detection (VAD) & Exact 2.5-Second Silence Auto-Send Loop
  useEffect(() => {
    if (!isListening || isAnalyzing) {
      setSilenceElapsedMs(0);
      setVoiceDetectedActive(false);
      return;
    }

    const timeDomainBuf = new Uint8Array(128);
    const freqBuf = new Uint8Array(32);

    const checkInterval = setInterval(() => {
      if (
        !isListeningRef.current ||
        isAnalyzingRef.current ||
        isTranscribingRef.current ||
        isSpeakingRef.current
      ) {
        setSilenceElapsedMs(0);
        return;
      }

      const currentSpoken = (
        finalTranscriptRef.current +
        ' ' +
        interimTranscriptRef.current
      ).trim();

      // If Web Speech API emitted newly changed words, reset the 2.5s silence timer immediately
      if (currentSpoken && currentSpoken !== lastSeenTranscriptRef.current) {
        lastSeenTranscriptRef.current = currentSpoken;
        hasRecordedVoiceRef.current = true;
        lastSpeechActivityRef.current = Date.now();
        setSilenceElapsedMs(0);
        setVoiceDetectedActive(true);
        return;
      }

      // Check microphone energy strictly above calibrated ambient noise floor
      const sinceMicStart = Date.now() - micStartedAtRef.current;
      let isCurrentlySpeakingAcoustic = false;

      if (analyserRef.current && sinceMicStart > 450) {
        try {
          analyserRef.current.getByteTimeDomainData(timeDomainBuf);
          analyserRef.current.getByteFrequencyData(freqBuf);

          let sumSq = 0;
          for (let i = 0; i < timeDomainBuf.length; i++) {
            const norm = (timeDomainBuf[i] - 128) / 128;
            sumSq += norm * norm;
          }
          const rms = Math.sqrt(sumSq / timeDomainBuf.length);

          let fSum = 0;
          for (let i = 2; i < 28; i++) fSum += freqBuf[i];
          const freqEnergy = fSum / 26;

          const rmsGate = Math.max(
            VOICE_RMS_MIN_FLOOR,
            Math.min(0.065, noiseFloorRmsRef.current * 2.5 + 0.006)
          );
          const freqGate = Math.max(
            VOICE_FREQ_MIN_FLOOR,
            Math.min(85, noiseFloorFreqRef.current * 1.85 + 8)
          );

          isCurrentlySpeakingAcoustic =
            (rms >= rmsGate && freqEnergy >= freqGate) || rms >= rmsGate * 1.45;
        } catch {
          isCurrentlySpeakingAcoustic = false;
        }
      }

      if (isCurrentlySpeakingAcoustic) {
        voiceFrameCountRef.current += 1;
        acousticSpeechActiveRef.current = voiceFrameCountRef.current >= 2;
        if (acousticSpeechActiveRef.current) {
          if (!recognitionRef.current || speechRecognitionFailedRef.current) {
            hasRecordedVoiceRef.current = true;
          }
          lastSpeechActivityRef.current = Date.now();
          setSilenceElapsedMs(0);
          setVoiceDetectedActive(true);
          return;
        }
      } else {
        voiceFrameCountRef.current = 0;
        acousticSpeechActiveRef.current = false;
        setVoiceDetectedActive(false);
      }

      const usingFallbackRecorder =
        (!recognitionRef.current || speechRecognitionFailedRef.current) &&
        mediaRecorderRef.current?.state === 'recording' &&
        hasRecordedVoiceRef.current &&
        audioChunksRef.current.length > 0;

      const hasValidSpeechToSend =
        currentSpoken.length > 0 || usingFallbackRecorder;

      if (!hasValidSpeechToSend || lastSpeechActivityRef.current === 0) {
        setSilenceElapsedMs(0);
        return;
      }

      const elapsed = Date.now() - lastSpeechActivityRef.current;
      setSilenceElapsedMs(Math.min(PAUSE_AUTO_SEND_MS, elapsed));

      // Automatically send after 2.5 seconds of continuous silence
      if (elapsed >= PAUSE_AUTO_SEND_MS) {
        lastSpeechActivityRef.current = 0;
        voiceFrameCountRef.current = 0;
        lastSeenTranscriptRef.current = '';
        setSilenceElapsedMs(0);

        if (currentSpoken) {
          hasRecordedVoiceRef.current = false;
          submitSpokenText(currentSpoken, true);
        } else if (usingFallbackRecorder) {
          hasRecordedVoiceRef.current = false;
          stopAndTranscribeMediaRecorder(true);
        }
      }
    }, 80);

    return () => clearInterval(checkInterval);
  }, [isListening, isAnalyzing]);

  const pickBestVoice = (
    voices: SpeechSynthesisVoice[],
    langCode: string,
    gender: VoiceGender
  ): SpeechSynthesisVoice | undefined => {
    if (!voices || voices.length === 0) return undefined;
    const targetLang = langCode.toLowerCase();
    const baseLang = targetLang.split('-')[0];
    const hints = gender === 'Female' ? FEMALE_VOICE_HINTS : MALE_VOICE_HINTS;
    const oppositeHints =
      gender === 'Female' ? MALE_VOICE_HINTS : FEMALE_VOICE_HINTS;

    const exactLocaleVoices = voices.filter(
      (v) => v.lang.toLowerCase().replace('_', '-') === targetLang
    );
    const englishVoices = voices.filter((v) =>
      v.lang.toLowerCase().startsWith(baseLang)
    );

    const matchGender = (list: SpeechSynthesisVoice[]) => {
      // 1. Prefer high-clarity Neural / Natural / Online / Google voices matching gender
      const neuralGenderMatch = list.find((v) => {
        const lowerName = v.name.toLowerCase();
        const isHighQuality =
          lowerName.includes('natural') ||
          lowerName.includes('online') ||
          lowerName.includes('neural') ||
          lowerName.includes('google') ||
          lowerName.includes('premium') ||
          lowerName.includes('enhanced');
        return isHighQuality && hints.some((h) => lowerName.includes(h));
      });
      if (neuralGenderMatch) return neuralGenderMatch;

      // 2. Any voice explicitly matching gender hints
      const explicitMatch = list.find((v) => {
        const lowerName = v.name.toLowerCase();
        return hints.some((h) => lowerName.includes(h));
      });
      if (explicitMatch) return explicitMatch;

      // 3. Prefer high-quality Neural / Natural / Google voice not matching opposite gender
      const neuralNonOpposite = list.find((v) => {
        const lowerName = v.name.toLowerCase();
        const isHighQuality =
          lowerName.includes('natural') ||
          lowerName.includes('online') ||
          lowerName.includes('neural') ||
          lowerName.includes('google');
        return isHighQuality && !oppositeHints.some((h) => lowerName.includes(h));
      });
      if (neuralNonOpposite) return neuralNonOpposite;

      const nonOpposite = list.find((v) => {
        const lowerName = v.name.toLowerCase();
        return !oppositeHints.some((h) => lowerName.includes(h));
      });
      return nonOpposite;
    };

    return (
      matchGender(exactLocaleVoices) ||
      matchGender(englishVoices) ||
      exactLocaleVoices[0] ||
      englishVoices[0] ||
      voices[0]
    );
  };

  // Normalize text for fast, continuous human speech clarity & natural pronunciation
  const formatTextForHumanSpeech = (raw: string): string => {
    return raw
      .replace(/[*#_`~>"]/g, '')
      .replace(/—/g, ' ')
      .replace(/;/g, '. ')
      .replace(/:/g, ' ')
      .replace(/\bO\(log\s*n\)/gi, 'O of log N')
      .replace(/\bO\(n\s*log\s*n\)/gi, 'O of N log N')
      .replace(/\bO\(n\^2\)|O\(n²\)/gi, 'O of N squared')
      .replace(/\bO\(n\)/gi, 'O of N')
      .replace(/\bO\(1\)/gi, 'O of 1')
      .replace(/\bDBMS\b/g, 'D B M S')
      .replace(/\bSQL\b/g, 'sequel')
      .replace(/\bNoSQL\b/gi, 'No sequel')
      .replace(/\bOOPs?\b/g, 'O O P')
      .replace(/\bDSA\b/g, 'D S A')
      .replace(/\bREST\s*APIs?\b/gi, 'rest A P I')
      .replace(/\bAPIs?\b/g, 'A P I')
      .replace(/\bHTML\b/g, 'H T M L')
      .replace(/\bCSS\b/g, 'C S S')
      .replace(/\bJS\b/g, 'JavaScript')
      .replace(/\bTS\b/g, 'TypeScript')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  const stopVoicePlaybackOnly = () => {
    isSpeakingRef.current = false;
    setIsSpeaking(false);

    if (ttsWatchdogRef.current) {
      clearInterval(ttsWatchdogRef.current);
      ttsWatchdogRef.current = null;
    }

    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }

    if (activeUtteranceRef.current) {
      activeUtteranceRef.current.onstart = null;
      activeUtteranceRef.current.onend = null;
      activeUtteranceRef.current.onerror = null;
      activeUtteranceRef.current = null;
    }

    if (neuralAudioRef.current) {
      try {
        neuralAudioRef.current.onplay = null;
        neuralAudioRef.current.onended = null;
        neuralAudioRef.current.onerror = null;
        neuralAudioRef.current.pause();
        neuralAudioRef.current.currentTime = 0;
      } catch {}
      neuralAudioRef.current = null;
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  };

  const stopAllVoiceAndMic = () => {
    // Mark manual stop so NO background callback, timer, or auto-resume can restart activity
    userManuallyStoppedRef.current = true;

    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }
    if (recRestartTimerRef.current) {
      clearTimeout(recRestartTimerRef.current);
      recRestartTimerRef.current = null;
    }
    if (activeAbortControllerRef.current) {
      try {
        activeAbortControllerRef.current.abort();
      } catch {}
      activeAbortControllerRef.current = null;
    }

    const pendingSpoken = (
      finalTranscriptRef.current +
      ' ' +
      interimTranscriptRef.current
    ).trim();

    stopMicrophoneCapture();
    stopVoicePlaybackOnly();
    isAnalyzingRef.current = false;
    isTranscribingRef.current = false;
    setIsAnalyzing(false);
    setIsTranscribingAudio(false);
    setSilenceElapsedMs(0);

    // Preserve and analyze any words the user spoke before clicking Stop so analytics stay available
    if (pendingSpoken) {
      const updatedUserLog = [
        ...dialogueLogRef.current,
        { speaker: 'YOU' as const, text: pendingSpoken },
      ];
      dialogueLogRef.current = updatedUserLog;
      setDialogueLog(updatedUserLog);
      const localCritique = buildContextualClientCritique(pendingSpoken);
      setCritique(localCritique);
      updateCumulativeLanguageAnalytics(pendingSpoken, true);
    }

    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    lastSeenTranscriptRef.current = '';
    setLivePreviewWords('');
  };

  const speakWithBrowserNaturalVoice = (
    spokenText: string,
    resumeMicOnEnd: boolean
  ) => {
    if (userManuallyStoppedRef.current) return;

    if (!('speechSynthesis' in window)) {
      if (resumeMicOnEnd && autoResumeRef.current && !userManuallyStoppedRef.current) {
        autoResumeTimerRef.current = setTimeout(() => {
          if (!userManuallyStoppedRef.current) {
            startMicrophoneCapture();
          }
        }, 400);
      }
      return;
    }
    try {
      if (activeUtteranceRef.current) {
        activeUtteranceRef.current.onstart = null;
        activeUtteranceRef.current.onend = null;
        activeUtteranceRef.current.onerror = null;
        activeUtteranceRef.current = null;
      }
      window.speechSynthesis.cancel();

      const activeAccent =
        GLOBAL_ACCENTS.find((a) => a.id === selectedAccentRef.current) ||
        GLOBAL_ACCENTS[0];
      const activeGender = voiceGenderRef.current;

      const utterance = new SpeechSynthesisUtterance(spokenText);
      activeUtteranceRef.current = utterance;
      utterance.lang = activeAccent.langCode;
      // Natural, fluent human pitch and pace (supports custom speed up to 2.3x and beyond)
      utterance.pitch = 1.0;
      utterance.rate = Math.max(0.75, Math.min(3.0, voiceSpeedRef.current));
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const chosenVoice = pickBestVoice(
        voices,
        activeAccent.langCode,
        activeGender
      );
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      const finishPlayback = () => {
        if (ttsWatchdogRef.current) {
          clearInterval(ttsWatchdogRef.current);
          ttsWatchdogRef.current = null;
        }
        activeUtteranceRef.current = null;
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        if (
          resumeMicOnEnd &&
          autoResumeRef.current &&
          !userManuallyStoppedRef.current
        ) {
          autoResumeTimerRef.current = setTimeout(() => {
            if (
              !userManuallyStoppedRef.current &&
              !isSpeakingRef.current &&
              !isAnalyzingRef.current
            ) {
              startMicrophoneCapture();
            }
          }, 550);
        }
      };

      const startedAt = Date.now();
      const maxSafetyMs = Math.max(4500, Math.min(28000, spokenText.length * 110));

      utterance.onstart = () => {
        if (userManuallyStoppedRef.current) {
          window.speechSynthesis.cancel();
          return;
        }
        isSpeakingRef.current = true;
        setIsSpeaking(true);
      };
      utterance.onend = finishPlayback;
      utterance.onerror = () => {
        if (ttsWatchdogRef.current) {
          clearInterval(ttsWatchdogRef.current);
          ttsWatchdogRef.current = null;
        }
        activeUtteranceRef.current = null;
        isSpeakingRef.current = false;
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);

      // Watchdog prevents isSpeakingRef / waveform from ever getting stuck if mobile browser omits onend
      ttsWatchdogRef.current = setInterval(() => {
        if (userManuallyStoppedRef.current) {
          clearInterval(ttsWatchdogRef.current);
          ttsWatchdogRef.current = null;
          return;
        }
        const elapsed = Date.now() - startedAt;
        if (
          elapsed > 600 &&
          (!window.speechSynthesis.speaking || elapsed > maxSafetyMs)
        ) {
          finishPlayback();
        }
      }, 250);
    } catch {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }
  };

  const speakText = (text: string, resumeMicOnEnd = false) => {
    if (!text) return;
    // Stop mic & previous audio immediately so coach never hears its own voice
    if (isListeningRef.current) {
      stopMicrophoneCapture();
    }
    stopVoicePlaybackOnly();

    const humanPreparedText = formatTextForHumanSpeech(text);
    // Speak immediately (0ms delay) with brisk 1.15x natural fluency
    speakWithBrowserNaturalVoice(humanPreparedText, resumeMicOnEnd);
  };

  const stopAndTranscribeMediaRecorder = (autoSendResult = true) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      stopMicrophoneCapture();
      return;
    }

    isTranscribingRef.current = true;
    setIsTranscribingAudio(true);

    recorder.onstop = async () => {
      const chunks = [...audioChunksRef.current];
      audioChunksRef.current = [];
      const mimeType = recorder.mimeType || 'audio/webm';

      stopMicrophoneCapture();

      // Check if SpeechRecognition already captured words during this turn
      const currentSpoken = (
        finalTranscriptRef.current +
        ' ' +
        interimTranscriptRef.current
      ).trim();

      if (currentSpoken) {
        isTranscribingRef.current = false;
        setIsTranscribingAudio(false);
        if (autoSendResult && !userManuallyStoppedRef.current) {
          await submitSpokenText(currentSpoken, true);
        }
        return;
      }

      if (chunks.length === 0) {
        isTranscribingRef.current = false;
        setIsTranscribingAudio(false);
        return;
      }

      const blob = new Blob(chunks, { type: mimeType });
      if (blob.size < 40) {
        isTranscribingRef.current = false;
        setIsTranscribingAudio(false);
        return;
      }

      try {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const resStr =
              typeof reader.result === 'string' ? reader.result : '';
            resolve(resStr.includes(',') ? resStr.split(',')[1] : '');
          };
          reader.onerror = () => resolve('');
          reader.readAsDataURL(blob);
        });

        if (base64 && !userManuallyStoppedRef.current) {
          const controller = new AbortController();
          activeAbortControllerRef.current = controller;
          const res = await fetch('/api/interview/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: base64, mimeType }),
            signal: controller.signal,
          });
          if (res.ok && !userManuallyStoppedRef.current) {
            const data = await res.json();
            const spoken =
              typeof data?.transcript === 'string'
                ? data.transcript.trim()
                : '';
            if (spoken && !userManuallyStoppedRef.current) {
              finalTranscriptRef.current = spoken;
              setLivePreviewWords(spoken);
              analyzeSpeechTelemetry(spoken);
              isTranscribingRef.current = false;
              setIsTranscribingAudio(false);
              if (autoSendResult && !userManuallyStoppedRef.current) {
                await submitSpokenText(spoken, true);
              }
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Transcription error:', err);
      }

      isTranscribingRef.current = false;
      setIsTranscribingAudio(false);
      if (autoResumeRef.current && !userManuallyStoppedRef.current) {
        startMicrophoneCapture();
      }
    };

    try {
      if (recorder.state === 'recording') {
        try {
          recorder.requestData();
        } catch {}
      }
      recorder.stop();
    } catch {
      isTranscribingRef.current = false;
      setIsTranscribingAudio(false);
    }
  };

  const stopMicrophoneCapture = () => {
    isListeningRef.current = false;
    hasRecordedVoiceRef.current = false;
    voiceFrameCountRef.current = 0;
    acousticSpeechActiveRef.current = false;
    speechEventBoostRef.current = 0;
    setIsListening(false);
    setVoiceDetectedActive(false);
    setSilenceElapsedMs(0);

    if (recRestartTimerRef.current) {
      clearTimeout(recRestartTimerRef.current);
      recRestartTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.onstop = null;
          mediaRecorderRef.current.stop();
        }
      } catch {}
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {}
      analyserRef.current = null;
    }
  };

  // Robust mobile-safe audio stream retriever with progressive constraint fallbacks
  const getMicrophoneStream = async (): Promise<MediaStream> => {
    // 1. Modern standard navigator.mediaDevices.getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        return await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (err: any) {
        // OverconstrainedError / NotSupportedError is very frequent on mobile phone hardware mics!
        // Fallback to basic audio constraint:
        return await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    }

    // 2. Fallback to legacy vendor getUserMedia for older mobile browsers / webviews
    const legacyGUM =
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia ||
      (navigator as any).msGetUserMedia;

    if (legacyGUM) {
      return new Promise<MediaStream>((resolve, reject) => {
        legacyGUM.call(navigator, { audio: true }, resolve, reject);
      });
    }

    throw new Error('Microphone API is not supported on this device/browser.');
  };

  const startAudioStreamAndRecorder = async (enableMediaRecorder = false): Promise<boolean> => {
    try {
      const stream = await getMicrophoneStream();

      if (!isListeningRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return false;
      }

      setMicPermissionError(null);
      mediaStreamRef.current = stream;

      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        let audioCtx = audioContextRef.current;
        if (!audioCtx || audioCtx.state === 'closed') {
          audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
        try {
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.5;

          // Connect through a zero-gain node to destination so browser audio graph is forced to pull live samples
          const muteGain = audioCtx.createGain();
          muteGain.gain.value = 0.0;
          source.connect(analyser);
          analyser.connect(muteGain);
          muteGain.connect(audioCtx.destination);

          analyserRef.current = analyser;
        } catch {}
      }

      // Only start MediaRecorder if SpeechRecognition is not supported, preventing hardware mic contention
      if (enableMediaRecorder && typeof MediaRecorder !== 'undefined') {
        audioChunksRef.current = [];
        let mimeType = '';
        const candidateTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/aac',
          'audio/ogg',
          'audio/wav',
        ];
        if (MediaRecorder.isTypeSupported) {
          for (const t of candidateTypes) {
            if (MediaRecorder.isTypeSupported(t)) {
              mimeType = t;
              break;
            }
          }
        }

        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        mediaRecorderRef.current = recorder;
        try {
          recorder.start(100);
        } catch {
          recorder.start();
        }
      }
      return true;
    } catch (err: any) {
      console.warn('Microphone access note:', err);
      const isDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        err?.name === 'SecurityError';
      const isNotFound =
        err?.name === 'NotFoundError' ||
        err?.name === 'DevicesNotFoundError';
      const isBusy =
        err?.name === 'NotReadableError' ||
        err?.name === 'TrackStartError';

      let msg = 'Could not access phone microphone. Please tap to allow mic permissions.';
      if (isDenied) {
        msg = 'Microphone permission blocked. Tap "Where to Turn On" below for visual step-by-step phone instructions, or allow Microphone in your browser address bar.';
        setShowMicGuideModal(true);
      } else if (isNotFound) {
        msg = 'No microphone found on this device. Please connect an audio input.';
      } else if (isBusy) {
        msg = 'Microphone is currently held by another app or call. Please close other audio apps and try again.';
      }
      setMicPermissionError(msg);
      return false;
    }
  };

  const testMicPermissions = async () => {
    setTestingMicState('testing');
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Microphone API not supported on this browser context');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setTestingMicState('granted');
      setMicPermissionError(null);
      setTimeout(() => {
        setShowMicGuideModal(false);
        setTestingMicState('idle');
      }, 1400);
    } catch {
      setTestingMicState('denied');
    }
  };

  const startMicrophoneCapture = async () => {
    userManuallyStoppedRef.current = false;
    stopVoicePlaybackOnly();
    setMicPermissionError(null);

    // Synchronously unlock AudioContext directly on the user's touch/click gesture (crucial for iOS Safari)
    const AudioCtx =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      try {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioCtx();
        }
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
      } catch {}
    }

    // Clear any stale partial transcripts from prior turns so only fresh speech is sent
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    lastSeenTranscriptRef.current = '';
    lastSpeechActivityRef.current = 0;
    hasRecordedVoiceRef.current = false;
    acousticSpeechActiveRef.current = false;
    voiceFrameCountRef.current = 0;
    noiseFloorRmsRef.current = 0.008;
    noiseFloorFreqRef.current = 12;
    micStartedAtRef.current = Date.now();
    setLivePreviewWords('');
    setSilenceElapsedMs(0);

    isListeningRef.current = true;
    setIsListening(true);

    const startFallbackRecorderOnStream = () => {
      if (
        !mediaStreamRef.current ||
        typeof MediaRecorder === 'undefined' ||
        (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive')
      ) {
        return;
      }
      try {
        audioChunksRef.current = [];
        let mimeType = '';
        const candidateTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/aac',
          'audio/ogg',
          'audio/wav',
        ];
        if (MediaRecorder.isTypeSupported) {
          for (const t of candidateTypes) {
            if (MediaRecorder.isTypeSupported(t)) {
              mimeType = t;
              break;
            }
          }
        }
        const recorder = mimeType
          ? new MediaRecorder(mediaStreamRef.current, { mimeType })
          : new MediaRecorder(mediaStreamRef.current);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        mediaRecorderRef.current = recorder;
        try {
          recorder.start(100);
        } catch {
          recorder.start();
        }
      } catch {
        // Non-blocking
      }
    };

    // 1. Start Web Speech API directly on the user gesture for zero-latency recognition
    const startSpeechRecognitionInstance = (): boolean => {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) return false;

      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.abort();
          } catch {}
          recognitionRef.current = null;
        }

        const activeAccent =
          GLOBAL_ACCENTS.find((a) => a.id === selectedAccentRef.current) ||
          GLOBAL_ACCENTS[0];

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = activeAccent.langCode || 'en-US';

        recognition.onresult = (event: any) => {
          let finalChunk = '';
          let interimChunk = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalChunk += event.results[i][0].transcript + ' ';
            } else {
              interimChunk += event.results[i][0].transcript;
            }
          }

          if (finalChunk.trim()) {
            const updatedFinal =
              (finalTranscriptRef.current
                ? finalTranscriptRef.current + ' '
                : '') + finalChunk.trim();
            finalTranscriptRef.current = updatedFinal;
            analyzeSpeechTelemetry(updatedFinal);
          }

          interimTranscriptRef.current = interimChunk;
          const combined = (
            finalTranscriptRef.current +
            (interimChunk ? ' ' + interimChunk : '')
          ).trim();
          setLivePreviewWords(combined);

          if ((finalChunk.trim() || interimChunk.trim()) && combined !== lastSeenTranscriptRef.current) {
            lastSeenTranscriptRef.current = combined;
            hasRecordedVoiceRef.current = true;
            speechEventBoostRef.current = 0.85;
            lastSpeechActivityRef.current = Date.now();
            setSilenceElapsedMs(0);
            setVoiceDetectedActive(true);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('SpeechRecognition error:', e?.error);
          if (e?.error === 'no-speech') {
            return;
          }
          if (
            e?.error === 'network' ||
            e?.error === 'audio-capture' ||
            e?.error === 'service-not-allowed' ||
            e?.error === 'not-allowed'
          ) {
            speechRecognitionFailedRef.current = true;
            if (mediaStreamRef.current && e?.error !== 'not-allowed') {
              startFallbackRecorderOnStream();
            } else if (!mediaStreamRef.current) {
              setMicPermissionError(
                'Microphone permission was denied. Tap "Where to Turn On" or allow microphone access in your phone/browser.'
              );
            }
          }
        };

        recognition.onend = () => {
          if (
            isListeningRef.current &&
            !isAnalyzingRef.current &&
            !userManuallyStoppedRef.current &&
            !speechRecognitionFailedRef.current
          ) {
            recRestartTimerRef.current = setTimeout(() => {
              if (
                isListeningRef.current &&
                !isAnalyzingRef.current &&
                !userManuallyStoppedRef.current &&
                !speechRecognitionFailedRef.current
              ) {
                startSpeechRecognitionInstance();
              }
            }, 250);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        return true;
      } catch (err: any) {
        console.warn('SpeechRecognition initialization note:', err);
        return false;
      }
    };

    speechRecognitionFailedRef.current = false;

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const speechRecSupported = Boolean(SpeechRecognitionCtor);

    // 1. Start audio stream & visualizer analyser; only run MediaRecorder concurrently when Web Speech isn't supported
    const audioStreamOk = await startAudioStreamAndRecorder(!speechRecSupported);

    // 2. Start Web Speech API on top of granted microphone
    let speechRecOk = false;
    if (speechRecSupported && (audioStreamOk || navigator.mediaDevices)) {
      speechRecOk = startSpeechRecognitionInstance();
      if (!speechRecOk && audioStreamOk) {
        speechRecognitionFailedRef.current = true;
        startFallbackRecorderOnStream();
      }
    }

    // If both failed to get mic access, reset listening state so user is not stuck
    if (!audioStreamOk && !speechRecOk) {
      stopMicrophoneCapture();
    }
  };

  const toggleRecording = () => {
    // Synchronously unlock AudioContext directly on the user's click gesture
    const AudioCtx =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      try {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioCtx();
        }
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
      } catch {}
    }

    if (isListening) {
      const pendingText = (
        finalTranscriptRef.current +
        ' ' +
        interimTranscriptRef.current
      ).trim();

      if (pendingText) {
        stopMicrophoneCapture();
        submitSpokenText(pendingText, false);
      } else if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === 'recording'
      ) {
        stopAndTranscribeMediaRecorder(true);
      } else {
        stopMicrophoneCapture();
      }
    } else {
      startMicrophoneCapture();
    }
  };

  const buildContextualClientCritique = (spokenText: string): CritiqueResult => {
    const clean = spokenText.trim();
    const lower = clean.toLowerCase();
    const words = clean.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const fillers =
      clean.match(
        /\b(um|uh|err|like|you know|basically|actually|sort of|kind of|literally|i mean)\b/gi
      ) || [];

    const sentences = clean
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const targetPhrase = sentences[0] || clean.slice(0, 85);

    const hasWeakConnectors =
      /\b(and then|so like|because like|very good|lot of things)\b/i.test(clean);
    const fluencyScore = Math.max(
      72,
      Math.min(
        98,
        Math.round(88 - fillers.length * 4 + (wordCount >= 10 ? 6 : -2))
      )
    );
    const grammarScore = Math.max(
      74,
      Math.min(
        98,
        Math.round(90 - (hasWeakConnectors ? 5 : 0) - fillers.length * 2)
      )
    );
    const rating = Math.min(
      10,
      Math.max(7, Math.round((fluencyScore + grammarScore) / 20))
    );

    let spokenReply = '';

    // 1. Science & Nature Real-World Questions
    if (/\b(photosynthesis)\b/i.test(lower)) {
      spokenReply = `Photosynthesis is the biological process by which green plants use sunlight, water, and carbon dioxide to create glucose for energy and release oxygen into the atmosphere.`;
    } else if (/\b(why is the sky blue)\b/i.test(lower)) {
      spokenReply = `The sky is blue because Earth's atmosphere scatters sunlight in all directions, and shorter blue wavelengths are scattered much more than red wavelengths—a process called Rayleigh scattering.`;
    } else if (/\b(why is the ocean salty|why is sea water salty)\b/i.test(lower)) {
      spokenReply = `The ocean is salty because rain breaks down continental rocks over millions of years, washing mineral ions—mainly sodium and chloride—into rivers and down into the sea.`;
    } else if (/\b(how do airplanes? fly|how planes? fly)\b/i.test(lower)) {
      spokenReply = `Airplanes fly using four aerodynamic forces: lift, weight, thrust, and drag. As curved wings move forward through the air, they create higher air pressure underneath than above, generating upward lift.`;
    } else if (/\b(gravity|how does gravity work)\b/i.test(lower)) {
      spokenReply = `Gravity is the universal attractive force between masses. In general relativity, Einstein showed that mass and energy actually curve spacetime, causing objects to follow curved paths toward one another.`;
    } else if (/\b(black holes?)\b/i.test(lower)) {
      spokenReply = `A black hole is an extremely dense region of spacetime where gravitational pull is so immense that nothing, not even light, can escape once past its event horizon.`;
    } else if (/\b(dna|deoxyribonucleic)\b/i.test(lower)) {
      spokenReply = `DNA is the double-helix molecule inside cells that carries the genetic blueprint for the development, functioning, and reproduction of all living organisms.`;
    } else if (/\b(mitochondria|mitochondrion)\b/i.test(lower)) {
      spokenReply = `Mitochondria are the powerhouses of eukaryotic cells. They generate most of the chemical energy needed by the cell in the form of adenosine triphosphate, or ATP.`;
    } else if (/\b(speed of light)\b/i.test(lower)) {
      spokenReply = `The speed of light in a vacuum is approximately 299,792 kilometers per second, or about 186,000 miles per second—the universal cosmic speed limit.`;
    } else if (/\b(atoms?|atomic structure)\b/i.test(lower)) {
      spokenReply = `Atoms are the basic building blocks of ordinary matter, consisting of a dense central nucleus of protons and neutrons surrounded by a cloud of orbiting electrons.`;
    } else if (/\b(quantum computing|quantum computer)\b/i.test(lower)) {
      spokenReply = `Quantum computing harnesses the laws of quantum mechanics—specifically superposition and entanglement—using quantum bits or qubits to solve specific complex computational problems exponentially faster than classical computers.`;
    } else if (/\b(how do microwaves? work)\b/i.test(lower)) {
      spokenReply = `Microwave ovens heat food by emitting electromagnetic radiation that directly excites water and fat molecules inside the food, causing rapid vibration and thermal heat.`;
    } else if (/\b(how does wi-?fi work)\b/i.test(lower)) {
      spokenReply = `Wi-Fi transmits data wirelessly across radio frequencies—typically 2.4 gigahertz and 5 gigahertz—between your device and a wireless router connected to the internet.`;
    } else if (/\b(how do batteries work)\b/i.test(lower)) {
      spokenReply = `Batteries convert chemical energy into electrical energy through electrochemical oxidation and reduction reactions, sending electrons flowing through an external circuit from anode to cathode.`;
    } else if (/\b(climate change|global warming)\b/i.test(lower)) {
      spokenReply = `Climate change refers to long-term shifts in global temperatures and weather patterns, largely driven by human greenhouse gas emissions trapping solar heat in the atmosphere.`;

    // 2. World Capitals & Geography
    } else if (/\b(capital of france)\b/i.test(lower)) {
      spokenReply = `The capital of France is Paris, famous for its cultural heritage, art museums like the Louvre, and iconic landmarks like the Eiffel Tower.`;
    } else if (/\b(capital of japan)\b/i.test(lower)) {
      spokenReply = `The capital of Japan is Tokyo, the world's most populous metropolitan area and a global hub for technology, culture, and business.`;
    } else if (/\b(capital of india)\b/i.test(lower)) {
      spokenReply = `The capital of India is New Delhi, the seat of the government and the executive, legislative, and judiciary branches of the country.`;
    } else if (/\b(capital of (the )?(usa|united states|america))\b/i.test(lower)) {
      spokenReply = `The capital of the United States is Washington, D.C., located on the Potomac River bordered by Maryland and Virginia.`;
    } else if (/\b(capital of (the )?(uk|united kingdom|britain|england))\b/i.test(lower)) {
      spokenReply = `The capital of the United Kingdom and England is London, situated along the River Thames.`;
    } else if (/\b(capital of canada)\b/i.test(lower)) {
      spokenReply = `The capital of Canada is Ottawa, located in Ontario along the border with Quebec.`;
    } else if (/\b(capital of australia)\b/i.test(lower)) {
      spokenReply = `The capital of Australia is Canberra, chosen as a compromise between Sydney and Melbourne in 1908.`;
    } else if (/\b(capital of germany)\b/i.test(lower)) {
      spokenReply = `The capital of Germany is Berlin, celebrated for its rich history, vibrant arts scene, and historic landmarks like the Brandenburg Gate.`;
    } else if (/\b(capital of italy)\b/i.test(lower)) {
      spokenReply = `The capital of Italy is Rome, known historically as the Eternal City and home to ancient wonders like the Colosseum and Vatican City.`;
    } else if (/\b(capital of spain)\b/i.test(lower)) {
      spokenReply = `The capital of Spain is Madrid, situated at the geographical heart of the Iberian Peninsula.`;
    } else if (/\b(capital of china)\b/i.test(lower)) {
      spokenReply = `The capital of China is Beijing, one of the world's oldest cities with a history spanning over three millennia.`;
    } else if (/\b(capital of russia)\b/i.test(lower)) {
      spokenReply = `The capital of Russia is Moscow, anchored by the iconic Red Square and the historic Kremlin.`;
    } else if (/\b(capital of brazil)\b/i.test(lower)) {
      spokenReply = `The capital of Brazil is Brasília, a master-planned modernist city inaugurated in 1960.`;
    } else if (/\b(highest mountain|tallest mountain|mount everest)\b/i.test(lower)) {
      spokenReply = `Mount Everest in the Himalayas is the highest mountain above sea level, standing at 8,848.86 meters or 29,031.7 feet on the border of Nepal and China.`;
    } else if (/\b(largest ocean)\b/i.test(lower)) {
      spokenReply = `The Pacific Ocean is the world's largest and deepest ocean, covering more than 30 percent of the Earth's surface area.`;

    // 3. Computer Science & Technology Concepts
    } else if (/\b(what is (an? )?api|rest apis?|application programming interface)\b/i.test(lower)) {
      spokenReply = `An API, or Application Programming Interface, is a set of defined rules and protocols that lets different software applications communicate and exchange data with each other seamlessly.`;
    } else if (/\b(polymorphism)\b/i.test(lower)) {
      spokenReply = `Polymorphism in OOP allows objects to take on multiple forms—via compile-time method overloading and runtime method overriding. What language are you implementing polymorphism in?`;
    } else if (/\b(encapsulation)\b/i.test(lower)) {
      spokenReply = `Encapsulation bundles data and methods together inside a class while restricting direct access using private access modifiers. How do you protect sensitive fields in your classes?`;
    } else if (/\b(abstraction)\b/i.test(lower)) {
      spokenReply = `Abstraction hides internal implementation details and reveals only essential interfaces using abstract classes and interfaces. What abstract pattern do you use most?`;
    } else if (/\b(inheritance)\b/i.test(lower)) {
      spokenReply = `Inheritance enables a derived child class to inherit fields and methods from a parent base class, promoting code reusability. Have you encountered multiple inheritance challenges like the diamond problem?`;
    } else if (/\b(oop|object oriented)\b/i.test(lower)) {
      spokenReply = `The four core pillars of OOP are Encapsulation, Abstraction, Inheritance, and Polymorphism. Which pillar plays the biggest role in your current project?`;
    } else if (/\b(deadlock)\b/i.test(lower)) {
      spokenReply = `A deadlock occurs when two or more processes are blocked forever, each holding a lock the other needs—governed by Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. How do you prevent deadlocks?`;
    } else if (/\b(process vs thread|difference between process and thread)\b/i.test(lower)) {
      spokenReply = `A process is an independent executing program with its own memory space, while a thread is a lightweight execution unit sharing the parent process's memory. How do you handle concurrency safely?`;
    } else if (/\b(virtual memory|paging|segmentation)\b/i.test(lower)) {
      spokenReply = `Virtual memory gives processes the illusion of contiguous physical RAM by mapping virtual addresses to page frames, preventing memory fragmentation and page faults.`;
    } else if (/\b(acid)\b/i.test(lower)) {
      spokenReply = `ACID stands for Atomicity, Consistency, Isolation, and Durability—guaranteeing reliable transactions in relational database management systems. How do you maintain isolation in high-throughput systems?`;
    } else if (/\b(normalization|1nf|2nf|3nf|bcnf)\b/i.test(lower)) {
      spokenReply = `Database normalization organizes schemas into standard forms like 1NF, 2NF, and 3NF to eliminate redundancy and insertion anomalies. Do you prefer normalized SQL or denormalized NoSQL?`;
    } else if (/\b(sql vs nosql|difference between sql and nosql)\b/i.test(lower)) {
      spokenReply = `SQL databases are structured, relational, and ACID-compliant with rigid schemas, while NoSQL databases scale horizontally and handle unstructured or semi-structured data models. Which do you use more?`;
    } else if (/\b(indexing|index in sql|b-tree|btree)\b/i.test(lower)) {
      spokenReply = `Database indexing creates B-tree or hash lookups to speed up query retrieval from O(N) down to O(log N) at the cost of extra write overhead. Have you tuned query performance with indexes?`;
    } else if (/\b(binary search)\b/i.test(lower)) {
      spokenReply = `Binary search locates an element in a sorted array in O(log n) time by continuously halving the search space. Have you tried binary search on the answer space?`;
    } else if (/\b(recursion|recursive)\b/i.test(lower)) {
      spokenReply = `Recursion solves complex problems by having a function call itself on smaller sub-problems until reaching a base case. What recursive algorithm are you working with today?`;
    } else if (/\b(dynamic programming|\bdp\b|memoization|tabulation)\b/i.test(lower)) {
      spokenReply = `Dynamic programming optimizes recursive problems exhibiting overlapping subproblems and optimal substructure using memoization or bottom-up tabulation. Which DP pattern is your favorite?`;
    } else if (/\b(two pointers|sliding window)\b/i.test(lower)) {
      spokenReply = `Sliding Window and Two Pointers reduce nested loop complexity from O(n²) to O(n) for contiguous subarray and pair-finding problems. Are you practicing array problems?`;
    } else if (/\b(tree|graph|bst|binary search tree|bfs|dfs|dijkstra|topological)\b/i.test(lower)) {
      spokenReply = `Graph and tree traversals use Breadth-First Search with queues or Depth-First Search with recursion to explore connected components and shortest paths. How do you represent graphs in code?`;
    } else if (/\b(time complexity|space complexity|big o)\b/i.test(lower)) {
      spokenReply = `Big-O analysis quantifies worst-case asymptotic runtime and memory growth, helping engineers choose optimal algorithms for large input scales. What complexity does your solution achieve?`;
    } else if (/\b(microservices|monolith|load balancer|caching|redis|system design)\b/i.test(lower)) {
      spokenReply = `In system design, horizontal scaling, reverse proxies, and caching layers like Redis reduce database latency and ensure high availability. What architecture are you designing?`;
    } else if (/\b(rest api|http|https|status code)\b/i.test(lower)) {
      spokenReply = `REST APIs exchange stateless JSON representations over HTTP verbs like GET, POST, PUT, and DELETE with clear status codes. Have you designed RESTful endpoints in your projects?`;
    } else if (/\b(react|useState|useEffect|virtual dom)\b/i.test(lower)) {
      spokenReply = `React builds declarative user interfaces using a virtual DOM and composable hooks to optimize component re-renders. What state management tool do you prefer with React?`;

    // 4. Everyday Communication & Greetings
    } else if (/^(hi|hello|hey|good morning|good afternoon|good evening|namaste)\b/i.test(clean) && wordCount <= 8) {
      spokenReply = `Hello! I can hear you clearly. Ask me any real-world question, practice speaking, or explore any topic you like!`;
    } else if (/how are you|who are you|what can you do/i.test(lower)) {
      spokenReply = `I am your voice conversational coach and knowledge guide. You can ask me any real-world question—from science and geography to technical concepts—and practice speaking naturally.`;
    } else if (/tell me a joke/i.test(lower)) {
      spokenReply = `Why don't scientists trust atoms? Because they make up everything!`;
    } else if (/tell me a fun fact/i.test(lower)) {
      spokenReply = `Here is a fun fact: honey never spoils. Archaeologists have found pots of edible honey in ancient Egyptian tombs that are over three thousand years old!`;
    } else if (/\b(tell me about yourself|introduce yourself|self introduction)\b/i.test(lower)) {
      spokenReply = `A strong self-introduction highlights your background, your top 2 achievements or passions, and what you are looking forward to next. Shall we practice yours together?`;
    } else if (/\b(what is|explain|how does|why is|define|tell me about)\b/i.test(lower)) {
      const topicMatch = clean
        .replace(/^(what is|explain|how does|why is|define|tell me about)\s+(a|an|the)?/i, '')
        .replace(/[?.]+$/, '')
        .trim();
      spokenReply = topicMatch.length > 2
        ? `Regarding ${topicMatch}: understanding its foundational principles and real-world significance provides great clarity. Would you like a deeper breakdown or practical examples?`
        : `That is an interesting topic. Exploring its core definition and practical real-world applications helps build thorough understanding.`;
    } else {
      spokenReply = `Your thought on "${targetPhrase}" came through with clear vocal delivery. Feel free to ask any question or expand on this topic!`;
    }

    const cleanedText = clean
      .replace(
        /\b(um|uh|err|basically|actually|sort of|kind of|you know|i mean)\b\s*/gi,
        ''
      )
      .replace(/\s{2,}/g, ' ')
      .trim();

    return {
      rating,
      fluencyScore,
      grammarScore,
      vocabularyScore: Math.min(
        97,
        Math.max(74, Math.round(85 + Math.min(12, wordCount * 0.5) - fillers.length * 2))
      ),
      clarityScore: Math.min(
        98,
        Math.max(76, Math.round(92 - fillers.length * 3))
      ),
      confidenceScore: Math.min(
        98,
        Math.max(74, Math.round(90 - fillers.length * 3 + (wordCount >= 8 ? 5 : 0)))
      ),
      spokenReply,
      sectionToImprove:
        fillers.length > 0
          ? `In your phrase "${targetPhrase}", replace filler words (${Array.from(
              new Set(fillers.map((f) => f.toLowerCase()))
            ).join(', ')}) with a brief silent pause.`
          : wordCount < 6
          ? `Your statement was very concise—feel free to expand with more details or follow-up questions.`
          : `Your sentence structure in "${targetPhrase}" is articulate—maintain this natural speaking rhythm and steady volume.`,
      fluencyCritique:
        fillers.length > 0
          ? `You used ${fillers.length} filler word(s). Aim for a steady ${wpm || 135} WPM pace with deliberate pauses.`
          : `Smooth speaking rhythm (${wpm || 135} WPM). Keep emphasizing key action verbs.`,
      grammarCritique: hasWeakConnectors
        ? `Replace casual connectors like "and then" or "so like" with structured transitions such as "Additionally" or "Consequently."`
        : `Clear sentence structure. Maintain consistent verb tenses throughout your explanation.`,
      vocabularyCritique: `Effective vocabulary choices with crisp diction.`,
      refinedVersion:
        cleanedText.charAt(0).toUpperCase() +
        cleanedText.slice(1).replace(/[.!?]+$/, '') +
        '.',
    };
  };

  const submitSpokenText = async (
    rawTextToSend?: string,
    triggeredByVoicePause = false
  ) => {
    const fullText = (
      rawTextToSend ??
      finalTranscriptRef.current + ' ' + interimTranscriptRef.current
    ).trim();

    if (!fullText || isAnalyzingRef.current) return;

    const wasListening = isListeningRef.current || triggeredByVoicePause;
    if (isListeningRef.current) {
      stopMicrophoneCapture();
    }

    // Clear input buffers immediately
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    lastSeenTranscriptRef.current = '';
    lastSpeechActivityRef.current = 0;
    hasRecordedVoiceRef.current = false;
    setLivePreviewWords('');
    setSilenceElapsedMs(0);

    // Append user's spoken message to the conversation thread right away
    const updatedUserLog = [
      ...dialogueLogRef.current,
      { speaker: 'YOU' as const, text: fullText },
    ];
    dialogueLogRef.current = updatedUserLog;
    setDialogueLog(updatedUserLog);

    // Immediately compute language metrics for session persistence
    const immediateLocalCritique = buildContextualClientCritique(fullText);
    updateCumulativeLanguageAnalytics(fullText, true);

    isAnalyzingRef.current = true;
    setIsAnalyzing(true);

    const activeAccent =
      GLOBAL_ACCENTS.find((a) => a.id === selectedAccentRef.current) ||
      GLOBAL_ACCENTS[0];

    try {
      const controller = new AbortController();
      activeAbortControllerRef.current = controller;
      const clientAbortTimer = setTimeout(() => {
        try {
          controller.abort();
        } catch {}
      }, 22000);

      const res = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentCoachPromptRef.current || DEFAULT_MODE_TITLE,
          userTranscript: fullText,
          accentName: activeAccent.name,
          modeTitle: DEFAULT_MODE_TITLE,
          dialogueHistory: updatedUserLog,
        }),
        signal: controller.signal,
      });

      clearTimeout(clientAbortTimer);

      if (userManuallyStoppedRef.current) {
        return;
      }

      const data = await res.json();
      if (userManuallyStoppedRef.current) {
        return;
      }

      const localFallback = immediateLocalCritique;

      if (!res.ok || !data || typeof data.spokenReply !== 'string' || data.spokenReply.trim().length < 2) {
        const errorReply =
          (typeof data?.error === 'string' && data.error) ||
          'I could not reach the AI Voice Coach right now. Please try asking your question again.';
        const errCritique: CritiqueResult = {
          ...localFallback,
          spokenReply: errorReply,
        };
        setCritique(errCritique);
        const errLog = [
          ...updatedUserLog,
          { speaker: 'COACH' as const, text: errorReply },
        ];
        dialogueLogRef.current = errLog;
        setDialogueLog(errLog);
        setCurrentCoachPrompt(errorReply);
        if (!userManuallyStoppedRef.current) {
          speakText(errorReply, wasListening);
        }
        return;
      }

      const finalCritique: CritiqueResult = {
        rating: typeof data.rating === 'number' ? data.rating : localFallback.rating,
        fluencyScore: typeof data.fluencyScore === 'number' ? data.fluencyScore : localFallback.fluencyScore,
        grammarScore:
          typeof data.grammarScore === 'number'
            ? data.grammarScore
            : typeof data.starMethodScore === 'number'
            ? data.starMethodScore
            : localFallback.grammarScore,
        vocabularyScore: localFallback.vocabularyScore,
        clarityScore: localFallback.clarityScore,
        confidenceScore: localFallback.confidenceScore,
        spokenReply: data.spokenReply.trim(),
        sectionToImprove:
          data.sectionToImprove || localFallback.sectionToImprove,
        fluencyCritique:
          data.fluencyCritique || localFallback.fluencyCritique,
        grammarCritique:
          data.grammarCritique || localFallback.grammarCritique,
        vocabularyCritique:
          data.vocabularyCritique || localFallback.vocabularyCritique,
        refinedVersion:
          data.refinedVersion || localFallback.refinedVersion,
      };

      setCritique(finalCritique);
      const nextLog = [
        ...updatedUserLog,
        { speaker: 'COACH' as const, text: finalCritique.spokenReply },
      ];
      dialogueLogRef.current = nextLog;
      setDialogueLog(nextLog);
      setCurrentCoachPrompt(finalCritique.spokenReply);

      if (!userManuallyStoppedRef.current) {
        speakText(finalCritique.spokenReply, wasListening);
      }

      if (onSessionComplete) onSessionComplete();
    } catch {
      if (userManuallyStoppedRef.current) {
        return;
      }
      const retryReply =
        'Unable to reach the AI Voice Coach right now. Please check your connection and try asking again.';
      const errCritique: CritiqueResult = {
        ...immediateLocalCritique,
        spokenReply: retryReply,
      };
      setCritique(errCritique);
      const nextLog = [
        ...updatedUserLog,
        { speaker: 'COACH' as const, text: retryReply },
      ];
      dialogueLogRef.current = nextLog;
      setDialogueLog(nextLog);
      setCurrentCoachPrompt(retryReply);
      speakText(retryReply, wasListening);
    } finally {
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
    }
  };

  const handleResetChat = () => {
    stopMicrophoneCapture();
    stopVoicePlaybackOnly();
    isAnalyzingRef.current = false;
    isTranscribingRef.current = false;
    setIsAnalyzing(false);
    setIsTranscribingAudio(false);
    setCurrentCoachPrompt('');
    dialogueLogRef.current = [];
    setDialogueLog([]);
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    lastSpeechActivityRef.current = 0;
    hasRecordedVoiceRef.current = false;
    setLivePreviewWords('');
    setSilenceElapsedMs(0);
    setCritique(null);
    setSpeakingTime(0);
    setWpm(0);
    setFillerWordsCount(0);
    setDetectedFillers([]);
    const emptyAnalytics: UserLanguageAnalytics = {
      totalWordsSpoken: 0,
      uniqueWordsCount: 0,
      totalSentences: 0,
      avgWordsPerSentence: 0,
      turnsCount: 0,
      lexicalDiversityPct: 0,
      pronunciationClarityPct: 0,
      confidencePacingPct: 0,
      paceLabel: 'Optimal',
      allUserWords: [],
      lastAnalyzedText: '',
    };
    setLanguageAnalytics(emptyAnalytics);
    SESSION_VOICE_STORE.dialogueLog = [];
    SESSION_VOICE_STORE.critique = null;
    SESSION_VOICE_STORE.speakingTime = 0;
    SESSION_VOICE_STORE.wpm = 0;
    SESSION_VOICE_STORE.fillerWordsCount = 0;
    SESSION_VOICE_STORE.detectedFillers = [];
    SESSION_VOICE_STORE.currentCoachPrompt = '';
    SESSION_VOICE_STORE.analytics = emptyAnalytics;
  };

  const remainingPauseSeconds = Math.max(
    0,
    (PAUSE_AUTO_SEND_MS - silenceElapsedMs) / 1000
  ).toFixed(1);
  const pauseProgressPct = Math.min(
    100,
    Math.round((silenceElapsedMs / PAUSE_AUTO_SEND_MS) * 100)
  );

  return (
    <div className="bg-gradient-to-br from-[#FCFBF8] via-white to-[#F8F6F1] border border-amber-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xl text-stone-800 space-y-6 relative overflow-hidden">
      {/* Subtle Ambient Luxury Glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-400/[0.07] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-sky-400/[0.05] rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/90 pb-4">
        {/* Left header area kept empty as requested */}
        <div />

        {/* Male / Female Voice Selector + Fast Speed Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-stone-100/90 rounded-xl border border-stone-200/90 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setVoiceGender('Male');
                voiceGenderRef.current = 'Male';
                if (currentCoachPrompt) {
                  speakText(currentCoachPrompt, false);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                voiceGender === 'Male'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Male Voice</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setVoiceGender('Female');
                voiceGenderRef.current = 'Female';
                if (currentCoachPrompt) {
                  speakText(currentCoachPrompt, false);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                voiceGender === 'Female'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Female Voice</span>
            </button>
          </div>

          {/* Voice Speed Control */}
          <div className="flex items-center gap-1 p-1 bg-stone-100/90 rounded-xl border border-stone-200/90 text-xs overflow-x-auto shadow-2xs">
            {[1.0, 1.25, 1.5, 1.75, 2.0, 2.3].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => {
                  setVoiceSpeed(spd);
                  voiceSpeedRef.current = spd;
                  if (currentCoachPrompt) {
                    speakText(currentCoachPrompt, false);
                  }
                }}
                className={`px-2.5 py-1.5 rounded-lg font-mono font-semibold transition cursor-pointer whitespace-nowrap ${
                  voiceSpeed === spd
                    ? 'bg-white text-amber-900 border border-amber-300 shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {spd === 2.0 ? '2x' : spd === 2.3 ? '2.3x' : `${spd}x`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accent Selector + Auto-Listen Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {GLOBAL_ACCENTS.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => setSelectedAccent(acc.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                selectedAccent === acc.id
                  ? 'bg-amber-50 text-amber-950 border-amber-400 font-bold shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200/90 hover:border-stone-300'
              }`}
            >
              <span className="text-sm">{acc.flag}</span>
              <span>{acc.label}</span>
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2.5 text-xs font-medium text-stone-700 cursor-pointer select-none bg-white px-3.5 py-2 rounded-xl border border-stone-200/90 hover:border-stone-300 shadow-2xs transition">
          <input
            type="checkbox"
            checked={autoResumeAfterReply}
            onChange={(e) => setAutoResumeAfterReply(e.target.checked)}
            className="rounded border-stone-300 text-amber-600 focus:ring-amber-400 bg-stone-50"
          />
          <span>Auto-listen after coach replies</span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Two-Way Voice Interaction */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
            {/* Coach Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 text-stone-900 flex items-center justify-center text-lg font-bold shadow-2xs">
                  {currentAccent.flag}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-900">
                      {currentAccent.name} ({voiceGender})
                    </h3>
                    {isSpeaking && (
                      <span className="text-[11px] font-semibold text-amber-700 animate-pulse">
                        · Speaking...
                      </span>
                    )}
                    {isAnalyzing && (
                      <span className="text-[11px] font-semibold text-sky-700 animate-pulse">
                        · Replying...
                      </span>
                    )}
                  </div>
                  {currentAccent.roleTitle ? (
                    <p className="text-xs text-stone-500">{currentAccent.roleTitle}</p>
                  ) : null}
                </div>
              </div>

              {currentCoachPrompt && (
                <button
                  type="button"
                  onClick={() => speakText(currentCoachPrompt, false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-amber-400 text-xs font-semibold text-stone-700 hover:text-amber-900 shadow-2xs transition cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-amber-600" />
                  <span>Replay</span>
                </button>
              )}
            </div>

            {/* Interactive Conversation Thread */}
            <div
              ref={chatScrollRef}
              className="bg-[#FDFCF9] border border-stone-200/80 rounded-xl p-4 min-h-[180px] max-h-72 overflow-y-auto space-y-3.5 scroll-smooth"
            >
              {dialogueLog.length === 0 &&
              !livePreviewWords &&
              !isAnalyzing &&
              !isTranscribingAudio ? (
                <div className="h-32 flex flex-col items-center justify-center text-center text-xs text-stone-500">
                  <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-2">
                    <Mic className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-stone-800">
                    Tap the Microphone Below &amp; Speak Aloud
                  </p>
                  <p className="text-stone-500 text-[11px] mt-0.5">
                    Continuous voice coaching with automatic natural pause evaluation.
                  </p>
                </div>
              ) : (
                dialogueLog.map((entry, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      entry.speaker === 'YOU' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      {entry.speaker === 'YOU'
                        ? 'You'
                        : `Voice Coach (${voiceGender})`}
                    </span>
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs sm:text-sm max-w-[90%] leading-relaxed shadow-xs ${
                        entry.speaker === 'YOU'
                          ? 'bg-gradient-to-br from-stone-900 to-stone-800 border border-stone-700/80 text-white'
                          : 'bg-white border border-stone-200/90 text-stone-800'
                      }`}
                    >
                      {entry.text}
                    </div>
                  </div>
                ))
              )}

              {livePreviewWords && (
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                    You (Speaking Live...)
                  </span>
                  <div className="rounded-2xl px-4 py-3 text-xs sm:text-sm max-w-[90%] leading-relaxed bg-amber-50/90 border border-amber-300 text-amber-950 animate-pulse shadow-xs">
                    {livePreviewWords}
                  </div>
                </div>
              )}

              {isTranscribingAudio && !livePreviewWords && (
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    You
                  </span>
                  <div className="rounded-2xl px-4 py-2.5 text-xs bg-amber-50/80 border border-amber-200 text-amber-900 italic animate-pulse">
                    Processing your voice...
                  </div>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Voice Coach ({voiceGender})
                  </span>
                  <div className="rounded-2xl px-4 py-2.5 text-xs bg-stone-100 border border-stone-200 text-stone-700 italic animate-pulse">
                    Formulating spoken response...
                  </div>
                </div>
              )}
            </div>

            {/* High-Graphic Voice Waveform (Straight Line in Silence, Waves ONLY When Voice is Heard) */}
            <div className="bg-gradient-to-b from-[#FAF8F2] to-[#F5F2E9] border border-stone-200/90 rounded-2xl p-4 flex flex-col items-center space-y-3 shadow-inner">
              <canvas
                ref={waveCanvasRef}
                width={640}
                height={96}
                className="w-full h-20 rounded-lg"
              />
              <div className="w-full flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-600 px-1">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isListening
                        ? voiceDetectedActive
                          ? 'bg-amber-600 animate-ping'
                          : 'bg-sky-600'
                        : isSpeaking
                        ? 'bg-amber-600'
                        : 'bg-stone-400'
                    }`}
                  />
                  <span>
                    Microphone:{' '}
                    <strong
                      className={
                        isListening
                          ? voiceDetectedActive
                            ? 'text-amber-700'
                            : 'text-sky-700'
                          : isSpeaking
                          ? 'text-amber-700'
                          : 'text-stone-700'
                      }
                    >
                      {isListening
                        ? voiceDetectedActive
                          ? 'Active Voice Detected · Waves In Motion'
                          : 'Listening · Waiting for Voice (2.5s Pause Auto-Send)'
                        : isTranscribingAudio
                        ? 'Sending Your Voice...'
                        : isSpeaking
                        ? `Coach Speaking (${voiceGender})...`
                        : 'Tap Mic to Start Speaking'}
                    </strong>
                  </span>
                </span>
                <span className="font-mono text-stone-700 font-medium">
                  {speakingTime}s · {wpm} WPM · {fillerWordsCount} Fillers
                </span>
              </div>

              {/* Natural 2.5s Silence Auto-Send Countdown Bar */}
              {silenceElapsedMs > 120 && (
                <div className="w-full pt-1 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        2.5s silence pause detected — auto-sending in{' '}
                        {remainingPauseSeconds}s...
                      </span>
                    </span>
                    <span className="font-mono text-[10px] text-stone-500">
                      Auto-Send
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200/80 rounded-full overflow-hidden border border-stone-300/80">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-75 ease-linear rounded-full"
                      style={{ width: `${pauseProgressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Mobile / Phone Microphone Permission Alert & Recovery Banner */}
            {micPermissionError && (
              <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-900 text-xs sm:text-sm animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-950">
                      Microphone Access Needed
                    </p>
                    <p className="text-amber-800 leading-relaxed text-xs">
                      {micPermissionError}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowMicGuideModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs cursor-pointer shadow-xs transition"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Where to Turn On</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMicPermissionError(null);
                      startMicrophoneCapture();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-800 font-semibold text-xs cursor-pointer border border-stone-300 shadow-2xs transition"
                  >
                    Retry Mic
                  </button>
                  <button
                    type="button"
                    onClick={() => setMicPermissionError(null)}
                    className="px-2 py-1 text-stone-500 hover:text-stone-800 text-xs font-bold cursor-pointer"
                    aria-label="Dismiss message"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Action Controls — Prominent Mic Button, Stop, Guide, and Reset */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isAnalyzing || isTranscribingAudio}
                  className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 active:scale-95 ${
                    isListening
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white shadow-emerald-600/25 animate-pulse'
                      : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-amber-500/25'
                  }`}
                >
                  {isListening ? (
                    <>
                      <Mic className="w-4 h-4 animate-bounce" />
                      <span>Listening (2.5s Auto-Send)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-stone-950" />
                      <span>Start Speaking (Mic)</span>
                    </>
                  )}
                </button>

                {isListening && livePreviewWords.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => submitSpokenText(livePreviewWords.trim(), true)}
                    className="flex items-center gap-1.5 px-4 py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-stone-900 hover:bg-stone-800 text-white transition shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                    <span>Send Now</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={stopAllVoiceAndMic}
                  className="flex items-center gap-1.5 px-4.5 py-3.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition shadow-2xs cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowMicGuideModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-3.5 rounded-xl text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/90 transition shadow-2xs cursor-pointer"
                  title="Where to turn on microphone on Android and iPhone"
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Phone Mic Permissions</span>
                  <span className="sm:hidden">Mic Guide</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetChat}
                className="flex items-center gap-1 px-3.5 py-3 rounded-xl text-xs font-medium bg-stone-100/90 border border-stone-200/90 hover:bg-stone-200 text-stone-600 hover:text-stone-900 cursor-pointer transition shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Complete Persistent User Language Analytics & Critique Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 space-y-4 h-full shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Award className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Language Analytics &amp; Critique
                  </h3>
                  <p className="text-[10px] text-stone-500">
                    Saved across stops &amp; tabs until app refresh
                  </p>
                </div>
              </div>
              {critique && (
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300/80">
                  Score: {critique.rating}/10
                </span>
              )}
            </div>

            {/* 6 Core Language Scorecards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="bg-[#FDFCF9] border border-stone-200/80 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] text-stone-500 uppercase font-semibold">
                  Spoken Fluency
                </div>
                <div className="text-base font-bold text-amber-700 font-mono mt-0.5">
                  {critique ? `${critique.fluencyScore}%` : '—'}
                </div>
              </div>
              <div className="bg-[#FDFCF9] border border-stone-200/80 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] text-stone-500 uppercase font-semibold">
                  Grammar &amp; Syntax
                </div>
                <div className="text-base font-bold text-emerald-700 font-mono mt-0.5">
                  {critique ? `${critique.grammarScore}%` : '—'}
                </div>
              </div>
              <div className="bg-[#FDFCF9] border border-stone-200/80 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] text-stone-500 uppercase font-semibold">
                  Vocabulary Richness
                </div>
                <div className="text-base font-bold text-sky-700 font-mono mt-0.5">
                  {languageAnalytics.totalWordsSpoken > 0
                    ? `${languageAnalytics.lexicalDiversityPct}%`
                    : critique
                    ? `${critique.vocabularyScore}%`
                    : '—'}
                </div>
              </div>
              <div className="bg-[#FDFCF9] border border-stone-200/80 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] text-stone-500 uppercase font-semibold">
                  Clarity &amp; Diction
                </div>
                <div className="text-base font-bold text-cyan-700 font-mono mt-0.5">
                  {languageAnalytics.totalWordsSpoken > 0
                    ? `${languageAnalytics.pronunciationClarityPct}%`
                    : critique
                    ? `${critique.clarityScore}%`
                    : '—'}
                </div>
              </div>
              <div className="bg-[#FDFCF9] border border-stone-200/80 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] text-stone-500 uppercase font-semibold">
                  Confidence &amp; Pace
                </div>
                <div className="text-base font-bold text-indigo-700 font-mono mt-0.5">
                  {languageAnalytics.totalWordsSpoken > 0
                    ? `${languageAnalytics.confidencePacingPct}%`
                    : critique
                    ? `${critique.confidenceScore}%`
                    : '—'}
                </div>
              </div>
              <div className="bg-[#FDFCF9] border border-stone-200/80 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] text-stone-500 uppercase font-semibold">
                  Speech Rate
                </div>
                <div className="text-base font-bold text-stone-900 font-mono mt-0.5">
                  {wpm > 0 ? `${wpm} WPM` : '—'}
                </div>
              </div>
            </div>

            {/* Session Speech Telemetry Bar */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 grid grid-cols-4 gap-2 text-center shadow-2xs">
              <div>
                <div className="text-[10px] text-stone-500 uppercase font-semibold">
                  Total Words
                </div>
                <div className="text-xs font-bold font-mono text-stone-900 mt-0.5">
                  {languageAnalytics.totalWordsSpoken}
                </div>
              </div>
              <div className="border-l border-stone-200">
                <div className="text-[10px] text-stone-500 uppercase font-semibold">
                  Unique Words
                </div>
                <div className="text-xs font-bold font-mono text-amber-800 mt-0.5">
                  {languageAnalytics.uniqueWordsCount}
                </div>
              </div>
              <div className="border-l border-stone-200">
                <div className="text-[10px] text-stone-500 uppercase font-semibold">
                  Speaking Time
                </div>
                <div className="text-xs font-bold font-mono text-stone-900 mt-0.5">
                  {speakingTime}s
                </div>
              </div>
              <div className="border-l border-stone-200">
                <div className="text-[10px] text-stone-500 uppercase font-semibold">
                  Fillers Used
                </div>
                <div className="text-xs font-bold font-mono text-rose-600 mt-0.5">
                  {fillerWordsCount}
                </div>
              </div>
            </div>

            {critique ? (
              <div className="space-y-3.5">
                {/* Exact Section Where You Need to Improve */}
                <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                  <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Where to Improve (Specific Section Analysis)</span>
                  </div>
                  <p className="text-xs text-stone-800 leading-relaxed">
                    {critique.sectionToImprove}
                  </p>
                </div>

                {/* Detailed Breakdown: Fluency, Grammar, Vocabulary */}
                <div className="bg-stone-50/80 border border-stone-200 rounded-xl p-3.5 space-y-3 shadow-2xs">
                  <div>
                    <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                      1. Fluency &amp; Pacing Critique ({languageAnalytics.paceLabel})
                    </div>
                    <p className="text-xs text-stone-700 mt-0.5 leading-relaxed">
                      {critique.fluencyCritique}
                    </p>
                  </div>

                  <div className="border-t border-stone-200 pt-2.5">
                    <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                      2. Grammar &amp; Sentence Structure (Avg {languageAnalytics.avgWordsPerSentence || 0} words/sentence)
                    </div>
                    <p className="text-xs text-stone-700 mt-0.5 leading-relaxed">
                      {critique.grammarCritique}
                    </p>
                  </div>

                  <div className="border-t border-stone-200 pt-2.5">
                    <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                      3. Vocabulary &amp; Word Choice ({languageAnalytics.uniqueWordsCount} unique words)
                    </div>
                    <p className="text-xs text-stone-700 mt-0.5 leading-relaxed">
                      {critique.vocabularyCritique}
                    </p>
                  </div>
                </div>

                {/* Better / Polished Way to Say It */}
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Polished Way to Express It</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => speakText(critique.refinedVersion, false)}
                      className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen</span>
                    </button>
                  </div>
                  <p className="text-xs text-stone-800 leading-relaxed italic">
                    &ldquo;{critique.refinedVersion}&rdquo;
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-stone-50/80 border border-stone-200 rounded-xl p-4 space-y-3 shadow-2xs">
                <div>
                  <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    1. Fluency &amp; Pacing Critique
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Evaluates speaking speed, rhythm, and pause control after you speak.
                  </p>
                </div>
                <div className="border-t border-stone-200 pt-2.5">
                  <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    2. Grammar &amp; Sentence Structure
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Analyzes sentence clarity and transitions from your spoken turn.
                  </p>
                </div>
                <div className="border-t border-stone-200 pt-2.5">
                  <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    3. Vocabulary &amp; Word Choice
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Provides a polished version of your exact spoken statement.
                  </p>
                </div>
              </div>
            )}

            {detectedFillers.length > 0 && (
              <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-3 shadow-2xs">
                <div className="text-[11px] font-semibold text-rose-950 mb-1">
                  Filler Words Detected in Session:
                </div>
                <div className="text-xs text-rose-700 font-medium">
                  {detectedFillers.map((f) => `"${f}"`).join(' · ')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Where to Turn On Microphone on Phone Modal */}
      {showMicGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-200 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Where to Turn On Microphone
                  </h3>
                  <p className="text-xs text-gray-500">
                    Step-by-step phone browser permission guide
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMicGuideModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setMicGuideTab('android')}
                className={`py-2 px-3 rounded-lg transition cursor-pointer ${
                  micGuideTab === 'android'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                🤖 Android (Chrome / Brave)
              </button>
              <button
                type="button"
                onClick={() => setMicGuideTab('ios')}
                className={`py-2 px-3 rounded-lg transition cursor-pointer ${
                  micGuideTab === 'ios'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                🍏 iPhone / iPad (Safari)
              </button>
            </div>

            {/* Tab 1: Android Instructions */}
            {micGuideTab === 'android' && (
              <div className="space-y-3 text-xs text-gray-700">
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sky-900 font-medium">
                  Follow these 3 quick steps in your phone's browser bar:
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <span className="font-bold text-gray-900 block">
                        Tap the Tune / Lock icon in the address bar
                      </span>
                      <span className="text-gray-600">
                        At the very top of your phone screen next to the web address, tap the <strong>Tune (sliders) icon 🎛️</strong> or <strong>Lock icon 🔒</strong>.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <span className="font-bold text-gray-900 block">
                        Tap &ldquo;Permissions&rdquo;
                      </span>
                      <span className="text-gray-600">
                        Select <strong>Permissions</strong> (or <em>Site settings</em>). You will see Microphone listed as <em>Blocked</em>.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <span className="font-bold text-gray-900 block">
                        Switch Microphone to &ldquo;Allow&rdquo;
                      </span>
                      <span className="text-gray-600">
                        Toggle the switch or tap <strong>Allow</strong>. Then return here and tap the button below.
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900">
                    <strong>If still blocked in Android Settings:</strong> Open phone <em>Settings ➔ Apps ➔ Chrome ➔ Permissions ➔ Microphone ➔ Allow</em>.
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: iPhone / Safari Instructions */}
            {micGuideTab === 'ios' && (
              <div className="space-y-3 text-xs text-gray-700">
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sky-900 font-medium">
                  Follow these 3 quick steps in Safari:
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <span className="font-bold text-gray-900 block">
                        Tap the &lsquo;aA&rsquo; or Page Settings icon
                      </span>
                      <span className="text-gray-600">
                        In Safari's bottom address bar, tap the <strong>aA</strong> button on the left of the URL.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <span className="font-bold text-gray-900 block">
                        Tap &ldquo;Website Settings&rdquo;
                      </span>
                      <span className="text-gray-600">
                        Select <strong>Website Settings</strong> from the popup menu.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <span className="font-bold text-gray-900 block">
                        Change Microphone from &ldquo;Deny&rdquo; to &ldquo;Allow&rdquo;
                      </span>
                      <span className="text-gray-600">
                        Set Microphone to <strong>Allow</strong> (or <em>Ask</em>).
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900">
                    <strong>If blocked in iOS Settings:</strong> Open iPhone <em>Settings ➔ Safari ➔ Microphone ➔ Allow</em>, and ensure <em>Settings ➔ Privacy &amp; Security ➔ Microphone ➔ Safari is ON</em>.
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Live Microphone Test Action */}
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={testMicPermissions}
                disabled={testingMicState === 'testing'}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer disabled:opacity-60"
              >
                <Mic className="w-4 h-4" />
                <span>
                  {testingMicState === 'testing'
                    ? 'Testing Microphone...'
                    : testingMicState === 'granted'
                    ? 'Microphone Granted! 🎉'
                    : 'Test & Activate Microphone Now'}
                </span>
              </button>

              {testingMicState === 'granted' && (
                <div className="text-center text-xs text-emerald-700 font-semibold animate-in fade-in">
                  ✅ Microphone permission is active and working! Closing guide...
                </div>
              )}

              {testingMicState === 'denied' && (
                <div className="text-center text-xs text-rose-700 font-semibold animate-in fade-in">
                  ❌ Still blocked. Please follow the steps above in your browser bar, then try again.
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-gray-500">
                  Tip: Once allowed in your browser bar, tap &quot;Test &amp; Activate&quot; above.
                </span>
                <button
                  type="button"
                  onClick={() => setShowMicGuideModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
