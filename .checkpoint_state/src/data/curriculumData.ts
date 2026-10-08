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
        aptitudeTarget: `Complete 10 high-speed drills on ${m.primaryFocus.split(',')[0]} (80%+ target accuracy)`,
        communicationTarget: `Practice 1 full spoken STAR scenario with AI Voice Coach (${getCommPrompt(dayNum)})`,
        completed: false,
      });
    }
  }

  return allDays;
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
