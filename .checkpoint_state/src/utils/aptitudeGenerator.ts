import { AptitudeQuestion, AptitudePillar } from '../types';
import { CORE_APTITUDE_QUESTIONS } from '../data/aptitudeData';

// Helper: Shuffle any array using Fisher-Yates
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper: Randomize the 4 answer options of a question while preserving the accurate correctIndex
export function jumbleQuestionOptions(q: AptitudeQuestion): AptitudeQuestion {
  const correctOptionText = q.options[q.correctIndex];
  const shuffledOptions = shuffleArray(q.options);
  const newCorrectIndex = shuffledOptions.indexOf(correctOptionText);
  return {
    ...q,
    id: `${q.id}-${Math.random().toString(36).substring(2, 6)}`,
    options: shuffledOptions,
    correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
  };
}

// Track recently shown question texts in memory so opening or clicking Next never repeats consecutively
const recentQuestionsBuffer: string[] = [];

export function generateProceduralAptitudeQuestion(
  pillar?: AptitudePillar
): AptitudeQuestion {
  const pillars: AptitudePillar[] = [
    'Quantitative Aptitude',
    'Logical Reasoning',
    'Verbal Ability',
    'Core CS & Data Interpretation',
  ];
  const selectedPillar =
    pillar || pillars[Math.floor(Math.random() * pillars.length)];

  // 45% chance to draw a freshly jumbled question from CORE_APTITUDE_QUESTIONS matching the pillar
  const matchingCore = CORE_APTITUDE_QUESTIONS.filter(
    (q) => !pillar || q.pillar === selectedPillar
  );
  if (matchingCore.length > 0 && Math.random() < 0.45) {
    const shuffledCore = shuffleArray(matchingCore);
    const candidate =
      shuffledCore.find((c) => !recentQuestionsBuffer.includes(c.question)) ||
      shuffledCore[0];
    recordRecentQuestion(candidate.question);
    return jumbleQuestionOptions(candidate);
  }

  let generated: AptitudeQuestion;
  switch (selectedPillar) {
    case 'Quantitative Aptitude':
      generated = generateProceduralQuant();
      break;
    case 'Logical Reasoning':
      generated = generateProceduralLogical();
      break;
    case 'Core CS & Data Interpretation':
      generated = generateProceduralCS();
      break;
    case 'Verbal Ability':
    default:
      generated = generateProceduralVerbal();
      break;
  }

  recordRecentQuestion(generated.question);
  return jumbleQuestionOptions(generated);
}

function recordRecentQuestion(questionText: string) {
  recentQuestionsBuffer.push(questionText);
  if (recentQuestionsBuffer.length > 15) {
    recentQuestionsBuffer.shift();
  }
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 1. Procedural Quantitative Generator
function generateProceduralQuant(): AptitudeQuestion {
  const type = randInt(1, 5);

  if (type === 1) {
    // Time & Work
    const daysA = randInt(10, 24);
    const daysB = randInt(12, 30);
    const workDaysTogether = randInt(2, 5);

    const lcmVal = (daysA * daysB) / gcd(daysA, daysB);
    const rateA = lcmVal / daysA;
    const rateB = lcmVal / daysB;
    const totalDoneUnits = (rateA + rateB) * workDaysTogether;
    const remainingUnits = lcmVal - totalDoneUnits;

    const simpGcd = gcd(remainingUnits, lcmVal);
    const num = Math.round(remainingUnits / simpGcd);
    const den = Math.round(lcmVal / simpGcd);

    const correctFraction = `${num}/${den}`;
    const wrong1 = `${Math.max(1, num - 1)}/${den}`;
    const wrong2 = `${num + 1}/${den + 2}`;
    const wrong3 = `${Math.min(den - 1, num + 2)}/${den}`;
    const options = shuffleArray([correctFraction, wrong1, wrong2, wrong3]);

    return {
      id: `gen-quant-${Date.now()}`,
      pillar: 'Quantitative Aptitude',
      category: 'Time & Work',
      question: `Person X can complete a full software migration in ${daysA} days, while Person Y can complete it in ${daysB} days. If both collaborate for ${workDaysTogether} days and then pause, what exact fraction of the migration remains uncompleted?`,
      options,
      correctIndex: options.indexOf(correctFraction),
      explanation: `Rate of X = 1/${daysA}, Rate of Y = 1/${daysB}. Combined rate = (${rateA} + ${rateB})/${lcmVal} = ${rateA + rateB}/${lcmVal}. In ${workDaysTogether} days, work done = ${totalDoneUnits}/${lcmVal}. Remaining work = 1 - (${totalDoneUnits}/${lcmVal}) = ${correctFraction}.`,
      formulaUsed: 'Remaining Work = 1 - T × (1/T_X + 1/T_Y)',
    };
  } else if (type === 2) {
    // Relative Speed & Trains
    const lengthTrain = randInt(12, 28) * 10;
    const speedKmh = randInt(10, 20) * 5;
    const speedMs = (speedKmh * 5) / 18;
    const timeSec = Math.round(lengthTrain / speedMs);

    const correctAns = `${timeSec} seconds`;
    const wrong1 = `${timeSec + randInt(2, 4)} seconds`;
    const wrong2 = `${Math.max(3, timeSec - randInt(1, 3))} seconds`;
    const wrong3 = `${timeSec * 2} seconds`;
    const options = shuffleArray([correctAns, wrong1, wrong2, wrong3]);

    return {
      id: `gen-quant-${Date.now()}`,
      pillar: 'Quantitative Aptitude',
      category: 'Speed, Time & Distance',
      question: `A high-speed transit train measuring ${lengthTrain} meters in length moves at a sustained speed of ${speedKmh} km/h. How many seconds will it take to traverse past a stationary signal tower?`,
      options,
      correctIndex: options.indexOf(correctAns),
      explanation: `Convert speed from km/h to m/s: ${speedKmh} × (5/18) = ${speedMs.toFixed(2)} m/s. Time required = Distance / Speed = ${lengthTrain} / ${speedMs.toFixed(2)} = ${timeSec} seconds.`,
      formulaUsed: 'Time = Distance / (Speed × 5/18)',
    };
  } else if (type === 3) {
    // Profit & Loss
    const cp = randInt(20, 85) * 100;
    const profitPct = randInt(2, 7) * 5;
    const sp = Math.round(cp * (1 + profitPct / 100));

    const correctAns = `₹${sp}`;
    const wrong1 = `₹${sp + 250}`;
    const wrong2 = `₹${sp - 200}`;
    const wrong3 = `₹${Math.round(cp * (1 + (profitPct + 10) / 100))}`;
    const options = shuffleArray([correctAns, wrong1, wrong2, wrong3]);

    return {
      id: `gen-quant-${Date.now()}`,
      pillar: 'Quantitative Aptitude',
      category: 'Profit, Loss & Percentages',
      question: `A vendor purchases a consignment of enterprise microcontrollers for ₹${cp}. To achieve a targeted net profit margin of ${profitPct}%, at what selling price must the batch be invoiced?`,
      options,
      correctIndex: options.indexOf(correctAns),
      explanation: `Selling Price (SP) = Cost Price (CP) × (1 + Profit% / 100) = ₹${cp} × (1 + ${profitPct}/100) = ₹${sp}.`,
      formulaUsed: 'SP = CP × (1 + P / 100)',
    };
  } else if (type === 4) {
    // Averages & Mixtures
    const count = randInt(6, 12);
    const oldAvg = randInt(40, 75);
    const newMemberVal = oldAvg + randInt(1, 5) * (count + 1);
    const newAvg = Math.round((count * oldAvg + newMemberVal) / (count + 1));

    const correctAns = `${newAvg}`;
    const wrong1 = `${newAvg + 2}`;
    const wrong2 = `${newAvg - 2}`;
    const wrong3 = `${oldAvg + 1}`;
    const options = shuffleArray([correctAns, wrong1, wrong2, wrong3]);

    return {
      id: `gen-quant-${Date.now()}`,
      pillar: 'Quantitative Aptitude',
      category: 'Averages & Data',
      question: `The average latency of ${count} microservices in a cluster is ${oldAvg} ms. When a new analytics service with a latency of ${newMemberVal} ms is added to the cluster, what is the new average latency across all ${count + 1} services?`,
      options,
      correctIndex: options.indexOf(correctAns),
      explanation: `Total initial latency = ${count} × ${oldAvg} = ${count * oldAvg} ms. Adding the new service gives ${count * oldAvg + newMemberVal} ms across ${count + 1} services. New average = ${newAvg} ms.`,
      formulaUsed: 'New Average = (N × Old_Avg + X) / (N + 1)',
    };
  } else {
    // Probability & Combinatorics
    const totalBalls = randInt(10, 16);
    const redBalls = randInt(4, totalBalls - 3);
    const blueBalls = totalBalls - redBalls;

    const num = redBalls * (redBalls - 1);
    const den = totalBalls * (totalBalls - 1);
    const g = gcd(num, den);
    const correctFraction = `${num / g}/${den / g}`;
    const wrong1 = `${num / g + 1}/${den / g}`;
    const wrong2 = `${num / g}/${den / g + 2}`;
    const wrong3 = `1/${randInt(3, 7)}`;
    const options = shuffleArray([correctFraction, wrong1, wrong2, wrong3]);

    return {
      id: `gen-quant-${Date.now()}`,
      pillar: 'Quantitative Aptitude',
      category: 'Probability & Combinations',
      question: `A secure server rack contains ${totalBalls} disk drives, of which ${redBalls} are Solid State Disks (SSDs) and ${blueBalls} are Hard Disk Drives (HDDs). If 2 drives are selected at random without replacement, what is the probability that both are SSDs?`,
      options,
      correctIndex: options.indexOf(correctFraction),
      explanation: `Probability = (C(${redBalls}, 2)) / (C(${totalBalls}, 2)) = (${redBalls} × ${redBalls - 1}) / (${totalBalls} × ${totalBalls - 1}) = ${num}/${den} = ${correctFraction}.`,
      formulaUsed: 'P(2 SSDs) = [n(SSD) / n(Total)] × [(n(SSD) - 1) / (n(Total) - 1)]',
    };
  }
}

// 2. Procedural Logical Reasoning Generator
function generateProceduralLogical(): AptitudeQuestion {
  const mode = randInt(1, 3);

  if (mode === 1) {
    const seed = randInt(2, 9);
    const diff = randInt(3, 11);
    const series = [seed, seed + diff, seed + diff * 2, seed + diff * 3];
    const nextVal = seed + diff * 4;

    const correctAns = `${nextVal}`;
    const options = shuffleArray([
      correctAns,
      `${nextVal + 2}`,
      `${nextVal - 3}`,
      `${nextVal + diff}`,
    ]);

    return {
      id: `gen-log-${Date.now()}`,
      pillar: 'Logical Reasoning',
      category: 'Number & Pattern Series',
      question: `Identify the missing term in the arithmetic progression: ${series.join(', ')}, ?`,
      options,
      correctIndex: options.indexOf(correctAns),
      explanation: `The sequence increases by a constant difference of +${diff} at each step. Thus, ${series[3]} + ${diff} = ${nextVal}.`,
      formulaUsed: 'T_n = a + (n - 1)d',
    };
  } else if (mode === 2) {
    // Geometric / Doubling + offset series
    const start = randInt(2, 5);
    const offset = randInt(1, 3);
    const s1 = start;
    const s2 = s1 * 2 + offset;
    const s3 = s2 * 2 + offset;
    const s4 = s3 * 2 + offset;
    const nextVal = s4 * 2 + offset;

    const correctAns = `${nextVal}`;
    const options = shuffleArray([
      correctAns,
      `${nextVal - offset}`,
      `${nextVal + 4}`,
      `${s4 * 2}`,
    ]);

    return {
      id: `gen-log-${Date.now()}`,
      pillar: 'Logical Reasoning',
      category: 'Recursive Number Series',
      question: `Find the next number in the logical progression: ${s1}, ${s2}, ${s3}, ${s4}, ?`,
      options,
      correctIndex: options.indexOf(correctAns),
      explanation: `Each term follows the pattern T(n) = 2 × T(n-1) + ${offset}. Therefore, 2 × ${s4} + ${offset} = ${nextVal}.`,
      formulaUsed: `T_n = 2 × T_{n-1} + ${offset}`,
    };
  } else {
    // Coding-Decoding Cipher Shift
    const words = ['CLOUD', 'STACK', 'GRAPH', 'ARRAY', 'LOGIC', 'CACHE'];
    const word = words[randInt(0, words.length - 1)];
    const shift = randInt(1, 3);
    const encoded = word
      .split('')
      .map((ch) => String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65))
      .join('');

    const wrong1 = word
      .split('')
      .map((ch) => String.fromCharCode(((ch.charCodeAt(0) - 65 + shift + 1) % 26) + 65))
      .join('');
    const wrong2 = encoded.split('').reverse().join('');
    const wrong3 = word
      .split('')
      .map((ch) => String.fromCharCode(((ch.charCodeAt(0) - 65 + shift + 2) % 26) + 65))
      .join('');

    const options = shuffleArray([encoded, wrong1, wrong2, wrong3]);

    return {
      id: `gen-log-${Date.now()}`,
      pillar: 'Logical Reasoning',
      category: 'Coding & Cipher Decoding',
      question: `In a certain cryptographic cipher, each letter of a word is shifted forward by +${shift} positions in the English alphabet. How is the word "${word}" encoded in that cipher?`,
      options,
      correctIndex: options.indexOf(encoded),
      explanation: `Shifting each letter of "${word}" forward by +${shift} alphabetical positions yields "${encoded}".`,
      formulaUsed: `Cipher(c) = (c + ${shift}) mod 26`,
    };
  }
}

// 3. Procedural Core CS Generator
function generateProceduralCS(): AptitudeQuestion {
  const csTopics = [
    {
      category: 'Computer Networks',
      question:
        'In an IPv4 Class C network with subnet mask 255.255.255.224 (/27), how many usable host IP addresses are available per subnet?',
      options: ['30 hosts', '32 hosts', '28 hosts', '16 hosts'],
      correctIndex: 0,
      explanation:
        'A /27 subnet mask leaves 32 - 27 = 5 host bits. Total IP addresses = 2^5 = 32. Subtracting 2 for the Network ID and Broadcast address gives 32 - 2 = 30 usable host addresses.',
      formulaUsed: 'Usable Hosts = 2^(32 - Prefix) - 2',
    },
    {
      category: 'Operating Systems',
      question:
        'Which CPU scheduling algorithm is mathematically proven to achieve the minimal average waiting time for a given set of stationary processes?',
      options: [
        'Shortest Job First (SJF / SRTF)',
        'Round Robin with small quantum',
        'First-Come, First-Served (FCFS)',
        'Priority Scheduling without preemption',
      ],
      correctIndex: 0,
      explanation:
        'Shortest Job First (SJF) is mathematically optimal because scheduling the process with the shortest burst time first minimizes the waiting time of all subsequent queued processes.',
      formulaUsed: 'Asymptotic Proof of Optimal Queuing Delay',
    },
    {
      category: 'DBMS & SQL',
      question:
        'Which relational database index data structure is typically preferred over a Hash Index for range queries (e.g. `WHERE salary BETWEEN 50000 AND 80000`)?',
      options: ['B+ Tree Index', 'Hash Index', 'Inverted Index', 'Bitmap Index'],
      correctIndex: 0,
      explanation:
        'B+ Trees maintain leaf nodes in a sorted doubly linked list, enabling efficient sequential scans for range lookups. Hash indexes only support exact equality matches in O(1) time.',
      formulaUsed: 'B+ Tree Leaf Node Pointer Traversal',
    },
    {
      category: 'OOP & System Design',
      question:
        'In SOLID design principles, which rule states that "subtypes must be substitutable for their base types without altering system correctness"?',
      options: [
        'Liskov Substitution Principle (LSP)',
        'Open-Closed Principle (OCP)',
        'Dependency Inversion Principle (DIP)',
        'Single Responsibility Principle (SRP)',
      ],
      correctIndex: 0,
      explanation:
        'The Liskov Substitution Principle states that objects of a superclass should be replaceable with objects of its subclasses without breaking application logic.',
      formulaUsed: 'SOLID Principles: LSP',
    },
    {
      category: 'Data Structures & Complexity',
      question:
        'What is the worst-case time complexity of building a Binary Heap in-place from an unsorted array of N elements using bottom-up heapify?',
      options: ['O(N)', 'O(N log N)', 'O(log N)', 'O(N^2)'],
      correctIndex: 0,
      explanation:
        'Bottom-up heap construction (Floyd’s algorithm) runs in linear O(N) time because most nodes reside near the bottom of the tree and travel at most 1 or 2 levels.',
      formulaUsed: 'Sum(h / 2^h) = O(N)',
    },
  ];

  const shuffled = shuffleArray(csTopics);
  const item =
    shuffled.find((c) => !recentQuestionsBuffer.includes(c.question)) ||
    shuffled[0];
  return {
    id: `gen-cs-${Date.now()}`,
    pillar: 'Core CS & Data Interpretation',
    ...item,
  };
}

// 4. Procedural Verbal Generator
function generateProceduralVerbal(): AptitudeQuestion {
  const verbalItems = [
    {
      category: 'Sentence Correction',
      question:
        'Select the sentence that exhibits flawless grammatical agreement and punctuation:',
      options: [
        'The committee has submitted its recommendations regarding the cloud migration.',
        'The committee have submitted their recommendations regarding the cloud migration.',
        'The committee has submitted their recommendations regarding the cloud migration.',
        'The committee have submitted its recommendations regarding the cloud migration.',
      ],
      correctIndex: 0,
      explanation:
        'In formal business and technical English, collective nouns like "committee" functioning as a single entity take the singular verb "has" and singular pronoun "its".',
      formulaUsed: 'Collective Noun Agreement',
    },
    {
      category: 'Vocabulary & Antonyms',
      question: 'Choose the exact ANTONYM of the word "EPHEMERAL":',
      options: ['Perpetual', 'Transient', 'Evadable', 'Fugacious'],
      correctIndex: 0,
      explanation:
        '"Ephemeral" means lasting for a very short time. "Perpetual" means never ending or changing, making it the antonym.',
      formulaUsed: 'Lexical Contrast',
    },
    {
      category: 'Spotting Errors',
      question:
        'Read the sentence: "Despite of having the best benchmark scores, the algorithm failed in load testing." Where is the error?',
      options: [
        '"Despite of" (should be "Despite" or "In spite of")',
        '"having the best"',
        '"the algorithm failed"',
        'No error in the sentence',
      ],
      correctIndex: 0,
      explanation:
        '"Despite" never takes the preposition "of". One must write either "Despite having" or "In spite of having".',
      formulaUsed: 'Prepositional Phrase Rules',
    },
    {
      category: 'Contextual Vocabulary',
      question:
        'Choose the word that best completes the sentence: "The principal engineer provided a _______ explanation that clarified the distributed consensus protocol in under two minutes."',
      options: ['Lucid', 'Nebulous', 'Convoluted', 'Verbose'],
      correctIndex: 0,
      explanation:
        '"Lucid" means expressed clearly and easy to understand, which fits clarifying a complex protocol quickly.',
      formulaUsed: 'Contextual Semantic Fit',
    },
  ];

  const shuffled = shuffleArray(verbalItems);
  const item =
    shuffled.find((c) => !recentQuestionsBuffer.includes(c.question)) ||
    shuffled[0];
  return {
    id: `gen-verb-${Date.now()}`,
    pillar: 'Verbal Ability',
    ...item,
  };
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

// Generate a freshly jumbled mock test every time
export function generateMockTest(count: number = 10): AptitudeQuestion[] {
  const result: AptitudeQuestion[] = [];

  const baseline = shuffleArray(CORE_APTITUDE_QUESTIONS).map((q) =>
    jumbleQuestionOptions(q)
  );
  const fromBaseline = Math.min(baseline.length, Math.floor(count / 2));
  result.push(...baseline.slice(0, fromBaseline));

  while (result.length < count) {
    result.push(generateProceduralAptitudeQuestion());
  }

  return shuffleArray(result);
}
