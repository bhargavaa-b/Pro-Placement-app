import { CurriculumDay } from '../types';

export const CURRICULUM_MONTHS = [
  {
    month: 1,
    title: 'Foundations & Big-O Asymptotic Analysis',
    objective: 'Master complexity analysis, recursion trees, memory hierarchies, and space-time tradeoffs.',
    daysCount: 30,
    primaryFocus: 'Arrays, Bit Manipulation, Math, Asymptotics',
  },
  {
    month: 2,
    title: 'Linear Data Structures & Core Quantitative Math',
    objective: 'Deep dive into Linked Lists, Stacks, Queues, Time & Work, Speed & Distance.',
    daysCount: 30,
    primaryFocus: 'Linked Lists, Monotonic Stacks, Quantitative Pillars',
  },
  {
    month: 3,
    title: 'Two Pointers, Sliding Window & Logical Reasoning',
    objective: 'Window sliding invariants, bilateral convergence, syllogisms, and number sequences.',
    daysCount: 30,
    primaryFocus: 'Sliding Window, Two Pointers, Logical Deductions',
  },
  {
    month: 4,
    title: 'Trees, Heaps & Verbal Communication Mastery',
    objective: 'Binary Trees, BSTs, Priority Queues, English speaking cadence, STAR framework.',
    daysCount: 30,
    primaryFocus: 'Binary Trees, Heaps, Conversational Fluency',
  },
  {
    month: 5,
    title: 'Recursion, Backtracking & Advanced Combinatorics',
    objective: 'State-space tree exploration, constraint propagation, permutations, and subsets.',
    daysCount: 30,
    primaryFocus: 'Backtracking, Trie, Probability & Combinatorics',
  },
  {
    month: 6,
    title: 'Dynamic Programming & Graph Traversals',
    objective: 'Tabulation vs memoization, DAG shortest paths, BFS, DFS, and topological sort.',
    daysCount: 30,
    primaryFocus: '1D/2D DP, Graph Traversals, State Transitions',
  },
  {
    month: 7,
    title: 'Advanced Graphs, DSU, Segment Trees & Core CS',
    objective: 'Disjoint Set Union, Segment Trees, Operating Systems, DBMS SQL, and Networks.',
    daysCount: 30,
    primaryFocus: 'DSU, Segment Trees, OS Invariants, DBMS Normalization',
  },
  {
    month: 8,
    title: 'System Design (LLD & HLD) & ATS Resume Engineering',
    objective: 'Microservices, cache invalidation, rate limiting, and ATS keyword optimization.',
    daysCount: 30,
    primaryFocus: 'System Design, High & Low Level Architecture, Resume Auditing',
  },
  {
    month: 9,
    title: 'Placement Sprint: FAANG Mock Drives & Speed Drills',
    objective: 'Timed coding assessments, high-pressure interviews, cold networking, and salary negotiation.',
    daysCount: 30,
    primaryFocus: 'FAANG Timed Drills, Full Mock Drives, Offer Closing',
  },
];

export function generate270DaysCurriculum(): CurriculumDay[] {
  const allDays: CurriculumDay[] = [];
  let dayCounter = 1;

  for (const m of CURRICULUM_MONTHS) {
    for (let d = 1; d <= m.daysCount; d++) {
      const dayNum = dayCounter++;
      const topicName = getDayTopic(m.month, d);
      const primaryFocus = m.primaryFocus.split(',')[0].trim();
      
      allDays.push({
        day: dayNum,
        month: m.month,
        monthTitle: m.title,
        topic: topicName,
        dsaTargets: [
          `DSA Problem #${((dayNum * 7) % 300) + 1}: ${topicName} (Core)`,
          `DSA Problem #${((dayNum * 13) % 300) + 301}: ${topicName} (Edge Cases)`,
          `DSA Problem #${((dayNum * 23) % 300) + 601}: ${topicName} (Hard / Company Variant)`,
        ],
        aptitudeTarget: `Complete 10 high-speed drills on ${primaryFocus} (80%+ target accuracy)`,
        communicationTarget: `Practice 1 full spoken STAR scenario with AI Voice Coach (${getCommPrompt(dayNum)})`,
        completed: false,
        dailyTasks: [
          {
            id: `task-${dayNum}-1`,
            title: `Theory & Invariants: Deep-dive into ${topicName} complexity tradeoffs`,
            category: 'Core CS',
            estimatedMinutes: 25,
            completed: false,
          },
          {
            id: `task-${dayNum}-2`,
            title: `Coding Drill: Implement and test 3 problem patterns on ${topicName}`,
            category: 'DSA',
            estimatedMinutes: 45,
            completed: false,
          },
          {
            id: `task-${dayNum}-3`,
            title: `Quantitative Speed Test: Solve 10 timed questions on ${primaryFocus}`,
            category: 'Aptitude',
            estimatedMinutes: 30,
            completed: false,
          },
          {
            id: `task-${dayNum}-4`,
            title: `Voice Coach Practice: Speak STAR response on "${getCommPrompt(dayNum)}"`,
            category: 'Communication',
            estimatedMinutes: 20,
            completed: false,
          },
        ],
        dailyQuestions: generateDailyQuestionsForDay(dayNum, topicName, primaryFocus),
      });
    }
  }

  return allDays;
}

function generateDailyQuestionsForDay(dayNum: number, topic: string, primaryFocus: string) {
  const techQuestionPool = [
    {
      q: `What is the optimal time and space complexity for solving ${topic}, and what edge case must you guard against first?`,
      hint: `Consider empty inputs, single element boundaries, integer overflow, and recursion stack bounds.`,
      ans: `For ${topic}, the optimal approach typically achieves O(N) or O(N log N) runtime with O(1) or O(N) auxiliary space. The primary edge case is handling empty or null inputs, followed by boundary limits like single-node structures and potential integer overflow when calculating midpoints (use low + (high - low) / 2).`,
    },
    {
      q: `How do you identify whether an iterative two-pointer or recursive divide-and-conquer strategy is superior for ${topic}?`,
      hint: `Check if state can be evaluated monotonically or requires exploring overlapping subtrees.`,
      ans: `Two-pointer iterative methods are preferred when monotonic ordering exists (e.g., sorted arrays or sliding windows), granting O(1) space. Divide-and-conquer is required when subproblems are independent and require post-order aggregation (e.g., merge sort or tree path sums), incurring O(log N) stack frames.`,
    },
    {
      q: `In a production FAANG interview, how would you optimize the memory footprint when scaling ${topic} across gigabytes of data?`,
      hint: `Think about streaming, chunking, bitwise masks, and external storage memory hierarchies.`,
      ans: `Replace in-memory array buffers with disk-backed chunks or external k-way merge algorithms. Use bitwise vectors to compress boolean states by 8x, and apply streaming generators with sliding windows to maintain O(K) memory where K is the window size instead of O(N) total dataset size.`,
    },
  ];

  const aptQuestionPool = [
    {
      q: `In a quantitative test on ${primaryFocus}, if an algorithm processes N elements in 12ms and 2N elements in 48ms, what is its asymptotic time complexity?`,
      hint: `Compare the growth ratio: 48 / 12 = 4 when size doubles.`,
      ans: `The growth factor is 48ms / 12ms = 4 when input size doubles (2N / N = 2). Since 2² = 4, runtime is proportional to N², indicating quadratic O(N²) time complexity.`,
    },
    {
      q: `A worker completes an engineering task in 6 hours, and an automated script finishes it in 2 hours. If both work concurrently, how many minutes will the task take?`,
      hint: `Combined rate = 1/6 + 1/2 = 4/6 tasks per hour.`,
      ans: `Combined rate per hour is 1/6 + 3/6 = 4/6 = 2/3 tasks per hour. Total time required is 3/2 hours = 1.5 hours, which equals exactly 90 minutes.`,
    },
    {
      q: `If the probability of a packet succeeding is 0.8, what is the probability that at least one of two independent transmission attempts succeeds?`,
      hint: `Use the complement rule: 1 - P(both fail).`,
      ans: `P(single failure) = 1 - 0.8 = 0.2. P(both attempts fail) = 0.2 × 0.2 = 0.04. Therefore, P(at least one success) = 1 - 0.04 = 0.96 (or 96%).`,
    },
  ];

  const commQuestionPool = [
    {
      q: `Behavioral Prompt: "${getCommPrompt(dayNum)}" — Structure your spoken answer using the STAR methodology.`,
      hint: `Spend 15% on Situation, 15% on Task, 50% on your concrete Actions, and 20% on quantifiable Results.`,
      ans: `Start with a concise 1-sentence Situation establishing context. Define the specific technical constraint (Task). Spend the majority of your time detailing 3 deliberate architectural decisions YOU personally executed (Action). Conclude with tangible metrics such as latency reduced by 42% or delivery 2 weeks ahead of schedule (Result).`,
    },
  ];

  const tIndex = (dayNum - 1) % techQuestionPool.length;
  const aIndex = (dayNum - 1) % aptQuestionPool.length;
  const cIndex = (dayNum - 1) % commQuestionPool.length;

  return [
    {
      id: `q-${dayNum}-tech`,
      type: 'technical' as const,
      question: techQuestionPool[tIndex].q,
      hint: techQuestionPool[tIndex].hint,
      answerExplanation: techQuestionPool[tIndex].ans,
    },
    {
      id: `q-${dayNum}-apt`,
      type: 'aptitude' as const,
      question: aptQuestionPool[aIndex].q,
      hint: aptQuestionPool[aIndex].hint,
      answerExplanation: aptQuestionPool[aIndex].ans,
    },
    {
      id: `q-${dayNum}-comm`,
      type: 'interview' as const,
      question: commQuestionPool[cIndex].q,
      hint: commQuestionPool[cIndex].hint,
      answerExplanation: commQuestionPool[cIndex].ans,
    },
  ];
}

function getDayTopic(month: number, day: number): string {
  const topicsByMonth: Record<number, string[]> = {
    1: ['Time & Space Complexity', 'Big-O Analysis', 'Array Reversals & Partitioning', 'Bitwise Manipulation', 'Prefix Sums', 'Binary Exponentiation', 'Modulo Arithmetic'],
    2: ['Singly & Doubly Linked Lists', 'Fast & Slow Pointer Cycle Detection', 'Stack Inversion', 'Monotonic Stack Fundamentals', 'Min-Stack Design', 'Queue Implementations', 'Deque Sliding Techniques'],
    3: ['Two Pointers Convergence', 'Variable Sized Sliding Window', 'Fixed Window Maxima', 'Syllogism Analysis', 'Blood Relations Mapping', 'Direction Sense Geometry', 'Series Convergence'],
    4: ['Binary Tree Inorder/Preorder/Postorder', 'Level Order BFS with Deque', 'Lowest Common Ancestor', 'Max Path Sum', 'Min-Heap Priority Queue', 'Top-K Stream Filter', 'Verbal Fluency Cadence'],
    5: ['N-Queens Problem', 'Sudoku Backtracking', 'Permutations & Subsets', 'Trie Prefix Trees', 'Word Search DFS', 'Probability Permutations', 'Game Theory Recursion'],
    6: ['Coin Change Formulation', 'Longest Increasing Subsequence', '0/1 Knapsack & Unbounded', 'Edit Distance Matrix', 'Kahn Algorithm Topological Sort', 'Dijkstra Shortest Path', 'Connected Components'],
    7: ['Disjoint Set Union (DSU)', 'Kruskal MST', 'Segment Tree Point Updates', 'Range Minimum Query with Lazy', 'OS Process Deadlocks', 'DBMS SQL Joins & Normalization', 'TCP Congestion Control'],
    8: ['Distributed Rate Limiter', 'TinyURL Hashing', 'LRU Cache Design', 'Event-Driven Message Queues', 'Database Sharding & Replication', 'ATS Resume Action Verbs', 'Technical Portfolio Polish'],
    9: ['Google Mock Speed Sprint', 'Amazon Bar Raiser Simulator', 'Microsoft System Round', 'Meta Algorithmic Timed Mock', 'Goldman Sachs Math Round', 'HR Behavioral STAR Pitch', 'Offer Package Negotiation'],
  };

  const list = topicsByMonth[month] || ['Core Technical Mastery'];
  return list[(day - 1) % list.length];
}

function getCommPrompt(dayNum: number): string {
  const prompts = [
    'Explain your favorite project architecture in 90 seconds',
    'Walk through how you handled a disagreement with a team member',
    'Describe the most elusive bug you ever debugged and solved',
    'Explain how HTTPS works to a non-technical interviewer',
    'Tell me about a time you missed a deadline and how you mitigated it',
    'Why do you want to join our engineering organization?',
  ];
  return prompts[(dayNum - 1) % prompts.length];
}
