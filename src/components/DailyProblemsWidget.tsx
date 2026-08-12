import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { DsaProblem } from '../lib/types';
import { ExternalLink, CheckCircle2, Circle, AlertCircle, Loader2, ChefHat } from 'lucide-react';

// Curated Fallbacks for LeetCode (since GraphQL blocks CORS)
const LEETCODE_FALLBACK_PROBLEMS = [
  {
    title: "Two Sum",
    link: "https://leetcode.com/problems/two-sum/",
    difficulty: "Easy",
    tags: ["Arrays", "Hash Table"]
  },
  {
    title: "Add Two Numbers",
    link: "https://leetcode.com/problems/add-two-numbers/",
    difficulty: "Medium",
    tags: ["Linked List", "Math"]
  },
  {
    title: "Longest Substring Without Repeating Characters",
    link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    difficulty: "Medium",
    tags: ["Hash Table", "String", "Sliding Window"]
  },
  {
    title: "Container With Most Water",
    link: "https://leetcode.com/problems/container-with-most-water/",
    difficulty: "Medium",
    tags: ["Array", "Two Pointers"]
  },
  {
    title: "3Sum",
    link: "https://leetcode.com/problems/3sum/",
    difficulty: "Medium",
    tags: ["Array", "Two Pointers", "Sorting"]
  },
  {
    title: "Valid Parentheses",
    link: "https://leetcode.com/problems/valid-parentheses/",
    difficulty: "Easy",
    tags: ["String", "Stack"]
  },
  {
    title: "Merge Two Sorted Lists",
    link: "https://leetcode.com/problems/merge-two-sorted-lists/",
    difficulty: "Easy",
    tags: ["Linked List", "Recursion"]
  },
  {
    title: "Search in Rotated Sorted Array",
    link: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    difficulty: "Medium",
    tags: ["Array", "Binary Search"]
  },
  {
    title: "Maximum Subarray",
    link: "https://leetcode.com/problems/maximum-subarray/",
    difficulty: "Medium",
    tags: ["Array", "Dynamic Programming"]
  },
  {
    title: "Spiral Matrix",
    link: "https://leetcode.com/problems/spiral-matrix/",
    difficulty: "Medium",
    tags: ["Array", "Matrix"]
  },
  {
    title: "Merge Sorted Array",
    link: "https://leetcode.com/problems/merge-sorted-array/",
    difficulty: "Easy",
    tags: ["Array", "Two Pointers"]
  },
  {
    title: "Climbing Stairs",
    link: "https://leetcode.com/problems/climbing-stairs/",
    difficulty: "Easy",
    tags: ["Dynamic Programming", "Math"]
  },
  {
    title: "Same Tree",
    link: "https://leetcode.com/problems/same-tree/",
    difficulty: "Easy",
    tags: ["Trees", "Depth-First Search"]
  },
  {
    title: "Best Time to Buy and Sell Stock",
    link: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    difficulty: "Easy",
    tags: ["Array", "Dynamic Programming"]
  },
  {
    title: "Valid Palindrome",
    link: "https://leetcode.com/problems/valid-palindrome/",
    difficulty: "Easy",
    tags: ["Two Pointers", "String"]
  },
  {
    title: "Single Number",
    link: "https://leetcode.com/problems/single-number/",
    difficulty: "Easy",
    tags: ["Array", "Bit Manipulation"]
  },
  {
    title: "Linked List Cycle",
    link: "https://leetcode.com/problems/linked-list-cycle/",
    difficulty: "Easy",
    tags: ["Linked List", "Two Pointers"]
  },
  {
    title: "Min Stack",
    link: "https://leetcode.com/problems/min-stack/",
    difficulty: "Medium",
    tags: ["Stack", "Design"]
  },
  {
    title: "Intersection of Two Linked Lists",
    link: "https://leetcode.com/problems/intersection-of-two-linked-lists/",
    difficulty: "Easy",
    tags: ["Linked List", "Two Pointers"]
  },
  {
    title: "Majority Element",
    link: "https://leetcode.com/problems/majority-element/",
    difficulty: "Easy",
    tags: ["Array", "Sorting", "Divide and Conquer"]
  }
];

// Curated Fallbacks for GeeksforGeeks
// DOCUMENTED LINK-SOURCE PRIORITY RULE:
// 1. LeetCode: Check if problem exists on LeetCode first.
// 2. GeeksforGeeks Practice: If not on LeetCode, use GfG Practice.
// 3. Fallback: If on neither, use other reliable platforms.
const GFG_FALLBACK_PROBLEMS = [
  {
    title: "Kadane's Algorithm",
    link: "https://leetcode.com/problems/maximum-subarray/",
    difficulty: "Medium",
    tags: ["Arrays", "Dynamic Programming"]
  },
  {
    title: "Subarray with given sum",
    link: "https://www.geeksforgeeks.org/problems/subarray-with-given-sum-1587115621/1",
    difficulty: "Medium",
    tags: ["Arrays", "Two-pointer"]
  },
  {
    title: "Missing number in array",
    link: "https://leetcode.com/problems/missing-number/",
    difficulty: "Easy",
    tags: ["Arrays", "Searching"]
  },
  {
    title: "Merge Without Extra Space",
    link: "https://leetcode.com/problems/merge-sorted-array/",
    difficulty: "Hard",
    tags: ["Arrays", "Sorting"]
  },
  {
    title: "Parenthesis Checker",
    link: "https://leetcode.com/problems/valid-parentheses/",
    difficulty: "Easy",
    tags: ["Stacks", "Data Structures"]
  },
  {
    title: "Kth Smallest Element",
    link: "https://www.geeksforgeeks.org/problems/kth-smallest-element5635/1",
    difficulty: "Medium",
    tags: ["Arrays", "Sorting", "Heap"]
  },
  {
    title: "Binary Search",
    link: "https://leetcode.com/problems/binary-search/",
    difficulty: "Easy",
    tags: ["Algorithms", "Searching"]
  },
  {
    title: "Reverse a linked list",
    link: "https://leetcode.com/problems/reverse-linked-list/",
    difficulty: "Easy",
    tags: ["Linked List"]
  },
  {
    title: "Detect Loop in linked list",
    link: "https://leetcode.com/problems/linked-list-cycle/",
    difficulty: "Medium",
    tags: ["Linked List", "Two-pointer"]
  },
  {
    title: "Diameter of Binary Tree",
    link: "https://leetcode.com/problems/diameter-of-binary-tree/",
    difficulty: "Medium",
    tags: ["Trees", "Recursion"]
  },
  {
    title: "Height of Binary Tree",
    link: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
    difficulty: "Easy",
    tags: ["Trees", "Recursion"]
  },
  {
    title: "Lowest Common Ancestor in a BST",
    link: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/",
    difficulty: "Easy",
    tags: ["BST", "Trees"]
  },
  {
    title: "Spirally traversing a matrix",
    link: "https://leetcode.com/problems/spiral-matrix/",
    difficulty: "Medium",
    tags: ["Matrix", "Arrays"]
  },
  {
    title: "Search in a Rotated Array",
    link: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    difficulty: "Medium",
    tags: ["Arrays", "Searching"]
  },
  {
    title: "Find triplets with zero sum",
    link: "https://leetcode.com/problems/3sum/",
    difficulty: "Medium",
    tags: ["Arrays", "Sorting", "Two-pointer"]
  },
  {
    title: "Product array puzzle",
    link: "https://leetcode.com/problems/product-of-array-except-self/",
    difficulty: "Easy",
    tags: ["Arrays"]
  },
  {
    title: "Bubble Sort",
    link: "https://www.geeksforgeeks.org/problems/bubble-sort/1",
    difficulty: "Easy",
    tags: ["Sorting", "Algorithms"]
  },
  {
    title: "Selection Sort",
    link: "https://www.geeksforgeeks.org/problems/selection-sort/1",
    difficulty: "Easy",
    tags: ["Sorting", "Algorithms"]
  },
  {
    title: "Insertion Sort",
    link: "https://www.geeksforgeeks.org/problems/insertion-sort/1",
    difficulty: "Easy",
    tags: ["Sorting", "Algorithms"]
  }
];

// Curated Problems for CodeChef
const CODECHEF_PROBLEMS = [
  {
    title: "FLOW001. Add Two Numbers",
    link: "https://www.codechef.com/problems/FLOW001",
    difficulty: "Easy",
    tags: ["Basic Math", "Introduction"]
  },
  {
    title: "FLOW002. Find Remainder",
    link: "https://www.codechef.com/problems/FLOW002",
    difficulty: "Easy",
    tags: ["Basic Math", "Operators"]
  },
  {
    title: "FLOW004. First and Last Digit",
    link: "https://www.codechef.com/problems/FLOW004",
    difficulty: "Easy",
    tags: ["Math", "Digits"]
  },
  {
    title: "FLOW006. Sum of Digits",
    link: "https://www.codechef.com/problems/FLOW006",
    difficulty: "Easy",
    tags: ["Basic Math", "Digits"]
  },
  {
    title: "FSQRT. Finding Square Roots",
    link: "https://www.codechef.com/problems/FSQRT",
    difficulty: "Easy",
    tags: ["Math", "Binary Search"]
  },
  {
    title: "HS08TEST. ATM",
    link: "https://www.codechef.com/problems/HS08TEST",
    difficulty: "Easy",
    tags: ["Decimals", "Conditionals"]
  },
  {
    title: "INTEST. Enormous Input Test",
    link: "https://www.codechef.com/problems/INTEST",
    difficulty: "Medium",
    tags: ["Fast I/O", "Loops"]
  },
  {
    title: "TLG. The Lead Game",
    link: "https://www.codechef.com/problems/TLG",
    difficulty: "Medium",
    tags: ["Arrays", "Simulation"]
  },
  {
    title: "FCTRL2. Small Factorials",
    link: "https://www.codechef.com/problems/FCTRL2",
    difficulty: "Medium",
    tags: ["Big Integers", "Math"]
  },
  {
    title: "PALL01. The Block Game",
    link: "https://www.codechef.com/problems/PALL01",
    difficulty: "Easy",
    tags: ["String", "Palindrome"]
  },
  {
    title: "LUCKFOUR. Lucky Four",
    link: "https://www.codechef.com/problems/LUCKFOUR",
    difficulty: "Easy",
    tags: ["Loops", "Digits"]
  },
  {
    title: "PRB01. Primality Test",
    link: "https://www.codechef.com/problems/PRB01",
    difficulty: "Easy",
    tags: ["Math", "Prime Numbers"]
  },
  {
    title: "CHOPRT. Chef and Operators",
    link: "https://www.codechef.com/problems/CHOPRT",
    difficulty: "Easy",
    tags: ["Conditionals", "Comparison"]
  },
  {
    title: "AMR15A. Mahasena",
    link: "https://www.codechef.com/problems/AMR15A",
    difficulty: "Easy",
    tags: ["Arrays", "Loops"]
  },
  {
    title: "DIFFSUM. Sum OR Difference",
    link: "https://www.codechef.com/problems/DIFFSUM",
    difficulty: "Easy",
    tags: ["Basic Math", "Conditionals"]
  },
  {
    title: "DECINC. Decrement OR Increment",
    link: "https://www.codechef.com/problems/DECINC",
    difficulty: "Easy",
    tags: ["Basic Programming", "Operators"]
  },
  {
    title: "CARVANS. Carvans",
    link: "https://www.codechef.com/problems/CARVANS",
    difficulty: "Medium",
    tags: ["Greedy", "Arrays"]
  },
  {
    title: "FCTRL. Factorial",
    link: "https://www.codechef.com/problems/FCTRL",
    difficulty: "Medium",
    tags: ["Mathematics", "Number Theory"]
  },
  {
    title: "CONFLIP. Coin Flip",
    link: "https://www.codechef.com/problems/CONFLIP",
    difficulty: "Medium",
    tags: ["Math", "Brainteaser"]
  },
  {
    title: "ZCO14003. Smart Phone",
    link: "https://www.codechef.com/problems/ZCO14003",
    difficulty: "Medium",
    tags: ["Sorting", "Arrays"]
  }
];

// Curated HackerRank Problems
const HACKERRANK_PROBLEMS = [
  {
    title: "Solve Me First",
    link: "https://www.hackerrank.com/challenges/solve-me-first/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Warmup"]
  },
  {
    title: "Simple Array Sum",
    link: "https://www.hackerrank.com/challenges/simple-array-sum/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Warmup"]
  },
  {
    title: "Compare the Triplets",
    link: "https://www.hackerrank.com/challenges/compare-the-triplets/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Warmup"]
  },
  {
    title: "A Very Big Sum",
    link: "https://www.hackerrank.com/challenges/a-very-big-sum/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Warmup"]
  },
  {
    title: "Diagonal Difference",
    link: "https://www.hackerrank.com/challenges/diagonal-difference/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Warmup"]
  },
  {
    title: "Plus Minus",
    link: "https://www.hackerrank.com/challenges/plus-minus/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Warmup"]
  },
  {
    title: "Staircase",
    link: "https://www.hackerrank.com/challenges/staircase/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Warmup"]
  },
  {
    title: "Mini-Max Sum",
    link: "https://www.hackerrank.com/challenges/mini-max-sum/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Warmup"]
  },
  {
    title: "Birthday Cake Candles",
    link: "https://www.hackerrank.com/challenges/birthday-cake-candles/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Warmup"]
  },
  {
    title: "Time Conversion",
    link: "https://www.hackerrank.com/challenges/time-conversion/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Warmup"]
  },
  {
    title: "Grading Students",
    link: "https://www.hackerrank.com/challenges/grading/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Implementation"]
  },
  {
    title: "Apple and Orange",
    link: "https://www.hackerrank.com/challenges/apple-and-orange/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Implementation"]
  },
  {
    title: "Number Line Jumps",
    link: "https://www.hackerrank.com/challenges/kangaroo/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Implementation"]
  },
  {
    title: "Between Two Sets",
    link: "https://www.hackerrank.com/challenges/between-two-sets/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Implementation"]
  },
  {
    title: "Breaking the Records",
    link: "https://www.hackerrank.com/challenges/breaking-best-and-worst-records/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Implementation"]
  },
  {
    title: "Subarray Division",
    link: "https://www.hackerrank.com/challenges/the-birthday-bar/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Implementation"]
  },
  {
    title: "Divisible Sum Pairs",
    link: "https://www.hackerrank.com/challenges/divisible-sum-pairs/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Implementation"]
  },
  {
    title: "Migratory Birds",
    link: "https://www.hackerrank.com/challenges/migratory-birds/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Implementation"]
  },
  {
    title: "Day of the Programmer",
    link: "https://www.hackerrank.com/challenges/day-of-the-programmer/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Implementation"]
  },
  {
    title: "Bill Division",
    link: "https://www.hackerrank.com/challenges/bon-appetit/problem",
    difficulty: "Easy",
    tags: ["Algorithms", "Implementation"]
  }
];

interface ProblemData {
  title: string;
  link: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  error?: boolean;
}

interface DailyProblemsWidgetProps {
  problems: DsaProblem[];
  onProblemSolved: (updatedList: DsaProblem[]) => void;
  syncOverallMetrics: (currentProblems: DsaProblem[]) => Promise<void>;
}

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export default function DailyProblemsWidget({
  problems,
  onProblemSolved,
  syncOverallMetrics
}: DailyProblemsWidgetProps) {
  const { user } = useAuth();
  const [data, setData] = useState<Record<string, ProblemData> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchDailyProblems() {
      setLoading(true);
      try {
        // Try calling the Supabase Edge Function first
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/potd`, {
          method: 'POST',
          headers
        });

        if (res.ok) {
          const json = await res.json();
          setData(json);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Edge Function potd failed, falling back to local rotation:', err);
      }

      // Local calculation fallback if edge function is missing or returns error
      const localResults: Record<string, ProblemData> = {};
      const dayOfYear = getDayOfYear();

      // 1. LeetCode Fallback
      const lcIndex = dayOfYear % LEETCODE_FALLBACK_PROBLEMS.length;
      localResults['leetcode'] = LEETCODE_FALLBACK_PROBLEMS[lcIndex] as ProblemData;

      // 2. CodeChef Fallback
      const ccIndex = dayOfYear % CODECHEF_PROBLEMS.length;
      localResults['codechef'] = CODECHEF_PROBLEMS[ccIndex] as ProblemData;

      // 3. GeeksforGeeks Fallback
      const gfgIndex = dayOfYear % GFG_FALLBACK_PROBLEMS.length;
      localResults['geeksforgeeks'] = GFG_FALLBACK_PROBLEMS[gfgIndex] as ProblemData;

      // 4. Codeforces Fallback - Fetch from problem set directly since it supports CORS
      try {
        const cfRes = await fetch("https://codeforces.com/api/problemset.problems");
        if (cfRes.ok) {
          const cfJson = await cfRes.json();
          if (cfJson.status === "OK") {
            const cfProblems = cfJson.result.problems;
            const eligible = cfProblems.filter((p: any) => p.rating && p.rating >= 900 && p.rating <= 1500);
            if (eligible.length > 0) {
              const cfIndex = dayOfYear % eligible.length;
              const problem = eligible[cfIndex];
              localResults['codeforces'] = {
                title: `${problem.contestId}${problem.index}. ${problem.name}`,
                link: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
                difficulty: problem.rating >= 1300 ? "Hard" : (problem.rating >= 1100 ? "Medium" : "Easy"),
                tags: problem.tags || []
              };
            }
          }
        }
      } catch (cfErr) {
        console.error('Failed to fetch Codeforces live API:', cfErr);
      }

      // Hard fallback if Codeforces fetch fails
      if (!localResults['codeforces']) {
        localResults['codeforces'] = {
          title: "158A. Next Round",
          link: "https://codeforces.com/problemset/problem/158/A",
          difficulty: "Easy",
          tags: ["special", "implementation"]
        };
      }

      // 5. HackerRank Fallback
      const hrIndex = dayOfYear % HACKERRANK_PROBLEMS.length;
      localResults['hackerrank'] = HACKERRANK_PROBLEMS[hrIndex] as ProblemData;

      setData(localResults);
      setLoading(false);
    }

    fetchDailyProblems();
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'leetcode':
        return (
          <svg className="w-5 h-5 text-orange-500 fill-current" viewBox="0 0 24 24">
            <path d="M16.102 17.93l-2.69 2.607c-.466.451-1.111.696-1.744.696a2.285 2.285 0 0 1-1.745-.696L3.92 14.517a2.262 2.262 0 0 1 0-3.225l9.098-9.023c.448-.449 1.097-.696 1.738-.696.642 0 1.29.247 1.739.696l2.793 2.766a2.262 2.262 0 0 1 0 3.225l-4.57 4.536t-4.57 4.536c-.449.449-1.097.696-1.739.696-.642 0-1.29-.247-1.738-.696L8.47 11.23a.754.754 0 0 1 0-1.075.77.77 0 0 1 1.082 0l2.366 2.347 4.57-4.537a.754.754 0 0 1 1.083 0 .77.77 0 0 1 0 1.075l-4.569 4.537-2.691 2.671-1.084-1.075 4.57-4.537a.754.754 0 0 1 1.083 0 .77.77 0 0 1 0 1.075l-4.57 4.537z" />
          </svg>
        );
      case 'codechef':
        return <ChefHat className="w-5 h-5 text-[#b97a3e]" />;
      case 'geeksforgeeks':
        return (
          <svg className="w-5 h-5 text-[#2f8d46] fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.8 14.8c-1.32-.42-2.12-1.63-2.12-3.32 0-1.72.84-2.92 2.2-3.32.32-.1.44-.46.24-.72l-.4-.52c-.14-.18-.42-.2-.6-.06C7.3 10.38 6.5 11.96 6.5 13.5c0 1.94.94 3.7 3.02 4.2.22.06.46-.1.46-.34v-.7c-.02-.26-.2-.36-.28-.36zm4.8-.84c0-.24-.24-.4-.46-.34-.08 0-.26.1-.28.36v.7c0 .24.24.4.46.34 2.08-.5 3.02-2.26 3.02-4.2 0-1.54-.8-3.12-3.02-4.64-.18-.14-.46-.12-.6.06l-.4.52c-.2.26-.08.62.24.72 1.36.4 2.2 1.6 2.2 3.32 0 1.69-.8 2.9-2.12 3.32z" />
          </svg>
        );
      case 'codeforces':
        return (
          <div className="flex gap-0.5 items-end h-4 w-4 shrink-0 mb-0.5">
            <div className="w-1.5 h-2.5 bg-blue-500 rounded-sm"></div>
            <div className="w-1.5 h-4 bg-red-500 rounded-sm"></div>
            <div className="w-1.5 h-3 bg-yellow-500 rounded-sm"></div>
          </div>
        );
      case 'hackerrank':
        return (
          <svg className="w-5 h-5 text-[#2ec866] fill-current" viewBox="0 0 24 24">
            <path d="M12.012 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm.012 16.5c-3.59 0-6.5-2.91-6.5-6.5s2.91-6.5 6.5-6.5 6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5zm-3-8.5v4c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1zm4 3h-2v-2h2v2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'leetcode': return 'LeetCode';
      case 'codechef': return 'CodeChef';
      case 'geeksforgeeks': return 'GeeksforGeeks';
      case 'codeforces': return 'Codeforces';
      case 'hackerrank': return 'HackerRank';
      default: return platform;
    }
  };

  const getTopicForPlatform = (platform: string) => {
    switch (platform) {
      case 'leetcode': return 'Leetcode POTD';
      case 'codechef': return 'CodeChef POTD';
      case 'geeksforgeeks': return 'GFG POTD';
      case 'codeforces': return 'Codeforces POTD';
      case 'hackerrank': return 'HackerRank POTD';
      default: return 'Other';
    }
  };

  // Check if a problem is already marked as solved
  const isSolved = (problemDetail: ProblemData) => {
    if (!problemDetail) return false;
    const detailLink = problemDetail.link.toLowerCase();
    const detailTitle = problemDetail.title.toLowerCase();

    return problems.some(p => {
      if (p.status !== 'Solved') return false;
      const problemLink = p.problem_link?.toLowerCase() || '';
      const problemName = p.problem_name.toLowerCase();

      return problemLink.includes(detailLink) || 
             detailLink.includes(problemLink) || 
             problemName.includes(detailTitle) || 
             detailTitle.includes(problemName);
    });
  };

  const handleMarkAsSolved = async (platform: string, problemDetail: ProblemData) => {
    if (!user || submittingIds[platform]) return;

    setSubmittingIds(prev => ({ ...prev, [platform]: true }));

    try {
      // Check if problem already exists in list (we'll update it to solved if so)
      const detailLink = problemDetail.link.toLowerCase();
      const detailTitle = problemDetail.title.toLowerCase();
      const existing = problems.find(p => {
        const problemLink = p.problem_link?.toLowerCase() || '';
        const problemName = p.problem_name.toLowerCase();
        return (problemLink && (problemLink.includes(detailLink) || detailLink.includes(problemLink))) ||
               problemName.includes(detailTitle) || 
               detailTitle.includes(problemName);
      });

      let updatedProblems: DsaProblem[] = [];

      if (existing) {
        // Update existing problem to solved
        const { data: updated, error } = await supabase
          .from('dsa_tracker')
          .update({ status: 'Solved', updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        updatedProblems = problems.map(p => p.id === existing.id ? (updated as DsaProblem) : p);
      } else {
        // Insert new solved problem
        const payload = {
          user_id: user.id,
          problem_name: problemDetail.title,
          topic: getTopicForPlatform(platform),
          difficulty: problemDetail.difficulty,
          status: 'Solved',
          problem_link: problemDetail.link,
          solution_link: '',
          updated_at: new Date().toISOString()
        };

        const { data: inserted, error } = await supabase
          .from('dsa_tracker')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        updatedProblems = [inserted as DsaProblem, ...problems];
      }

      onProblemSolved(updatedProblems);
      await syncOverallMetrics(updatedProblems);
    } catch (err) {
      console.error(`Failed to mark ${platform} problem as solved:`, err);
      alert('Error updating problem status');
    } finally {
      setSubmittingIds(prev => ({ ...prev, [platform]: false }));
    }
  };

  const difficultyColors = {
    Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Hard: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  if (loading) {
    return (
      <div className="mb-8 w-full">
        <h2 className="text-lg font-semibold text-white mb-4">Today's Challenges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse bg-ink-800/40 backdrop-blur-md border border-ink-700/30 rounded-2xl p-5 h-44 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="w-24 h-5 bg-ink-700 rounded"></div>
                  <div className="w-12 h-5 bg-ink-700 rounded-full"></div>
                </div>
                <div className="w-full h-8 bg-ink-700 rounded"></div>
              </div>
              <div className="flex gap-2">
                <div className="w-20 h-8 bg-ink-700 rounded-lg"></div>
                <div className="w-24 h-8 bg-ink-700 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mb-8 w-full animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">Today's Daily Problems</h2>
          <p className="text-xs text-slate-400 mt-0.5">Fresh problem sets from competitive coding platforms</p>
        </div>
        <div className="text-[10px] uppercase font-semibold text-brand-400 tracking-wider bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
          Auto Reset Daily
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(data).map(([platform, potd]) => {
          const solved = isSolved(potd);
          const submitting = submittingIds[platform];

          if (potd.error) {
            return (
              <div
                key={platform}
                className="group relative bg-ink-800/40 backdrop-blur-md border border-ink-700/30 hover:border-ink-600/40 transition-all duration-300 rounded-2xl p-5 flex flex-col justify-between h-44 overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(platform)}
                    <span className="font-semibold text-sm text-slate-300">{getPlatformName(platform)}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    Offline
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-400 my-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Couldn't load today's problem details.</span>
                </div>

                <a
                  href={potd.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center py-2 px-3 text-xs font-medium rounded-xl bg-ink-700/50 hover:bg-ink-700 text-white border border-ink-600/30 group-hover:border-ink-500/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Open {getPlatformName(platform)}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            );
          }

          return (
            <div
              key={platform}
              className={`group relative bg-ink-800/40 backdrop-blur-md border hover:border-ink-600/40 transition-all duration-300 rounded-2xl p-5 flex flex-col justify-between h-44 overflow-hidden ${
                solved ? 'border-brand-500/30 bg-brand-500/[0.02]' : 'border-ink-700/30'
              }`}
            >
              <div>
                {/* Platform info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(platform)}
                    <span className="font-semibold text-sm text-slate-200">{getPlatformName(platform)}</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      difficultyColors[potd.difficulty] || 'bg-slate-500/10 text-slate-400'
                    }`}
                  >
                    {potd.difficulty}
                  </span>
                </div>

                {/* Problem title */}
                <h3 className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors line-clamp-2 mt-3 leading-snug">
                  {potd.title}
                </h3>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-2 overflow-hidden max-h-5">
                  {potd.tags && potd.tags.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="text-[9px] text-slate-500 bg-ink-900/40 px-1.5 py-0.5 rounded border border-ink-800/50">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 shrink-0">
                <a
                  href={potd.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2 px-3 text-xs font-semibold rounded-xl bg-ink-700/50 hover:bg-ink-700 text-white border border-ink-600/30 group-hover:border-ink-500/30 transition-all flex items-center justify-center gap-1"
                >
                  <span>Solve Now</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>

                <button
                  onClick={() => handleMarkAsSolved(platform, potd)}
                  disabled={submitting}
                  className={`p-2 rounded-xl border transition-all ${
                    solved
                      ? 'bg-brand-500/10 border-brand-500/20 text-brand-400 hover:bg-brand-500/20'
                      : 'bg-ink-700/30 border-ink-600/20 text-slate-400 hover:text-slate-200 hover:bg-ink-700/60'
                  }`}
                  title={solved ? "Mark as Unsolved" : "Mark as Solved"}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  ) : solved ? (
                    <CheckCircle2 className="w-4 h-4 text-brand-400 fill-brand-500/10 animate-pulse-soft" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
