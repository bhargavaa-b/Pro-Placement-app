import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Award,
  AlertCircle,
  CheckCircle2,
  Send,
  RotateCcw,
  MessageCircle,
  Clock,
} from 'lucide-react';
import { VoiceAccent, AccentConfig } from '../types';

export const GLOBAL_ACCENTS: AccentConfig[] = [
  {
    id: 'Indian',
    name: 'Indian Communication Coach',
    label: 'Indian Accent (Default)',
    flag: '🇮🇳',
    interviewerName: 'Aarav Sharma',
    roleTitle: 'Interactive Communication & Fluency Coach · India',
    langCode: 'en-IN',
    pitch: 1.02,
    rate: 1.0,
  },
  {
    id: 'US',
    name: 'US Communication Coach',
    label: 'US Accent',
    flag: '🇺🇸',
    interviewerName: 'Sarah Jenkins',
    roleTitle: 'Interactive Communication Coach · US',
    langCode: 'en-US',
    pitch: 1.0,
    rate: 1.0,
  },
  {
    id: 'UK',
    name: 'UK Communication Coach',
    label: 'UK Accent',
    flag: '🇬🇧',
    interviewerName: 'James Alistair',
    roleTitle: 'Interactive Communication Coach · UK',
    langCode: 'en-GB',
    pitch: 0.96,
    rate: 0.98,
  },
  {
    id: 'Australian',
    name: 'Australian Coach',
    label: 'Australian Accent',
    flag: '🇦🇺',
    interviewerName: 'Liam O’Connor',
    roleTitle: 'Interactive Communication Coach · Australia',
    langCode: 'en-AU',
    pitch: 1.0,
    rate: 0.98,
  },
  {
    id: 'Canadian',
    name: 'Canadian Coach',
    label: 'Canadian Accent',
    flag: '🇨🇦',
    interviewerName: 'Marcus Tremblay',
    roleTitle: 'Interactive Communication Coach · Canada',
    langCode: 'en-CA',
    pitch: 0.98,
    rate: 1.0,
  },
];

export const COMMUNICATION_MODES = [
  {
    id: 'free-talk',
    title: 'Free Interactive Conversation',
    starterPrompt:
      'Hello! Let us have a natural interactive conversation. Speak about anything on your mind or ask me any question—when you pause for 3 seconds, I will automatically reply back to you!',
  },
  {
    id: 'daily-fluency',
    title: 'Everyday Fluency & Articulation',
    starterPrompt:
      'Let us practice everyday English fluency. Tell me about a skill or hobby you recently started learning, and what kept you interested in it.',
  },
  {
    id: 'opinion-pitch',
    title: 'Expressing Opinions & Ideas',
    starterPrompt:
      'Let us practice structuring clear thoughts. In your view, how is technology changing the way students learn and collaborate today?',
  },
  {
    id: 'storytelling',
    title: 'Self-Expression & Storytelling',
    starterPrompt:
      'Tell me about a memorable event or project you worked on with friends or classmates, and how you communicated as a team.',
  },
  {
    id: 'professional',
    title: 'Workplace & Professional Speaking',
    starterPrompt:
      'Imagine you are explaining a technical concept or project idea to someone from a non-technical background. How would you explain it simply?',
  },
];

interface CritiqueResult {
  rating: number;
  fluencyScore: number;
  grammarScore: number;
  spokenReply: string;
  sectionToImprove: string;
  fluencyCritique: string;
  grammarCritique: string;
  vocabularyCritique: string;
  refinedVersion: string;
}

const PAUSE_AUTO_SEND_MS = 3000;

export const VoiceCoach: React.FC<{
  onSessionComplete?: () => void;
}> = ({ onSessionComplete }) => {
  const [selectedAccent, setSelectedAccent] = useState<VoiceAccent>('Indian');
  const [selectedModeIndex, setSelectedModeIndex] = useState(0);
  const [currentCoachPrompt, setCurrentCoachPrompt] = useState<string>(
    COMMUNICATION_MODES[0].starterPrompt
  );

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [micStatusMessage, setMicStatusMessage] = useState<string | null>(null);
  const [autoResumeAfterReply, setAutoResumeAfterReply] = useState(true);

  // 4-Second Pause Auto-Send Countdown State (0 to 4000ms)
  const [silenceElapsedMs, setSilenceElapsedMs] = useState(0);

  // Live Speech Analytics
  const [speakingTime, setSpeakingTime] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [fillerWordsCount, setFillerWordsCount] = useState(0);
  const [detectedFillers, setDetectedFillers] = useState<string[]>([]);

  // Interactive Two-Way Conversation Log
  const [dialogueLog, setDialogueLog] = useState<
    { speaker: 'COACH' | 'YOU'; text: string }[]
  >([
    {
      speaker: 'COACH',
      text: COMMUNICATION_MODES[0].starterPrompt,
    },
  ]);

  // Detailed Fluency & Language Critique State
  const [critique, setCritique] = useState<CritiqueResult | null>(null);

  // Synchronous Refs to avoid stale closures during 4-second pause auto-trigger
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const isAnalyzingRef = useRef<boolean>(false);
  const finalTranscriptRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');
  const lastSpeechActivityRef = useRef<number>(0);
  const dialogueLogRef = useRef<{ speaker: 'COACH' | 'YOU'; text: string }[]>(
    dialogueLog
  );
  const currentCoachPromptRef = useRef<string>(currentCoachPrompt);
  const selectedAccentRef = useRef<VoiceAccent>(selectedAccent);
  const selectedModeIndexRef = useRef<number>(selectedModeIndex);
  const autoResumeRef = useRef<boolean>(autoResumeAfterReply);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<any>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    dialogueLogRef.current = dialogueLog;
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [dialogueLog]);

  useEffect(() => {
    currentCoachPromptRef.current = currentCoachPrompt;
  }, [currentCoachPrompt]);

  useEffect(() => {
    selectedAccentRef.current = selectedAccent;
  }, [selectedAccent]);

  useEffect(() => {
    selectedModeIndexRef.current = selectedModeIndex;
  }, [selectedModeIndex]);

  useEffect(() => {
    autoResumeRef.current = autoResumeAfterReply;
  }, [autoResumeAfterReply]);

  const currentAccent =
    GLOBAL_ACCENTS.find((a) => a.id === selectedAccent) || GLOBAL_ACCENTS[0];

  // Visual Waveform Animation Canvas
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;
    const dataArray = new Uint8Array(64);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let dynamicAmp = 3;

      if (isListening && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg =
          dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        dynamicAmp = Math.max(8, Math.min(24, (avg / 255) * 38));
      } else if (isListening || isSpeaking) {
        dynamicAmp = 16;
      }

      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);

      for (let x = 0; x < canvas.width; x++) {
        const y =
          canvas.height / 2 +
          Math.sin(x * 0.04 + phase) *
            dynamicAmp *
            Math.sin((x / canvas.width) * Math.PI);
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = isListening
        ? '#E11D48'
        : isSpeaking
        ? '#D4AF37'
        : '#D1D5DB';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      phase += isListening || isSpeaking ? 0.15 : 0.02;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isListening, isSpeaking]);

  // Cleanup mic stream & speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopMicrophoneCapture();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const analyzeSpeechTelemetry = (text: string) => {
    const fillerRegex =
      /\b(um|uh|err|like|you know|basically|actually|sort of|kind of|literally|i mean)\b/gi;
    const matches = text.match(fillerRegex) || [];
    setFillerWordsCount(matches.length);
    setDetectedFillers(Array.from(new Set(matches.map((m) => m.toLowerCase()))));

    const words = text.trim().split(/\s+/).filter(Boolean).length;
    if (speakingTime > 0) {
      const minutes = Math.max(0.12, speakingTime / 60);
      setWpm(Math.min(210, Math.round(words / minutes)));
    } else if (words > 4) {
      setWpm(128);
    }
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

  // 4-Second Pause Detector: Automatically sends user's spoken words after 4 seconds of silence
  useEffect(() => {
    if (!isListening || isAnalyzing) {
      setSilenceElapsedMs(0);
      return;
    }

    const checkInterval = setInterval(() => {
      if (!isListeningRef.current || isAnalyzingRef.current) {
        setSilenceElapsedMs(0);
        return;
      }

      const currentSpoken = (
        finalTranscriptRef.current +
        ' ' +
        interimTranscriptRef.current
      ).trim();

      if (!currentSpoken || lastSpeechActivityRef.current === 0) {
        setSilenceElapsedMs(0);
        return;
      }

      const elapsed = Date.now() - lastSpeechActivityRef.current;
      setSilenceElapsedMs(Math.min(PAUSE_AUTO_SEND_MS, elapsed));

      if (elapsed >= PAUSE_AUTO_SEND_MS) {
        // Reset activity timestamp immediately so it only triggers once per turn
        lastSpeechActivityRef.current = 0;
        setSilenceElapsedMs(0);
        submitSpokenText(currentSpoken, true);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [isListening, isAnalyzing]);

  const speakText = (text: string, resumeMicOnEnd = false) => {
    if (!('speechSynthesis' in window)) {
      if (resumeMicOnEnd && autoResumeRef.current) {
        startMicrophoneCapture();
      }
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const activeAccent =
        GLOBAL_ACCENTS.find((a) => a.id === selectedAccentRef.current) ||
        GLOBAL_ACCENTS[0];

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = activeAccent.langCode;
      utterance.pitch = activeAccent.pitch;
      utterance.rate = activeAccent.rate;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(
          (v) => v.lang.toLowerCase() === activeAccent.langCode.toLowerCase()
        ) ||
        voices.find((v) =>
          v.lang
            .toLowerCase()
            .includes(activeAccent.langCode.split('-')[0].toLowerCase())
        );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        if (resumeMicOnEnd && autoResumeRef.current) {
          startMicrophoneCapture();
        }
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        if (resumeMicOnEnd && autoResumeRef.current) {
          startMicrophoneCapture();
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  const stopMicrophoneCapture = () => {
    isListeningRef.current = false;
    setIsListening(false);
    setSilenceElapsedMs(0);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
      analyserRef.current = null;
    }
  };

  const startMicrophoneCapture = async () => {
    setMicStatusMessage(null);

    // Stop any ongoing speech synthesis so mic doesn't pick up coach voice
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;

        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 128;
          source.connect(analyser);
          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;
        }
      }
    } catch {
      setMicStatusMessage(
        'Please allow microphone access in your browser address bar, or type your message directly below to continue the conversation.'
      );
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsListening(true);
      isListeningRef.current = true;
      setMicStatusMessage(
        'Microphone connected. Your browser does not support automatic live speech-to-text—please use Chrome or Edge for live voice transcription, or type below.'
      );
      return;
    }

    try {
      const activeAccent =
        GLOBAL_ACCENTS.find((a) => a.id === selectedAccentRef.current) ||
        GLOBAL_ACCENTS[0];

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = activeAccent.langCode;

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
          const updatedFinal = (
            finalTranscriptRef.current
              ? finalTranscriptRef.current + ' '
              : ''
          ) + finalChunk.trim();
          finalTranscriptRef.current = updatedFinal;
          setTranscript(updatedFinal);
          analyzeSpeechTelemetry(updatedFinal);
        }

        interimTranscriptRef.current = interimChunk;
        setInterimTranscript(interimChunk);

        // Record timestamp of active speech so the 4-second pause timer resets while user is speaking
        if (finalChunk.trim() || interimChunk.trim()) {
          lastSpeechActivityRef.current = Date.now();
          setSilenceElapsedMs(0);
        }
      };

      recognition.onerror = (event: any) => {
        if (
          event.error === 'not-allowed' ||
          event.error === 'service-not-allowed'
        ) {
          stopMicrophoneCapture();
          setMicStatusMessage(
            'Microphone access was denied. Please click the permissions icon in your browser address bar to allow the microphone, or type below.'
          );
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current && !isAnalyzingRef.current) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
            isListeningRef.current = false;
          }
        }
      };

      recognitionRef.current = recognition;
      isListeningRef.current = true;
      setIsListening(true);
      recognition.start();
    } catch {
      stopMicrophoneCapture();
      setMicStatusMessage(
        'Could not initialize speech recognition. You can type your response directly below.'
      );
    }
  };

  const toggleRecording = () => {
    if (isListening) {
      stopMicrophoneCapture();
    } else {
      startMicrophoneCapture();
    }
  };

  // Accurate, content-aware client fallback in case network is unreachable
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
      68,
      Math.min(
        96,
        Math.round(87 - fillers.length * 4 + (wordCount >= 12 ? 6 : -2))
      )
    );
    const grammarScore = Math.max(
      70,
      Math.min(
        96,
        Math.round(89 - (hasWeakConnectors ? 6 : 0) - fillers.length * 2)
      )
    );
    const rating = Math.min(
      10,
      Math.max(6, Math.round((fluencyScore + grammarScore) / 20))
    );

    let spokenReply = '';
    if (/\b(polymorphism)\b/i.test(lower)) {
      spokenReply = `Polymorphism in OOP allows objects of different classes to respond to the same method call—via compile-time overloading or runtime overriding. Have you applied polymorphism in Java, C++, or Python recently?`;
    } else if (/\b(encapsulation|abstraction|inheritance|oop|object oriented)\b/i.test(lower)) {
      spokenReply = `The four pillars of OOP are Encapsulation, Abstraction, Inheritance, and Polymorphism—they help structure modular, maintainable software. Which of these OOP concepts do you use most?`;
    } else if (/\b(deadlock)\b/i.test(lower)) {
      spokenReply = `A deadlock happens when two or more processes wait indefinitely for resources locked by each other. Breaking Circular Wait or Hold and Wait prevents deadlocks.`;
    } else if (/\b(normalization|acid|dbms|sql|join|indexing)\b/i.test(lower)) {
      spokenReply = `In DBMS, normalization minimizes data redundancy, while ACID properties guarantee reliable transactions. Are you working with SQL or NoSQL in your projects?`;
    } else if (/\b(recursion|recursive)\b/i.test(lower)) {
      spokenReply = `Recursion solves a problem by having a function call itself on smaller inputs until reaching a base case. Which recursive problem are you practicing?`;
    } else if (/\b(binary search)\b/i.test(lower)) {
      spokenReply = `Binary search locates a target in a sorted array in O(log n) time by halving the search range at each step.`;
    } else if (/\b(dsa|algorithm|coding|array|linked list|stack|queue|tree|graph|dp|leetcode)\b/i.test(lower)) {
      spokenReply = `Mastering DSA starts with core patterns like Two Pointers, Sliding Window, Hash Maps, Trees, and Dynamic Programming while analyzing Big-O complexity. Which topic are you solving today?`;
    } else if (/\b(tell me about yourself|introduce yourself|self introduction)\b/i.test(lower)) {
      spokenReply = `Structure your self-introduction in 60 seconds: start with your current degree and technical stack, highlight two impactful projects, and conclude with your career goal. Want to try yours now?`;
    } else if (
      /^(hi|hello|hey|good morning|good afternoon|good evening)\b/i.test(clean) &&
      wordCount <= 9
    ) {
      spokenReply = `Hello! I can hear you clearly. Ask me any technical or interview question, or share what you are working on!`;
    } else {
      spokenReply = `You made a clear point with "${targetPhrase}". What specific example or technical detail would you add to take that idea further?`;
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
      spokenReply,
      sectionToImprove:
        fillers.length > 0
          ? `In your phrase "${targetPhrase}", replace filler words (${Array.from(
              new Set(fillers.map((f) => f.toLowerCase()))
            ).join(', ')}) with a brief 1-second silent pause.`
          : wordCount < 12
          ? `Your statement "${targetPhrase}" is concise—try expanding it with a supporting reason ("because..." or "for example...") for richer spoken impact.`
          : `In "${targetPhrase}", pausing briefly before your main conclusion will give your spoken delivery stronger emphasis.`,
      fluencyCritique:
        fillers.length > 0
          ? `You used ${fillers.length} filler word(s). Aim for a calm 130 WPM pace with deliberate pauses.`
          : `Smooth speaking rhythm (${wpm || 130} WPM). Keep emphasizing key action verbs.`,
      grammarCritique: hasWeakConnectors
        ? `Replace casual connectors like "and then" or "so like" with structured transitions such as "Additionally" or "Consequently."`
        : `Clear sentence structure. Maintain consistent verb tenses throughout your explanation.`,
      vocabularyCritique: `Use precise action verbs and concrete examples to make your points even more memorable.`,
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

    // Clear input buffers immediately so UI feels snappy
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    lastSpeechActivityRef.current = 0;
    setTranscript('');
    setInterimTranscript('');
    setSilenceElapsedMs(0);

    // Append user's spoken message to the conversation thread right away
    const updatedUserLog = [
      ...dialogueLogRef.current,
      { speaker: 'YOU' as const, text: fullText },
    ];
    dialogueLogRef.current = updatedUserLog;
    setDialogueLog(updatedUserLog);

    isAnalyzingRef.current = true;
    setIsAnalyzing(true);

    const activeAccent =
      GLOBAL_ACCENTS.find((a) => a.id === selectedAccentRef.current) ||
      GLOBAL_ACCENTS[0];
    const activeMode =
      COMMUNICATION_MODES[selectedModeIndexRef.current] ||
      COMMUNICATION_MODES[0];

    try {
      const res = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentCoachPromptRef.current,
          userTranscript: fullText,
          accentName: activeAccent.name,
          modeTitle: activeMode.title,
          dialogueHistory: updatedUserLog,
        }),
      });

      const data = await res.json();
      const localFallback = buildContextualClientCritique(fullText);

      const finalCritique: CritiqueResult =
        res.ok && data && typeof data.spokenReply === 'string'
          ? {
              rating: data.rating || localFallback.rating,
              fluencyScore: data.fluencyScore || localFallback.fluencyScore,
              grammarScore:
                data.grammarScore ||
                data.starMethodScore ||
                localFallback.grammarScore,
              spokenReply: data.spokenReply || localFallback.spokenReply,
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
            }
          : localFallback;

      setCritique(finalCritique);
      const nextLog = [
        ...updatedUserLog,
        { speaker: 'COACH' as const, text: finalCritique.spokenReply },
      ];
      dialogueLogRef.current = nextLog;
      setDialogueLog(nextLog);
      setCurrentCoachPrompt(finalCritique.spokenReply);

      // Speak the coach's reply aloud and automatically resume mic when done if hands-free
      speakText(finalCritique.spokenReply, wasListening);

      if (onSessionComplete) onSessionComplete();
    } catch {
      const fallback = buildContextualClientCritique(fullText);
      setCritique(fallback);
      const nextLog = [
        ...updatedUserLog,
        { speaker: 'COACH' as const, text: fallback.spokenReply },
      ];
      dialogueLogRef.current = nextLog;
      setDialogueLog(nextLog);
      setCurrentCoachPrompt(fallback.spokenReply);
      speakText(fallback.spokenReply, wasListening);
      if (onSessionComplete) onSessionComplete();
    } finally {
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
    }
  };

  const handleSelectMode = (idx: number) => {
    stopMicrophoneCapture();
    setSelectedModeIndex(idx);
    const starter = COMMUNICATION_MODES[idx].starterPrompt;
    setCurrentCoachPrompt(starter);
    const initialLog = [{ speaker: 'COACH' as const, text: starter }];
    dialogueLogRef.current = initialLog;
    setDialogueLog(initialLog);
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    lastSpeechActivityRef.current = 0;
    setTranscript('');
    setInterimTranscript('');
    setSilenceElapsedMs(0);
    setCritique(null);
    setSpeakingTime(0);
    setWpm(0);
    setFillerWordsCount(0);
    setDetectedFillers([]);
    speakText(starter, false);
  };

  const combinedSpokenText = (
    transcript + (interimTranscript ? ' ' + interimTranscript : '')
  ).trim();
  const remainingPauseSeconds = Math.max(
    0,
    (PAUSE_AUTO_SEND_MS - silenceElapsedMs) / 1000
  ).toFixed(1);
  const pauseProgressPct = Math.min(
    100,
    Math.round((silenceElapsedMs / PAUSE_AUTO_SEND_MS) * 100)
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-gray-900 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B8860B]">
            <Mic className="w-4 h-4 text-[#D4AF37]" />
            <span>Hands-Free 3s Pause Auto-Send · Two-Way Voice Coach</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
            Interactive Voice Coach
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Speak naturally—when you pause for 3 seconds, your message is automatically sent without clicking, and the coach responds directly to what you said.
          </p>
        </div>

        {/* Accent Selector (Indian Default First) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {GLOBAL_ACCENTS.map((acc) => (
            <button
              key={acc.id}
              onClick={() => setSelectedAccent(acc.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                selectedAccent === acc.id
                  ? 'bg-[#18181B] text-white border-[#18181B]'
                  : 'bg-[#FAFAFA] text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              <span>{acc.flag}</span>
              <span>{acc.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Communication Topic Modes */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 mr-1">
            Conversation Mode:
          </span>
          {COMMUNICATION_MODES.map((mode, idx) => (
            <button
              key={mode.id}
              onClick={() => handleSelectMode(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                selectedModeIndex === idx
                  ? 'bg-amber-50/90 border-[#D4AF37] text-gray-900 font-semibold'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {mode.title}
            </button>
          ))}
        </div>

        {/* Hands-Free Continuous Toggle */}
        <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none bg-[#FAFAFA] px-3 py-1.5 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            checked={autoResumeAfterReply}
            onChange={(e) => setAutoResumeAfterReply(e.target.checked)}
            className="rounded border-gray-300 text-[#0B2545] focus:ring-[#D4AF37]"
          />
          <span>Auto-listen after coach replies</span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Two-Way Voice Interaction */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#FAFAFA] border border-gray-200 rounded-2xl p-5 space-y-4">
            {/* Coach Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#18181B] text-white flex items-center justify-center text-lg font-bold shadow-xs">
                  {currentAccent.flag}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">
                      {currentAccent.interviewerName}
                    </h3>
                    {isSpeaking && (
                      <span className="text-[11px] font-semibold text-amber-700 animate-pulse">
                        · Speaking to you...
                      </span>
                    )}
                    {isAnalyzing && (
                      <span className="text-[11px] font-semibold text-[#0B2545] animate-pulse">
                        · Thinking & reacting...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{currentAccent.roleTitle}</p>
                </div>
              </div>

              <button
                onClick={() => speakText(currentCoachPrompt, false)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-xs font-semibold text-gray-800 shadow-2xs transition"
              >
                <Volume2 className="w-4 h-4 text-[#B8860B]" />
                <span>Hear Coach Voice</span>
              </button>
            </div>

            {/* Interactive Conversation Thread */}
            <div
              ref={chatScrollRef}
              className="bg-white border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto space-y-3 scroll-smooth"
            >
              {dialogueLog.map((entry, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${
                    entry.speaker === 'YOU' ? 'items-end' : 'items-start'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {entry.speaker === 'YOU'
                      ? 'You Spoke'
                      : currentAccent.interviewerName}
                  </span>
                  <div
                    className={`rounded-xl px-3.5 py-2.5 text-xs sm:text-sm max-w-[90%] leading-relaxed ${
                      entry.speaker === 'YOU'
                        ? 'bg-[#0B2545] text-white'
                        : 'bg-[#F8FAFC] border border-gray-200 text-gray-900'
                    }`}
                  >
                    {entry.text}
                  </div>
                </div>
              ))}
              {isAnalyzing && (
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {currentAccent.interviewerName}
                  </span>
                  <div className="rounded-xl px-3.5 py-2.5 text-xs bg-[#F8FAFC] border border-gray-200 text-gray-600 italic animate-pulse">
                    Listening to what you said and formulating response...
                  </div>
                </div>
              )}
            </div>

            {/* Live Microphone Waveform & 4-Second Pause Auto-Send Indicator */}
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center space-y-2">
              <canvas
                ref={waveCanvasRef}
                width={460}
                height={54}
                className="w-full h-12"
              />
              <div className="w-full flex items-center justify-between text-[11px] text-gray-500 px-1">
                <span>
                  Microphone:{' '}
                  <strong
                    className={
                      isListening
                        ? 'text-rose-600'
                        : isSpeaking
                        ? 'text-amber-600'
                        : 'text-gray-700'
                    }
                  >
                    {isListening
                      ? 'Live & Listening (Auto-sends after 3s pause)'
                      : isSpeaking
                      ? 'Coach is responding aloud...'
                      : 'Click "Start Speaking" for hands-free talk'}
                  </strong>
                </span>
                <span className="font-mono">
                  {speakingTime}s · {wpm} WPM · {fillerWordsCount} Fillers
                </span>
              </div>

              {/* 4-Second Pause Countdown Bar when user has spoken and is pausing */}
              {isListening && combinedSpokenText.length > 0 && silenceElapsedMs > 300 && (
                <div className="w-full pt-1 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#0B2545]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>
                        Pause detected — auto-sending your speech in{' '}
                        {remainingPauseSeconds}s...
                      </span>
                    </span>
                    <span className="font-mono text-[10px] text-gray-500">
                      No click needed
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0B2545] to-[#D4AF37] transition-all duration-100 ease-linear rounded-full"
                      style={{ width: `${pauseProgressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {micStatusMessage && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{micStatusMessage}</span>
              </div>
            )}

            {/* Live Spoken Input Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700 block">
                  Your Spoken Words (Auto-sends 3 seconds after you pause):
                </label>
                {combinedSpokenText.length > 0 && (
                  <span className="text-[11px] text-emerald-700 font-medium">
                    3s pause auto-send armed
                  </span>
                )}
              </div>

              <textarea
                rows={3}
                value={
                  transcript + (interimTranscript ? ' ' + interimTranscript : '')
                }
                onChange={(e) => {
                  const val = e.target.value;
                  finalTranscriptRef.current = val;
                  interimTranscriptRef.current = '';
                  setTranscript(val);
                  setInterimTranscript('');
                  analyzeSpeechTelemetry(val);
                  if (val.trim()) {
                    lastSpeechActivityRef.current = Date.now();
                    setSilenceElapsedMs(0);
                  } else {
                    lastSpeechActivityRef.current = 0;
                    setSilenceElapsedMs(0);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitSpokenText(combinedSpokenText, false);
                  }
                }}
                placeholder="Click 'Start Speaking (Mic)' and talk naturally—when you pause for 3 seconds, it automatically sends and the coach responds back!"
                className="w-full rounded-xl border border-gray-300 bg-white p-3.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            {/* Action Controls */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shadow-xs ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Pause Mic</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-rose-600" />
                    <span>Start Speaking (Mic)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => submitSpokenText(combinedSpokenText, false)}
                disabled={isAnalyzing || !combinedSpokenText}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#18181B] hover:bg-black text-white transition shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>
                  {isAnalyzing
                    ? 'Coach is Replying...'
                    : 'Send Now (or Pause 3s)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMode(selectedModeIndex)}
                className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Chat</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Fluency & Language Critique Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#FAFAFA] border border-gray-200 rounded-2xl p-5 space-y-4 h-full">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-sm font-bold text-gray-900">
                  Fluency & Language Critique
                </h3>
              </div>
              {critique && (
                <span className="font-mono text-xs font-bold text-[#0B2545]">
                  Score: {critique.rating}/10
                </span>
              )}
            </div>

            {critique ? (
              <div className="space-y-4">
                {/* Fluency & Grammar Scores */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-gray-200 rounded-xl p-3">
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">
                      Spoken Fluency
                    </div>
                    <div className="text-lg font-bold text-gray-900 font-mono mt-0.5">
                      {critique.fluencyScore}%
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-3">
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">
                      Grammar & Clarity
                    </div>
                    <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">
                      {critique.grammarScore}%
                    </div>
                  </div>
                </div>

                {/* Exact Section Where You Need to Improve */}
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Where to Improve (Specific Section Analysis)</span>
                  </div>
                  <p className="text-xs text-gray-800 leading-relaxed">
                    {critique.sectionToImprove}
                  </p>
                </div>

                {/* Detailed Breakdown: Fluency, Grammar, Vocabulary */}
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-3">
                  <div>
                    <div className="text-[11px] font-bold text-[#0F3057] uppercase tracking-wider">
                      1. Fluency & Pacing Critique
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                      {critique.fluencyCritique}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-2.5">
                    <div className="text-[11px] font-bold text-[#0F3057] uppercase tracking-wider">
                      2. Grammar & Sentence Structure
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                      {critique.grammarCritique}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-2.5">
                    <div className="text-[11px] font-bold text-[#0F3057] uppercase tracking-wider">
                      3. Vocabulary & Word Choice
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                      {critique.vocabularyCritique}
                    </p>
                  </div>
                </div>

                {/* Better / Polished Way to Say It */}
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Polished Way to Express It</span>
                    </span>
                    <button
                      onClick={() => speakText(critique.refinedVersion, false)}
                      className="text-[11px] text-emerald-900 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-800 leading-relaxed italic">
                    "{critique.refinedVersion}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#B8860B] mx-auto">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1 max-w-xs mx-auto">
                  <h4 className="text-sm font-bold text-gray-900">
                    Speak & Pause 3 Seconds for Instant Reply
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Click <strong>"Start Speaking (Mic)"</strong> and talk naturally. When you pause for 3 seconds, your speech is sent automatically—the coach will respond back aloud and display your fluency critique here.
                  </p>
                </div>
              </div>
            )}

            {detectedFillers.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-3">
                <div className="text-[11px] font-semibold text-gray-700 mb-1">
                  Filler Words Detected in Current Speech:
                </div>
                <div className="text-xs text-rose-700 font-medium">
                  {detectedFillers.map((f) => `"${f}"`).join(' · ')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
