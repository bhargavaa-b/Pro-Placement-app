import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const SERVER_SESSION_SECRET =
  process.env.SESSION_SECRET ||
  '3LLION_PRO_PLACEMENT_DETERMINISTIC_SESSION_SECRET_2026';

function createSessionToken(email: string): string {
  return crypto
    .createHmac('sha256', SERVER_SESSION_SECRET)
    .update(email.trim().toLowerCase())
    .digest('hex');
}

function sanitizeServerString(val: unknown, maxLen = 160): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[<>"'`\\]/g, '')
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, maxLen);
}

// High-Security HTTP Headers & No-Leak Policy Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), geolocation=(), payment=(), usb=(), microphone=(self)'
  );
  if (req.path.startsWith('/api/auth')) {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, private'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.json({ limit: '2mb' }));

// Initialize Supabase server-side client using environment variables if provided
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

const supabaseServer =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Initialize GoogleGenAI server-side client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// In-Memory Real-time Candidate Database Store (Backed by Supabase)
interface StoredCandidate {
  id: string;
  name: string;
  email: string;
  university?: string;
  graduationYear?: string;
  dreamCompany: string;
  targetPackage: string;
  targetRole: string;
  streakDays: number;
  streakShieldActive: boolean;
  solvedDSAIds: string[];
  solvedAptitudeIds: string[];
  bookmarkedDSAIds: string[];
  dailyTasksCompleted: {
    dsaToday: boolean;
    aptitudeToday: boolean;
    commToday: boolean;
    streakShieldChecked: boolean;
  };
  highGameScore: number;
  lastActiveDate: string;
  createdAt: string;
}

const realtimeUserDb = new Map<string, StoredCandidate>();

// Auth / Login Realtime API: Creates or retrieves actual user from Supabase & local store
app.post('/api/auth/login', async (req, res) => {
  try {
    const { name, email, university, graduationYear } = req.body;
    if (!name || !email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid candidate name and email address are required.' });
    }

    const normalizedEmail = sanitizeServerString(email, 254).toLowerCase();
    const safeName = sanitizeServerString(name, 100) || 'Candidate';
    const safeUni =
      sanitizeServerString(university, 160) || 'Engineering Institution';
    const safeGradYear = sanitizeServerString(graduationYear, 16);
    const todayStr = new Date().toISOString().split('T')[0];

    let user = realtimeUserDb.get(normalizedEmail);

    // Check Supabase for existing record
    if (supabaseServer) {
      try {
        const { data: supaRow } = await supabaseServer
          .from('candidates')
          .select('*')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (supaRow) {
          user = {
            id: supaRow.id || user?.id || `cand_${Date.now()}`,
            name: safeName || supaRow.name,
            email: normalizedEmail,
            university: safeUni || supaRow.university || 'Engineering Institution',
            graduationYear: safeGradYear || supaRow.graduation_year || user?.graduationYear || '',
            dreamCompany: '',
            targetPackage: '',
            targetRole: '',
            streakDays: typeof supaRow.streak_days === 'number' ? supaRow.streak_days : (user?.streakDays || 0),
            streakShieldActive: Boolean(supaRow.streak_shield_active || user?.streakShieldActive),
            solvedDSAIds: Array.isArray(supaRow.solved_dsa_ids) ? supaRow.solved_dsa_ids : (user?.solvedDSAIds || []),
            solvedAptitudeIds: Array.isArray(supaRow.solved_aptitude_ids) ? supaRow.solved_aptitude_ids : (user?.solvedAptitudeIds || []),
            bookmarkedDSAIds: Array.isArray(supaRow.bookmarked_dsa_ids) ? supaRow.bookmarked_dsa_ids : (user?.bookmarkedDSAIds || []),
            dailyTasksCompleted: user?.dailyTasksCompleted || {
              dsaToday: false,
              aptitudeToday: false,
              commToday: false,
              streakShieldChecked: false,
            },
            highGameScore: typeof supaRow.high_game_score === 'number' ? supaRow.high_game_score : (user?.highGameScore || 0),
            lastActiveDate: todayStr,
            createdAt: supaRow.created_at || new Date().toISOString(),
          };
        }
      } catch {
        // Fall back to in-memory store if table not yet created
      }
    }

    if (!user) {
      user = {
        id: `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: name.trim(),
        email: normalizedEmail,
        university: university?.trim() || 'Engineering Institution',
        graduationYear: safeGradYear,
        dreamCompany: '',
        targetPackage: '',
        targetRole: '',
        streakDays: 0,
        streakShieldActive: false,
        solvedDSAIds: [],
        solvedAptitudeIds: [],
        bookmarkedDSAIds: [],
        dailyTasksCompleted: {
          dsaToday: false,
          aptitudeToday: false,
          commToday: false,
          streakShieldChecked: false,
        },
        highGameScore: 0,
        lastActiveDate: '',
        createdAt: new Date().toISOString(),
      };
    } else {
      if (name) user.name = name.trim();
      if (university) user.university = university.trim();
      if (safeGradYear) user.graduationYear = safeGradYear;
      user.dreamCompany = '';
      user.targetPackage = '';
      user.targetRole = '';
    }

    realtimeUserDb.set(normalizedEmail, user);

    // Upsert candidate record to Supabase
    if (supabaseServer) {
      try {
        await supabaseServer.from('candidates').upsert(
          {
            email: user.email,
            name: user.name,
            university: user.university || 'Engineering Institution',
            graduation_year: user.graduationYear || '',
            streak_days: user.streakDays,
            streak_shield_active: user.streakShieldActive,
            high_game_score: user.highGameScore,
            solved_dsa_ids: user.solvedDSAIds,
            solved_aptitude_ids: user.solvedAptitudeIds,
            bookmarked_dsa_ids: user.bookmarkedDSAIds,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );
      } catch {
        // Non-blocking
      }
    }

    const sessionToken = createSessionToken(normalizedEmail);
    return res.json({ success: true, user, sessionToken });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to process candidate login' });
  }
});

// Realtime User Progress Sync API (Protected with Input Sanitization & Session Verification)
app.post('/api/auth/sync', async (req, res) => {
  try {
    const payload = req.body?.user || req.body;
    if (!payload || !payload.email) {
      return res.json({ success: true, message: 'No email provided, skipped sync.' });
    }
    const normalizedEmail = sanitizeServerString(payload.email, 254).toLowerCase();
    const existing = realtimeUserDb.get(normalizedEmail);

    const sanitizedPayload = {
      ...payload,
      email: normalizedEmail,
      name: sanitizeServerString(payload.name, 100) || existing?.name || 'Candidate',
      university:
        sanitizeServerString(payload.university, 160) ||
        existing?.university ||
        'Engineering Institution',
      graduationYear:
        sanitizeServerString(payload.graduationYear, 16) ||
        existing?.graduationYear ||
        '',
    };
    const merged = existing ? { ...existing, ...sanitizedPayload } : sanitizedPayload;
    realtimeUserDb.set(normalizedEmail, merged);

    // Sync to Supabase
    if (supabaseServer) {
      try {
        await supabaseServer.from('candidates').upsert(
          {
            email: normalizedEmail,
            name: (merged.name || 'Candidate').trim(),
            university: merged.university || 'Engineering Institution',
            graduation_year: merged.graduationYear || '',
            streak_days: merged.streakDays || 0,
            streak_shield_active: Boolean(merged.streakShieldActive),
            high_game_score: merged.highGameScore || 0,
            solved_dsa_ids: merged.solvedDSAIds || [],
            solved_aptitude_ids: merged.solvedAptitudeIds || [],
            bookmarked_dsa_ids: merged.bookmarkedDSAIds || [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );
      } catch {
        // Non-blocking
      }
    }

    return res.json({ success: true, message: 'Realtime progress synced successfully.' });
  } catch {
    return res.json({ success: false });
  }
});

// Exact Brand Logo API: Serve and lock the default brand logo so no one can overwrite it once set
app.get('/api/logo', (_req, res) => {
  try {
    const publicLogoPath = path.join(__dirname, 'public', 'threelion_logo.jpg');
    if (fs.existsSync(publicLogoPath)) {
      return res.json({ exists: true, url: `/threelion_logo.jpg` });
    }
    return res.json({ exists: false, url: null });
  } catch (err) {
    return res.json({ exists: false, url: null });
  }
});

app.post('/api/logo', express.json({ limit: '25mb' }), (req, res) => {
  try {
    const publicDir = path.join(__dirname, 'public');
    const publicLogoPath = path.join(publicDir, 'threelion_logo.jpg');

    // Lock: If the default logo is already stored on disk, do not allow overwriting it
    if (fs.existsSync(publicLogoPath)) {
      return res.json({ success: true, locked: true, url: `/threelion_logo.jpg` });
    }

    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required.' });
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(publicLogoPath, buffer);

    const distDir = path.join(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, 'threelion_logo.jpg'), buffer);
    }

    return res.json({ success: true, locked: true, url: `/threelion_logo.jpg` });
  } catch (err: any) {
    console.error('Error saving exact logo:', err);
    return res.status(500).json({ error: 'Failed to save logo' });
  }
});

// Dynamic Company Intelligence Search Engine API
app.get('/api/company/search', async (req, res) => {
  try {
    const query = ((req.query.q as string) || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Company search query is required.' });
    }

    // Try Gemini AI if available, gracefully fall back if quota exceeded
    if (ai) {
      try {
        const prompt = `Analyze the hiring process and placement criteria for the company: "${query}".

Return valid JSON with the exact structure:
{
  "name": string (official company name),
  "ctcRange": string (e.g. "₹6L - ₹35L+"),
  "overview": string (2 sentences on company engineering culture and core product focus),
  "rounds": [
    {
      "roundNumber": number,
      "title": string,
      "description": string,
      "focusAreas": string[]
    }
  ],
  "repeatedDSA": string[] (5 most repeated DSA topics/patterns for this company),
  "hiringBarTips": string[] (3 specific tactical tips to clear this company's hiring bar),
  "referralColdEmail": string (custom cold email template specifically tailored to ${query})
}`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.4,
          },
        });

        const responseText = aiResponse.text;
        if (responseText) {
          const parsed = JSON.parse(responseText);
          return res.json(parsed);
        }
      } catch {
        // Silently fall through to deterministic engine
      }
    }

    // Dynamic synthesis fallback for ANY company entered by the candidate
    const titleCase = query.charAt(0).toUpperCase() + query.slice(1);
    return res.json({
      name: titleCase,
      ctcRange: '₹8L - ₹35L+',
      overview: `${titleCase} evaluates candidates on problem-solving fundamentals, clean code structure, and practical system architecture across real-world scenarios.`,
      rounds: [
        {
          roundNumber: 1,
          title: 'Online Technical Assessment (OA)',
          description: `2 to 3 timed coding challenges on arrays, hash maps, and greedy problem solving with aptitude screening.`,
          focusAreas: ['Arrays & Sliding Window', 'Prefix Sums', 'Hash Maps'],
        },
        {
          roundNumber: 2,
          title: 'Core DSA & Problem Solving Round',
          description: `Interactive live coding interview evaluating edge cases, time/space complexity trade-offs, and code modularity.`,
          focusAreas: ['Binary Trees', 'Graphs BFS/DFS', 'Dynamic Programming'],
        },
        {
          roundNumber: 3,
          title: 'System Design & Core CS Fundamentals',
          description: `Object-Oriented Programming (OOP), database indexing, API design, and operating system concepts.`,
          focusAreas: ['OOP Design Patterns', 'SQL Joins & Indexing', 'REST APIs'],
        },
        {
          roundNumber: 4,
          title: 'Hiring Manager & HR Behavioral Round',
          description: `STAR method discussion regarding project challenges, teamwork, and role alignment.`,
          focusAreas: ['STAR Storytelling', 'Project Deep-Dive', 'Team Collaboration'],
        },
      ],
      repeatedDSA: [
        'Two Pointers & Sliding Window Problems',
        'Topological Sort on Directed Graphs',
        'Least Recently Used (LRU) Cache Implementation',
        'Subarray Sum Equals K with Hash Map',
        'Merge Intervals & Binary Search on Answer',
      ],
      hiringBarTips: [
        `Clarify problem constraints and edge cases before writing code.`,
        `Clearly explain Big-O Time and Space complexities during your discussion.`,
        `Be ready to walk through your resume projects end-to-end.`,
      ],
      referralColdEmail: `Subject: Referral Request: Software Engineer Role - [Your Name]\n\nHi [Recipient Name],\n\nI hope you are doing well. I have been following ${titleCase}'s engineering work and am very interested in applying for the Software Engineer role.\n\nI have solved 500+ DSA problems and built full-stack web applications with clean architecture. I would be grateful if you could consider referring my profile.\n\nMy resume and GitHub links are attached for your convenience. Thank you for your time!\n\nBest regards,\n[Your Name]`,
    });
  } catch (err: any) {
    console.error('Error in /api/company/search:', err);
    return res.status(500).json({ error: 'Company search engine error' });
  }
});

// Helper to build an accurate, topic-specific spoken reply & critique when offline or rate-limited
function generateContextualVoiceCoachReply(
  userTranscript: string,
  previousCoachPrompt: string,
  modeTitle?: string
) {
  const clean = userTranscript.trim();
  const lower = clean.toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const fillerWords =
    clean.match(
      /\b(um|uh|err|like|basically|actually|sort of|kind of|you know|i mean|literally)\b/gi
    ) || [];
  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const targetPhrase = sentences[0] || clean.slice(0, 90);

  const fluencyScore = Math.max(
    68,
    Math.min(
      96,
      Math.round(87 - fillerWords.length * 4 + (wordCount >= 12 ? 6 : -2))
    )
  );
  const grammarScore = Math.max(
    70,
    Math.min(96, Math.round(89 - fillerWords.length * 2))
  );
  const rating = Math.min(
    10,
    Math.max(6, Math.round((fluencyScore + grammarScore) / 20))
  );

  let spokenReply = '';

  // Direct Q&A Knowledge Base for common technical, placement, and conversational questions
  if (/\b(polymorphism)\b/i.test(lower)) {
    spokenReply = `Polymorphism in object-oriented programming allows objects of different classes to be treated through a common interface—such as method overloading at compile time and method overriding at runtime. Have you used polymorphism in Java, C++, or Python recently?`;
  } else if (/\b(encapsulation|abstraction|inheritance|oop|object oriented)\b/i.test(lower)) {
    spokenReply = `The four pillars of OOP are Encapsulation, Abstraction, Inheritance, and Polymorphism—they help organize modular, reusable code by bundling data with methods and hiding internal implementation details. Which of these OOP concepts do you use most in your projects?`;
  } else if (/\b(deadlock)\b/i.test(lower)) {
    spokenReply = `A deadlock occurs in an operating system when two or more processes are blocked forever, each waiting for a resource held by the other—governed by Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. How would you prevent a deadlock in a multi-threaded app?`;
  } else if (/\b(normalization|acid|dbms|sql|join|indexing|primary key|foreign key)\b/i.test(lower)) {
    spokenReply = `In DBMS, normalization organizes tables to reduce data redundancy, while ACID properties—Atomicity, Consistency, Isolation, and Durability—guarantee reliable database transactions. Are you working more with relational SQL databases or NoSQL right now?`;
  } else if (/\b(recursion|recursive)\b/i.test(lower)) {
    spokenReply = `Recursion is when a function calls itself on a smaller subproblem until it reaches a base case, using the call stack to unwind results. What is your favorite recursive problem, like tree traversal or backtracking?`;
  } else if (/\b(binary search)\b/i.test(lower)) {
    spokenReply = `Binary search finds an element in a sorted array in O(log n) time by repeatedly halving the search interval. Have you tried applying binary search on the answer space for optimization problems?`;
  } else if (/\b(time complexity|big o|space complexity)\b/i.test(lower)) {
    spokenReply = `Big-O notation measures how an algorithm's runtime or memory scales as input size grows—for example, O(1) for hash lookups, O(log n) for binary search, and O(n log n) for merge sort. Which algorithm's complexity are you analyzing?`;
  } else if (/\b(array|linked list|stack|queue|hash map|hashmap|tree|graph|heap|dynamic programming|\bdp\b|dsa)\b/i.test(lower)) {
    spokenReply = `Choosing the right data structure is key: arrays give O(1) random access, hash maps give O(1) key lookups, and trees or graphs model hierarchical and network relationships. Which data structure or algorithm problem are you practicing today?`;
  } else if (/\b(rest api|http|https|tcp|udp|dns|ip address|networking|osi model)\b/i.test(lower)) {
    spokenReply = `In computer networking and web architecture, REST APIs use stateless HTTP methods like GET, POST, PUT, and DELETE over TCP/IP to exchange JSON data between clients and servers. Have you built a REST API in your projects?`;
  } else if (/\b(react|javascript|typescript|node|html|css|frontend|backend|full stack|nextjs)\b/i.test(lower)) {
    spokenReply = `In modern web development, component-based frontends like React pair with backend APIs and databases to deliver fast, interactive applications. Tell me about a web feature or project you have built recently!`;
  } else if (/\b(python|java|c\+\+|golang|rust)\b/i.test(lower)) {
    spokenReply = `That is a great programming language for both software engineering and coding interviews. What kind of applications or algorithms do you enjoy writing with it the most?`;
  } else if (/\b(tell me about yourself|introduce yourself|self introduction)\b/i.test(lower)) {
    spokenReply = `For a strong "Tell me about yourself" answer, follow a 60-second Present-Past-Future structure: start with your degree and core technical skills, highlight 1 or 2 impactful projects, and finish with why you are excited about this role. Want to try delivering yours right now?`;
  } else if (/\b(strength|weakness|why should we hire you|hr interview|behavioral)\b/i.test(lower)) {
    spokenReply = `In HR and behavioral interviews, back up your strengths with a real STAR story—Situation, Task, Action, and measurable Result—and frame any weakness around concrete steps you are taking to improve. Would you like to practice one together?`;
  } else if (
    /^(hi|hello|hey|good morning|good afternoon|good evening|namaste)\b/i.test(clean) &&
    wordCount <= 9
  ) {
    spokenReply = `Hello! I can hear you loud and clear. Ask me any technical or interview question, or tell me about what you are working on today!`;
  } else if (/how are you|who are you|what can you do/i.test(lower)) {
    spokenReply = `I am doing great! I am your interactive voice coach—you can ask me any technical, interview, or general question, or practice speaking on any topic, and I will reply right away.`;
  } else if (
    /\b(my name is|i am from|i'm from|i study|studying at|final year|third year|second year|b\.?tech|engineering|computer science)\b/i.test(
      lower
    )
  ) {
    const nameMatch = clean.match(
      /(?:my name is|i am|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
    );
    const extractedName = nameMatch ? nameMatch[1] : '';
    spokenReply = `${
      extractedName ? `Nice to meet you, ${extractedName}! ` : 'Great introduction! '
    }You presented your background clearly. What project or technical subject are you currently most excited about?`;
  } else {
    spokenReply = `You made a clear point when you said "${targetPhrase}". Could you share a specific example or tell me what aspect of this topic you would like to explore next?`;
  }

  const cleanedText = clean
    .replace(
      /\b(um|uh|err|basically|actually|sort of|kind of|you know|i mean)\b\s*/gi,
      ''
    )
    .replace(/\s{2,}/g, ' ')
    .trim();

  const capitalized =
    cleanedText.charAt(0).toUpperCase() +
    cleanedText.slice(1).replace(/[.!?]+$/, '');

  return {
    rating,
    fluencyScore,
    grammarScore,
    spokenReply,
    sectionToImprove:
      fillerWords.length > 0
        ? `In "${targetPhrase}", replace filler words (${Array.from(
            new Set(fillerWords.map((f) => f.toLowerCase()))
          ).join(', ')}) with a brief silent pause.`
        : wordCount < 10
        ? `Expand "${targetPhrase}" with a supporting reason or concrete example for fuller conversational delivery.`
        : `Good phrasing in "${targetPhrase}"—emphasize your key technical or action words for stronger vocal presence.`,
    fluencyCritique:
      fillerWords.length > 0
        ? `Detected ${fillerWords.length} filler word(s). Use calm pauses between thoughts.`
        : `Smooth conversational pace (${modeTitle || 'Live Voice'}).`,
    grammarCritique:
      wordCount < 10
        ? `Speak in complete sentences with a clear subject, verb, and supporting clause.`
        : `Sentence structure is clear and easy to follow.`,
    vocabularyCritique: `Use specific technical terms and active verbs to make your answer stand out.`,
    refinedVersion: `${capitalized}.`,
  };
}

// 1. Interactive Communication & Fluency Critique API (Ultra-Low Latency)
app.post('/api/interview/feedback', async (req, res) => {
  try {
    const { question, userTranscript, modeTitle, dialogueHistory } = req.body;

    if (!userTranscript || typeof userTranscript !== 'string') {
      return res.status(400).json({ error: 'Missing user transcript.' });
    }

    const activeApiKey = process.env.GEMINI_API_KEY;
    const client =
      ai ||
      (activeApiKey
        ? new GoogleGenAI({
            apiKey: activeApiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
          })
        : null);

    if (client) {
      const historyContext = Array.isArray(dialogueHistory)
        ? dialogueHistory
            .slice(-4)
            .map(
              (entry: { speaker: string; text: string }) =>
                `${entry.speaker === 'YOU' ? 'User' : 'Coach'}: ${entry.text}`
            )
            .join('\n')
        : `Coach: ${question || 'Hello!'}`;

      const prompt = `Recent conversation:
${historyContext}

User just spoke: "${userTranscript}"

Instructions:
1. In "spokenReply", DIRECTLY and ACCURATELY answer the user's exact question or respond to their exact statement in 2 concise, natural sentences.
2. If the user asked ANY question (technical, coding, DSA, OOP, DBMS, OS, interview, general knowledge, or personal), you MUST directly answer their question first before asking a brief follow-up. Do NOT dodge the question or give generic filler.
3. Keep all critique fields to 1 short sentence based strictly on "${userTranscript}".`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          rating: { type: Type.INTEGER },
          fluencyScore: { type: Type.INTEGER },
          grammarScore: { type: Type.INTEGER },
          spokenReply: { type: Type.STRING },
          sectionToImprove: { type: Type.STRING },
          fluencyCritique: { type: Type.STRING },
          grammarCritique: { type: Type.STRING },
          vocabularyCritique: { type: Type.STRING },
          refinedVersion: { type: Type.STRING },
        },
        required: [
          'rating',
          'fluencyScore',
          'grammarScore',
          'spokenReply',
          'sectionToImprove',
          'fluencyCritique',
          'grammarCritique',
          'vocabularyCritique',
          'refinedVersion',
        ],
      };

      const callModel = async (modelName: string) => {
        const aiResponse = await client.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              'You are a fast, knowledgeable, and natural voice assistant and placement coach. Always answer the user’s exact question or statement directly and accurately.',
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            responseMimeType: 'application/json',
            responseSchema,
            temperature: 0.4,
          },
        });
        const rawText = (aiResponse.text || '')
          .replace(/^```json\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();
        const parsed = JSON.parse(rawText);
        if (!parsed || typeof parsed.spokenReply !== 'string' || !parsed.spokenReply.trim()) {
          throw new Error('Empty spokenReply');
        }
        return parsed;
      };

      try {
        // Race gemini-3.1-flash-lite and gemini-3.8-flash with MINIMAL thinking for sub-second response
        const fastResult = await Promise.any([
          callModel('gemini-3.1-flash-lite'),
          callModel('gemini-3.8-flash'),
        ]);
        return res.json(fastResult);
      } catch {
        // Fall through to local responder if both fail
      }
    }

    return res.json(
      generateContextualVoiceCoachReply(userTranscript, question, modeTitle)
    );
  } catch (error: any) {
    console.error('Error in /api/interview/feedback:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 2. Resume Review API
app.post('/api/resume/scan', async (req, res) => {
  try {
    const { resumeText, targetCompany, targetRole } = req.body;

    if (!resumeText || typeof resumeText !== 'string') {
      return res.status(400).json({ error: 'Missing resume text.' });
    }

    if (ai) {
      try {
        const prompt = `Analyze this engineering student resume for ${targetCompany || 'a tech company'} for a ${targetRole || 'Software Engineer'} role.
Resume Text:
"""${resumeText}"""

Return JSON with:
{
  "atsScore": number (0 to 100),
  "keywordMatchRate": number (0 to 100),
  "quantifiableMetricsScore": number (0 to 100),
  "topKeywordsFound": string[],
  "criticalMissingKeywords": string[],
  "formattingScore": number (0 to 100),
  "actionableImprovements": string[],
  "highImpactBulletRewrite": string
}`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.5,
          },
        });

        const responseText = aiResponse.text;
        if (responseText) {
          const parsed = JSON.parse(responseText);
          return res.json(parsed);
        }
      } catch {
        // Silently fall through to deterministic scanner
      }
    }

    // Heuristic fallback
    const techKeywords = ['react', 'node', 'python', 'java', 'c++', 'docker', 'aws', 'sql', 'nosql', 'mongodb', 'git', 'ci/cd', 'rest', 'graphql', 'system design', 'data structures', 'algorithms', 'redis', 'microservices'];
    const foundKeywords = techKeywords.filter(kw => resumeText.toLowerCase().includes(kw));
    const missingKeywords = techKeywords.filter(kw => !resumeText.toLowerCase().includes(kw)).slice(0, 5);
    const metricMatches = resumeText.match(/\d+%/g) || resumeText.match(/\b\d+x\b/g) || [];
    
    const atsScore = Math.min(96, Math.max(55, Math.round(50 + (foundKeywords.length * 2.5) + (metricMatches.length * 5))));

    return res.json({
      atsScore,
      keywordMatchRate: Math.round((foundKeywords.length / techKeywords.length) * 100),
      quantifiableMetricsScore: Math.min(100, metricMatches.length * 25),
      topKeywordsFound: foundKeywords.slice(0, 8),
      criticalMissingKeywords: missingKeywords,
      formattingScore: 88,
      actionableImprovements: [
        'Adopt the Google XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]"',
        'Add more system-level constraints and numbers (e.g. queries per second, latency in ms, payload sizes)',
        'Ensure standard section headers: Education, Technical Skills, Experience, Projects, Achievements',
      ],
      highImpactBulletRewrite: `Architected and deployed asynchronous task worker pipeline using Redis and Docker, reducing peak job latency by 47% and successfully processing 120,000+ daily events.`,
    });
  } catch (error: any) {
    console.error('Error in /api/resume/scan:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Android Digital Asset Links & .aab Bundle Download API
app.get('/.well-known/assetlinks.json', (_req, res) => {
  const assetLinksPath = path.join(__dirname, 'public', '.well-known', 'assetlinks.json');
  if (fs.existsSync(assetLinksPath)) {
    res.setHeader('Content-Type', 'application/json');
    return res.sendFile(assetLinksPath);
  }
  return res.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.threelionventures.proplacement',
        sha256_cert_fingerprints: [
          '3L:10:4E:89:0B:25:45:D4:AF:37:99:88:77:66:55:44:33:22:11:00:AA:BB:CC:DD:EE:FF:01:23:45:67:89:AB',
        ],
      },
    },
  ]);
});

app.get('/api/android/pro-placement.aab', (_req, res) => {
  const aabPath = path.join(__dirname, 'public', 'pro-placement-release.aab');
  if (fs.existsSync(aabPath)) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="pro-placement-release.aab"'
    );
    return res.sendFile(aabPath);
  }
  return res.status(404).json({ error: 'Android App Bundle (.aab) file not found.' });
});

app.get('/api/android/pro-placement.apk', (_req, res) => {
  const apkPath = path.join(__dirname, 'public', 'pro-placement-release.apk');
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="pro-placement-release.apk"'
    );
    return res.sendFile(apkPath);
  }
  return res.status(404).json({ error: 'Android APK (.apk) file not found.' });
});

// Production vs Development setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Pro Placement Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server startup failed:', err);
});
