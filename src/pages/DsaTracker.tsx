import { useEffect, useState, type FormEvent } from 'react';
import {
  Plus, Trash2, Loader2, ExternalLink, Code2, CheckCircle2,
  Circle, Clock, X, ChevronDown, Filter, AlertTriangle, Cpu, BookOpen, Layers, Play
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { DsaProblem } from '../lib/types';
import DailyProblemsWidget from '../components/DailyProblemsWidget';

interface DsaAttempt {
  id: string;
  problem_id: string;
  user_id: string;
  approach_name: string;
  time_complexity: string;
  space_complexity: string;
  code_snippet: string | null;
  notes: string | null;
  created_at: string;
}

const TOPICS = [
  'Arrays & Vectors',
  'Strings',
  'Stacks & Queues',
  'Linked List',
  'Trees & BST',
  'Graphs',
  'Dynamic Programming',
  'Recursion & Backtracking',
  'Heaps / Priority Queue',
  'Sliding Window / Two Pointers',
  'Bit Manipulation',
  'Greedy',
  'Hash Tables',
  'Binary Search',
  'Trie',
] as const;

const TOPIC_SET = new Set<string>(TOPICS);
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
type Difficulty = (typeof DIFFICULTIES)[number];
const STATUSES = ['Unsolved', 'In Progress', 'Solved'] as const;
type DsaStatus = (typeof STATUSES)[number];

const DIFF_META: Record<Difficulty, string> = {
  Easy: 'text-emerald-400 bg-emerald-500/10',
  Medium: 'text-amber-400 bg-amber-500/10',
  Hard: 'text-rose-400 bg-rose-500/10',
};

const STATUS_ICON: Record<DsaStatus, React.ReactNode> = {
  Unsolved: <Circle className="w-4 h-4 text-slate-500" />,
  'In Progress': <Clock className="w-4 h-4 text-amber-400" />,
  Solved: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
};

const NEXT_STATUS: Record<DsaStatus, DsaStatus> = {
  Unsolved: 'In Progress',
  'In Progress': 'Solved',
  Solved: 'Unsolved',
};

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export interface StriverProblem {
  name: string;
  topic: typeof TOPICS[number];
  difficulty: Difficulty;
  problem_link: string;
  video_link?: string;
  solution_link?: string;
}

export const STRIVER_SHEET_PROBLEMS: StriverProblem[] = [
  { name: "Set Matrix Zeroes", topic: "Arrays & Vectors", difficulty: "Medium", problem_link: "https://leetcode.com/problems/set-matrix-zeroes/", video_link: "https://youtu.be/N0MgLvceX7M", solution_link: "https://takeuforward.org/data-structure/set-matrix-zero/" },
  { name: "Pascal's Triangle I", topic: "Arrays & Vectors", difficulty: "Easy", problem_link: "https://leetcode.com/problems/pascals-triangle/", video_link: "https://youtu.be/bR7mQgwQ_o8", solution_link: "https://takeuforward.org/data-structure/program-to-generate-pascals-triangle" },
  { name: "Next Permutation", topic: "Arrays & Vectors", difficulty: "Medium", problem_link: "https://leetcode.com/problems/next-permutation/", video_link: "https://youtu.be/JDOXKqF60RQ", solution_link: "https://takeuforward.org/data-structure/next_permutation-find-next-lexicographically-greater-permutation/" },
  { name: "Kadane's Algorithm", topic: "Arrays & Vectors", difficulty: "Medium", problem_link: "https://leetcode.com/problems/maximum-subarray/", video_link: "https://youtu.be/AHZpyENo7k4?si=QJpof4R1hHokm1hw", solution_link: "https://takeuforward.org/data-structure/kadanes-algorithm-maximum-subarray-sum-in-an-array/" },
  { name: "Sort an array of 0's 1's and 2's", topic: "Arrays & Vectors", difficulty: "Medium", problem_link: "https://leetcode.com/problems/sort-colors/", video_link: "https://youtu.be/tp8JIuCXBaU", solution_link: "https://takeuforward.org/data-structure/sort-an-array-of-0s-1s-and-2s/" },
  { name: "Stock Buy and Sell", topic: "Arrays & Vectors", difficulty: "Medium", problem_link: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", video_link: "https://youtu.be/excAOvwF_Wk", solution_link: "https://takeuforward.org/data-structure/stock-buy-and-sell/" },
  { name: "Rotate matrix by 90 degrees", topic: "Arrays & Vectors", difficulty: "Medium", problem_link: "https://leetcode.com/problems/rotate-image/", video_link: "https://youtu.be/Z0R2u6gd3GU", solution_link: "https://takeuforward.org/data-structure/rotate-image-by-90-degree/" },
  { name: "Merge Overlapping Subintervals", topic: "Arrays & Vectors", difficulty: "Medium", problem_link: "https://leetcode.com/problems/merge-intervals/", video_link: "https://youtu.be/IexN60k62jo", solution_link: "https://takeuforward.org/data-structure/merge-overlapping-sub-intervals/" },
  { name: "Merge two sorted arrays without extra space", topic: "Arrays & Vectors", difficulty: "Medium", problem_link: "https://leetcode.com/problems/merge-sorted-array/", video_link: "https://youtu.be/n7uwj04E0I4", solution_link: "https://takeuforward.org/data-structure/merge-two-sorted-arrays-without-extra-space/" },
  { name: "Find the Duplicate Number", topic: "Arrays & Vectors", difficulty: "Medium", problem_link: "https://leetcode.com/problems/find-the-duplicate-number/", video_link: "https://www.youtube.com/watch?v=32Ll35mhWg0&list=PLgUwDviBIf0rPG3Ictpu74YWBQ1CaBkm2&index=1", solution_link: "https://takeuforward.org/data-structure/find-the-duplicate-in-an-array-of-n1-integers/" },
  { name: "Find the repeating and missing number", topic: "Arrays & Vectors", difficulty: "Hard", problem_link: "https://www.interviewbit.com/problems/repeat-and-missing-number-array/", video_link: "https://youtu.be/2D0D8HE6uak", solution_link: "https://takeuforward.org/data-structure/find-the-repeating-and-missing-numbers/" },
  { name: "Inversion of Array (Pre-req: Merge Sort)", topic: "Arrays & Vectors", difficulty: "Hard", problem_link: "https://www.codingninjas.com/studio/problems/count-inversions_615", video_link: "https://youtu.be/AseUmwVNaoY", solution_link: "https://takeuforward.org/data-structure/count-inversions-in-an-array" },
  { name: "Search in a 2D matrix", topic: "Arrays & Vectors", difficulty: "Hard", problem_link: "https://leetcode.com/problems/search-a-2d-matrix/", video_link: "https://youtu.be/ZYpYur0znng", solution_link: "https://takeuforward.org/data-structure/search-in-a-sorted-2d-matrix/" },
  { name: "Pow(x, n)", topic: "Arrays & Vectors", difficulty: "Easy", problem_link: "https://leetcode.com/problems/powx-n/", video_link: "https://youtu.be/l0YC3876qxg", solution_link: "https://takeuforward.org/data-structure/implement-powxn-x-raised-to-the-power-n/" },
  { name: "Majority Element-I", topic: "Arrays & Vectors", difficulty: "Easy", problem_link: "https://leetcode.com/problems/majority-element/", video_link: "https://youtu.be/nP_ns3uSh80", solution_link: "https://takeuforward.org/data-structure/find-the-majority-element-that-occurs-more-than-n-2-times/" },
  { name: "Majority Element-II", topic: "Arrays & Vectors", difficulty: "Hard", problem_link: "https://leetcode.com/problems/majority-element-ii/", video_link: "https://youtu.be/vwZj1K0e9U8", solution_link: "https://takeuforward.org/data-structure/majority-elementsn-3-times-find-the-elements-that-appears-more-than-n-3-times-in-the-array/" },
  { name: "Grid unique paths", topic: "Arrays & Vectors", difficulty: "Medium", problem_link: "https://leetcode.com/problems/unique-paths/", video_link: "https://www.youtube.com/watch?v=sdE0A2Oxofw", solution_link: "https://takeuforward.org/data-structure/grid-unique-paths-dp-on-grids-dp8/" },
  { name: "Reverse Pairs", topic: "Arrays & Vectors", difficulty: "Hard", problem_link: "https://leetcode.com/problems/reverse-pairs/", video_link: "https://youtu.be/0e4bZaP3MDI", solution_link: "https://takeuforward.org/data-structure/count-reverse-pairs/" },
  { name: "Two Sum", topic: "Arrays & Vectors", difficulty: "Easy", problem_link: "https://leetcode.com/problems/two-sum/", video_link: "https://youtu.be/UXDSeD9mN-k", solution_link: "https://takeuforward.org/data-structure/two-sum-check-if-a-pair-with-given-sum-exists-in-array/" },
  { name: "4 Sum", topic: "Arrays & Vectors", difficulty: "Medium", problem_link: "https://leetcode.com/problems/4sum/", video_link: "https://youtu.be/eD95WRfh81c", solution_link: "https://takeuforward.org/data-structure/4-sum-find-quads-that-add-up-to-a-target-value/" },
  { name: "Longest Consecutive Sequence in an Array", topic: "Arrays & Vectors", difficulty: "Medium", problem_link: "https://leetcode.com/problems/longest-consecutive-sequence/solution/", video_link: "https://youtu.be/oO5uLE7EUlM", solution_link: "https://takeuforward.org/data-structure/longest-consecutive-sequence-in-an-array/" },
  { name: "Largest Subarray with K sum", topic: "Arrays & Vectors", difficulty: "Medium", problem_link: "https://practice.geeksforgeeks.org/problems/largest-subarray-with-0-sum/1", video_link: "https://youtu.be/frf7qxiN2qU", solution_link: "https://takeuforward.org/data-structure/length-of-the-longest-subarray-with-zero-sum/" },
  { name: "Count subarrays with given xor K", topic: "Arrays & Vectors", difficulty: "Hard", problem_link: "https://www.interviewbit.com/problems/subarray-with-given-xor/", video_link: "https://youtu.be/eZr-6p0B7ME", solution_link: "https://takeuforward.org/data-structure/count-the-number-of-subarrays-with-given-xor-k/" },
  { name: "Longest Substring Without Repeating Characters", topic: "Arrays & Vectors", difficulty: "Medium", problem_link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", video_link: "https://youtu.be/-zSxTJkcdAo?si=I2zfR-vlDMg0zU9z", solution_link: "https://takeuforward.org/data-structure/length-of-longest-substring-without-any-repeating-character/" },
  { name: "Reverse a LL", topic: "Linked List", difficulty: "Medium", problem_link: "https://leetcode.com/problems/reverse-linked-list/", video_link: "https://youtu.be/D2vI2DNJGd8?si=RCaLSx01qR21IBdh", solution_link: "https://takeuforward.org/data-structure/reverse-a-linked-list/" },
  { name: "Find Middle of Linked List", topic: "Linked List", difficulty: "Easy", problem_link: "https://leetcode.com/problems/middle-of-the-linked-list/", video_link: "https://youtu.be/7LjQ57RqgEc?si=ir_rRDio38rhamU_", solution_link: "https://takeuforward.org/data-structure/find-middle-element-in-a-linked-list/" },
  { name: "Merge two Sorted Lists ", topic: "Linked List", difficulty: "Hard", problem_link: "https://leetcode.com/problems/merge-two-sorted-lists/", video_link: "https://www.youtube.com/watch?v=Xb4slcp1U38&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=29", solution_link: "https://takeuforward.org/data-structure/merge-two-sorted-linked-lists/" },
  { name: "Remove Nth node from the back of the LL", topic: "Linked List", difficulty: "Medium", problem_link: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/", video_link: "https://youtu.be/3kMKYQ2wNIU?si=DtFDnPU7z9HMz_GM", solution_link: "https://takeuforward.org/data-structure/remove-n-th-node-from-the-end-of-a-linked-list/" },
  { name: "Add two numbers as LinkedList", topic: "Linked List", difficulty: "Medium", problem_link: "https://leetcode.com/problems/add-two-numbers/", video_link: "https://www.youtube.com/watch?v=LBVsXSMOIk4&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=32", solution_link: "https://takeuforward.org/data-structure/add-two-numbers-represented-as-linked-lists/" },
  { name: "Delete Node in a Linked List O(1)", topic: "Linked List", difficulty: "Medium", problem_link: "https://leetcode.com/problems/delete-node-in-a-linked-list/", video_link: "https://www.youtube.com/watch?v=icnp4FJdZ_c&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=31", solution_link: "https://takeuforward.org/data-structure/delete-given-node-in-a-linked-list-o1-approach/" },
  { name: "Find the intersection point of Y LL", topic: "Linked List", difficulty: "Medium", problem_link: "https://leetcode.com/problems/intersection-of-two-linked-lists/", video_link: "https://youtu.be/0DYoPz2Tpt4?si=L-uJs5yXUxj4VJM2", solution_link: "https://takeuforward.org/data-structure/find-intersection-of-two-linked-lists/" },
  { name: "Detect a loop in LL", topic: "Linked List", difficulty: "Medium", problem_link: "https://leetcode.com/problems/linked-list-cycle/", video_link: "https://youtu.be/wiOo4DC5GGA?si=zagt6O6tFXc4_3cx", solution_link: "https://takeuforward.org/data-structure/detect-a-cycle-in-a-linked-list/" },
  { name: "Reverse LL in group of given size K", topic: "Linked List", difficulty: "Hard", problem_link: "https://leetcode.com/problems/reverse-nodes-in-k-group/", video_link: "https://youtu.be/lIar1skcQYI?si=_jFghHKX4eaK36a1", solution_link: "https://takeuforward.org/data-structure/reverse-linked-list-in-groups-of-size-k/" },
  { name: "Check if LL is palindrome or not", topic: "Linked List", difficulty: "Medium", problem_link: "https://leetcode.com/problems/palindrome-linked-list/", video_link: "https://youtu.be/lRY_G-u_8jk?si=BpM8hRYvXSYyjl-G", solution_link: "https://takeuforward.org/data-structure/check-if-given-linked-list-is-plaindrome/" },
  { name: "Find the starting point in LL", topic: "Linked List", difficulty: "Medium", problem_link: "https://leetcode.com/problems/linked-list-cycle-ii/", video_link: "https://youtu.be/2Kd0KKmmHFc?si=7UreDPRjRvapeVB0", solution_link: "https://takeuforward.org/data-structure/starting-point-of-loop-in-a-linked-list/" },
  { name: "Flattening of LL", topic: "Linked List", difficulty: "Hard", problem_link: "https://practice.geeksforgeeks.org/problems/flattening-a-linked-list/1", video_link: "https://youtu.be/ykelywHJWLg?si=InMg9MmTHzY22NSR", solution_link: "https://takeuforward.org/data-structure/flattening-a-linked-list/" },
  { name: "Rotate a LL", topic: "Linked List", difficulty: "Hard", problem_link: "https://leetcode.com/problems/rotate-list/description/", video_link: "https://youtu.be/uT7YI7XbTY8?si=ZaChW3a68c_v54Is", solution_link: "https://takeuforward.org/data-structure/rotate-a-linked-list/" },
  { name: "Clone a LL with random and next pointer", topic: "Linked List", difficulty: "Hard", problem_link: "https://leetcode.com/problems/copy-list-with-random-pointer/", video_link: "https://youtu.be/q570bKdrnlw?si=epZtpWvtNwuTf23o", solution_link: "https://takeuforward.org/data-structure/clone-linked-list-with-random-and-next-pointer/" },
  { name: "3 Sum", topic: "Linked List", difficulty: "Medium", problem_link: "https://leetcode.com/problems/3sum/", video_link: "https://youtu.be/DhFh8Kw7ymk", solution_link: "https://takeuforward.org/data-structure/3-sum-find-triplets-that-add-up-to-a-zero/" },
  { name: "Trapping Rainwater", topic: "Linked List", difficulty: "Hard", problem_link: "https://leetcode.com/problems/trapping-rain-water/", video_link: "https://youtu.be/1_5VuquLbXg?si=NFG6df318_6OtGvg", solution_link: "https://takeuforward.org/data-structure/trapping-rainwater/" },
  { name: "Remove duplicates from sorted array", topic: "Linked List", difficulty: "Easy", problem_link: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/#:~:text=Input%3A%20nums%20%3D%20%5B0%2C,%2C%203%2C%20and%204%20respectively.", video_link: "https://youtu.be/37E9ckMDdTk?t=1887", solution_link: "https://takeuforward.org/data-structure/remove-duplicates-in-place-from-sorted-array/" },
  { name: "Maximum Consecutive Ones", topic: "Linked List", difficulty: "Easy", problem_link: "https://leetcode.com/problems/max-consecutive-ones/", video_link: "https://youtu.be/bYWLJb3vCWY?t=1124", solution_link: "https://takeuforward.org/data-structure/count-maximum-consecutive-ones-in-the-array/" },
  { name: "N meetings in one room", topic: "Greedy", difficulty: "Medium", problem_link: "https://practice.geeksforgeeks.org/problems/n-meetings-in-one-room-1587115620/1", video_link: "https://youtu.be/mKfhTotEguk?si=2RELeq18mpmIIN3Q", solution_link: "https://takeuforward.org/data-structure/n-meetings-in-one-room/" },
  { name: "Minimum number of platforms required for a railway", topic: "Greedy", difficulty: "Medium", problem_link: "https://practice.geeksforgeeks.org/problems/minimum-platforms-1587115620/1", video_link: "https://youtu.be/AsGzwR_FWok?si=165acXU_dtqOHuo9", solution_link: "https://takeuforward.org/data-structure/minimum-number-of-platforms-required-for-a-railway/" },
  { name: "Job sequencing Problem", topic: "Greedy", difficulty: "Medium", problem_link: "https://practice.geeksforgeeks.org/problems/job-sequencing-problem-1587115620/1", video_link: "https://youtu.be/QbwltemZbRg?si=wvcemJ5BLPlTRmkG", solution_link: "https://takeuforward.org/data-structure/job-sequencing-problem/" },
  { name: "Fractional Knapsack", topic: "Greedy", difficulty: "Medium", problem_link: "https://practice.geeksforgeeks.org/problems/fractional-knapsack-1587115620/1", video_link: "https://youtu.be/1ibsQrnuEEg?si=8R2By3wpHo0zZVHE", solution_link: "https://takeuforward.org/data-structure/fractional-knapsack-problem-greedy-approach/" },
  { name: "Minimum coins", topic: "Greedy", difficulty: "Hard", problem_link: "https://leetcode.com/problems/coin-change/", video_link: "https://www.youtube.com/watch?v=myPeWb3Y68A", solution_link: "https://takeuforward.org/data-structure/minimum-coins-dp-20/" },
  { name: "Assign Cookies", topic: "Greedy", difficulty: "Easy", problem_link: "https://leetcode.com/problems/assign-cookies/", video_link: "https://youtu.be/DIX2p7vb9co?si=GofAIDimue-Av0Fi", solution_link: "https://takeuforward.org/data-structure/assign-cookies" },
  { name: "Subset Sums", topic: "Recursion & Backtracking", difficulty: "Hard", problem_link: "https://practice.geeksforgeeks.org/problems/subset-sums2234/1", video_link: "https://www.youtube.com/watch?v=rYkfBRtMJr8&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=52", solution_link: "https://takeuforward.org/data-structure/subset-sum-sum-of-all-subsets/" },
  { name: "Subsets II", topic: "Recursion & Backtracking", difficulty: "Medium", problem_link: "https://leetcode.com/problems/subsets-ii/", video_link: "https://www.youtube.com/watch?v=RIn3gOkbhQE&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=53", solution_link: "https://takeuforward.org/data-structure/subset-ii-print-all-the-unique-subsets/" },
  { name: "Combination Sum", topic: "Recursion & Backtracking", difficulty: "Medium", problem_link: "https://leetcode.com/problems/combination-sum/", video_link: "https://www.youtube.com/watch?v=OyZFFqQtu98&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=49", solution_link: "https://takeuforward.org/data-structure/combination-sum-1/" },
  { name: "Combination Sum II", topic: "Recursion & Backtracking", difficulty: "Medium", problem_link: "https://leetcode.com/problems/combination-sum-ii/", video_link: "https://www.youtube.com/watch?v=G1fRTGRxXU8&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=50", solution_link: "https://takeuforward.org/data-structure/combination-sum-ii-find-all-unique-combinations/" },
  { name: "Palindrome partitioning", topic: "Recursion & Backtracking", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/palindrome-partitioning", video_link: "https://youtu.be/_H8V5hJUGd0", solution_link: "" },
  { name: "Permutation Sequence", topic: "Recursion & Backtracking", difficulty: "Medium", problem_link: "https://leetcode.com/problems/permutation-sequence/", video_link: "https://www.youtube.com/watch?v=wT7gcXLYoao&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=55", solution_link: "https://takeuforward.org/data-structure/find-k-th-permutation-sequence/" },
  { name: "Permutations of a String", topic: "Recursion & Backtracking", difficulty: "Medium", problem_link: "https://leetcode.com/problems/permutations/", video_link: "https://www.youtube.com/watch?v=f2ic2Rsc9pU&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=52", solution_link: "https://takeuforward.org/data-structure/print-all-permutations-of-a-string-array/" },
  { name: "N Queen", topic: "Recursion & Backtracking", difficulty: "Hard", problem_link: "https://leetcode.com/problems/n-queens/", video_link: "https://www.youtube.com/watch?v=i05Ju7AftcM&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=57", solution_link: "https://takeuforward.org/data-structure/n-queen-problem-return-all-distinct-solutions-to-the-n-queens-puzzle/" },
  { name: "Sudoku Solver", topic: "Recursion & Backtracking", difficulty: "Hard", problem_link: "https://leetcode.com/problems/sudoku-solver/", video_link: "https://www.youtube.com/watch?v=FWAIf_EVUKE&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=58", solution_link: "https://takeuforward.org/data-structure/sudoku-solver/" },
  { name: "M Coloring Problem", topic: "Recursion & Backtracking", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/m-coloring-problem", video_link: "https://www.youtube.com/watch?v=wuVwUK25Rfc&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=59", solution_link: "https://takeuforward.org/data-structure/m-coloring-problem/" },
  { name: "Rat in a Maze", topic: "Recursion & Backtracking", difficulty: "Hard", problem_link: "https://practice.geeksforgeeks.org/problems/rat-in-a-maze-problem-i/1", video_link: "https://www.youtube.com/watch?v=bLGZhJlt4y0&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=60", solution_link: "https://takeuforward.org/data-structure/rat-in-a-maze/" },
  { name: "Word Break (print all ways)", topic: "Recursion & Backtracking", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/word-break", video_link: "", solution_link: "" },
  { name: "The N-th root of an integer", topic: "Binary Search", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/find-nth-root-of-a-number", video_link: "https://www.youtube.com/watch?v=WjpswYrS2nY&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=62", solution_link: "https://takeuforward.org/data-structure/nth-root-of-a-number-using-binary-search/" },
  { name: "Matrix Median", topic: "Binary Search", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/matrix-median", video_link: "https://youtu.be/Q9wXgdxJq48?si=ScI_0uzJh7yg8nrX", solution_link: "https://takeuforward.org/data-structure/median-of-row-wise-sorted-matrix/" },
  { name: "Single element in sorted array", topic: "Binary Search", difficulty: "Medium", problem_link: "https://leetcode.com/problems/single-element-in-a-sorted-array/", video_link: "https://youtu.be/AZOmHuHadxQ", solution_link: "https://takeuforward.org/data-structure/search-single-element-in-a-sorted-array/" },
  { name: "Search element in a sorted and rotated array/ find pivot where it is rotated", topic: "Binary Search", difficulty: "Medium", problem_link: "https://leetcode.com/problems/search-in-rotated-sorted-array/", video_link: "https://www.youtube.com/watch?v=r3pMQ8-Ad5s&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=64", solution_link: "https://takeuforward.org/data-structure/search-element-in-a-rotated-sorted-array/" },
  { name: "Median of 2 sorted arrays", topic: "Binary Search", difficulty: "Hard", problem_link: "https://leetcode.com/problems/median-of-two-sorted-arrays/", video_link: "https://www.youtube.com/watch?v=NTop3VTjmxk&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=65", solution_link: "" },
  { name: "Kth element of 2 sorted arrays", topic: "Binary Search", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/kth-element-of-2-sorted-arrays", video_link: "https://www.youtube.com/watch?v=nv7F4PiLUzo&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=66", solution_link: "https://takeuforward.org/data-structure/k-th-element-of-two-sorted-arrays/" },
  { name: "Allocate Minimum Number of Pages", topic: "Binary Search", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/book-allocation-problem", video_link: "https://www.youtube.com/watch?v=gYmWHvRHu-s&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=69", solution_link: "https://takeuforward.org/data-structure/allocate-minimum-number-of-pages/" },
  { name: "Aggressive Cows", topic: "Binary Search", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/aggressive-cows", video_link: "https://youtu.be/R_Mfw4ew-Vo", solution_link: "https://takeuforward.org/data-structure/aggressive-cows-detailed-solution/" },
  { name: "Implement Max Heap", topic: "Heaps / Priority Queue", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/implement-max-heap", video_link: "", solution_link: "" },
  { name: "K-th Largest element in an array", topic: "Heaps / Priority Queue", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/k-th-largest-element-in-an-array", video_link: "", solution_link: "https://takeuforward.org/data-structure/kth-largest-smallest-element-in-an-array/" },
  { name: "Maximum Sum Combination", topic: "Heaps / Priority Queue", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/maximum-sum-combination", video_link: "", solution_link: "https://takeuforward.org/data-structure/maximum-sum-combination" },
  { name: "Find Median from Data Stream", topic: "Heaps / Priority Queue", difficulty: "Hard", problem_link: "https://leetcode.com/problems/find-median-from-data-stream/", video_link: "", solution_link: "https://takeuforward.org/data-structure/find-median-from-data-stream" },
  { name: "Merge K Sorted Arrays", topic: "Heaps / Priority Queue", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/merge-k-sorted-arrays", video_link: "", solution_link: "" },
  { name: "Top K Frequent Elements", topic: "Heaps / Priority Queue", difficulty: "Medium", problem_link: "https://leetcode.com/problems/top-k-frequent-elements/", video_link: "", solution_link: "https://takeuforward.org/data-structure/top-k-frequent-elements" },
  { name: "Implement Stack using Arrays", topic: "Stacks & Queues", difficulty: "Easy", problem_link: "https://takeuforward.org/plus/dsa/problems/implement-stack-using-arrays", video_link: "https://youtu.be/tqQ5fTamIN4?si=ofLt8Zt1ZvhikZ6w", solution_link: "https://takeuforward.org/data-structure/implement-stack-using-array/" },
  { name: "Implement Queue using Arrays", topic: "Stacks & Queues", difficulty: "Easy", problem_link: "https://takeuforward.org/plus/dsa/problems/implement-queue-using-arrays", video_link: "https://youtu.be/tqQ5fTamIN4?si=ofLt8Zt1ZvhikZ6w", solution_link: "https://takeuforward.org/data-structure/implement-queue-using-array/" },
  { name: "Implement Stack using Queue (using single queue)", topic: "Stacks & Queues", difficulty: "Easy", problem_link: "https://leetcode.com/problems/implement-stack-using-queues/", video_link: "https://youtu.be/tqQ5fTamIN4?si=ofLt8Zt1ZvhikZ6w", solution_link: "https://takeuforward.org/data-structure/implement-stack-using-single-queue" },
  { name: "Implement Queue using Stack", topic: "Stacks & Queues", difficulty: "Easy", problem_link: "https://leetcode.com/problems/implement-queue-using-stacks/", video_link: "https://youtu.be/tqQ5fTamIN4?si=ofLt8Zt1ZvhikZ6w", solution_link: "https://takeuforward.org/data-structure/implement-queue-using-stack/" },
  { name: "Balanced Paranthesis", topic: "Stacks & Queues", difficulty: "Easy", problem_link: "https://leetcode.com/problems/valid-parentheses/", video_link: "https://youtu.be/xwjS0iZhw4I?si=UoyKpFn4Q3nf5h2R", solution_link: "https://takeuforward.org/data-structure/check-for-balanced-parentheses/" },
  { name: "Next Greater Element", topic: "Stacks & Queues", difficulty: "Medium", problem_link: "https://leetcode.com/problems/next-greater-element-i/", video_link: "https://youtu.be/e7XQLtOQM3I?si=QdcHpTtx6gAHsext", solution_link: "https://takeuforward.org/data-structure/next-greater-element-using-stack/" },
  { name: "Sort a Stack", topic: "Stacks & Queues", difficulty: "Medium", problem_link: "https://www.codingninjas.com/studio/problems/sort-a-stack_985275", video_link: "", solution_link: "https://takeuforward.org/data-structure/sort-a-stack" },
  { name: "Next Smaller Element", topic: "Stacks & Queues", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/next-smaller-element", video_link: "", solution_link: "https://takeuforward.org/data-structure/next-smaller-element" },
  { name: "LRU Cache", topic: "Stacks & Queues", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/lru-cache", video_link: "", solution_link: "https://takeuforward.org/data-structure/program-for-least-recently-used-lru-page-replacement-algorithm" },
  { name: "LFU Cache", topic: "Stacks & Queues", difficulty: "Hard", problem_link: "https://leetcode.com/problems/lfu-cache/", video_link: "https://www.youtube.com/watch?v=0PSB9y8ehbk&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=79", solution_link: "https://takeuforward.org/data-structure/lfu-cache" },
  { name: "Largest rectangle in a histogram", topic: "Stacks & Queues", difficulty: "Hard", problem_link: "https://leetcode.com/problems/largest-rectangle-in-histogram/", video_link: "https://youtu.be/Bzat9vgD0fs?si=DiBlLejXcr6EJoyB", solution_link: "https://takeuforward.org/data-structure/area-of-largest-rectangle-in-histogram/" },
  { name: "Sliding Window Maximum", topic: "Stacks & Queues", difficulty: "Hard", problem_link: "https://leetcode.com/problems/sliding-window-maximum/", video_link: "https://youtu.be/NwBvene4Imo?si=eU1PY-bcQfk5wdog", solution_link: "https://takeuforward.org/data-structure/sliding-window-maximum/" },
  { name: "Implement Min Stack", topic: "Stacks & Queues", difficulty: "Hard", problem_link: "https://leetcode.com/problems/min-stack/", video_link: "https://youtu.be/NdDIaH91P0g?si=4_Jbsq5trFvfSdUY", solution_link: "https://takeuforward.org/data-structure/implement-min-stack-o2n-and-on-space-complexity/" },
  { name: "Rotten Oranges", topic: "Stacks & Queues", difficulty: "Medium", problem_link: "https://leetcode.com/problems/rotting-oranges/", video_link: "https://www.youtube.com/watch?v=yf3oUhkvqA0", solution_link: "https://takeuforward.org/data-structure/rotten-oranges-min-time-to-rot-all-oranges-bfs/" },
  { name: "Stock span problem", topic: "Stacks & Queues", difficulty: "Hard", problem_link: "https://leetcode.com/problems/online-stock-span/", video_link: "https://youtu.be/eay-zoSRkVc?si=deNNe5i38BOAntha", solution_link: "https://takeuforward.org/data-structure/stock-span-problem" },
  { name: "Maximum of Minimums for Every Window Size", topic: "Stacks & Queues", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/maximum-of-minimums-for-every-window-size", video_link: "", solution_link: "" },
  { name: "Celebrity Problem", topic: "Stacks & Queues", difficulty: "Hard", problem_link: "https://leetcode.com/accounts/login/?next=/problems/find-the-celebrity/", video_link: "https://youtu.be/cEadsbTeze4?si=olXYfOs7l-SEn2zl", solution_link: "https://takeuforward.org/data-structure/celebrity-problem" },
  { name: "Reverse every word in a string", topic: "Strings", difficulty: "Medium", problem_link: "https://leetcode.com/problems/reverse-words-in-a-string/", video_link: "", solution_link: "https://takeuforward.org/data-structure/reverse-words-in-a-string/" },
  { name: "Longest Palindrome in a string", topic: "Strings", difficulty: "Medium", problem_link: "https://leetcode.com/problems/longest-palindromic-substring/", video_link: "", solution_link: "" },
  { name: "Roman to Integer", topic: "Strings", difficulty: "Medium", problem_link: "https://leetcode.com/problems/roman-to-integer/", video_link: "", solution_link: "https://takeuforward.org/data-structure/roman-numerals-to-integer" },
  { name: "Implement ATOI/STRSTR", topic: "Strings", difficulty: "Medium", problem_link: "https://leetcode.com/problems/string-to-integer-atoi/", video_link: "", solution_link: "" },
  { name: "Longest Common Prefix", topic: "Strings", difficulty: "Easy", problem_link: "https://leetcode.com/problems/longest-common-prefix/", video_link: "", solution_link: "https://takeuforward.org/data-structure/longest-common-prefix" },
  { name: "Rabin Karp Algorithm", topic: "Strings", difficulty: "Hard", problem_link: "https://leetcode.com/problems/repeated-string-match/discuss/416144/Rabin-Karp-algorithm-C%2B%2B-implementation", video_link: "", solution_link: "" },
  { name: "Z function", topic: "Strings", difficulty: "Hard", problem_link: "$undefined", video_link: "", solution_link: "" },
  { name: "KMP Algorithm or LPS array", topic: "Strings", difficulty: "Hard", problem_link: "https://leetcode.com/problems/implement-strstr/", video_link: "", solution_link: "https://takeuforward.org/data-structure/kmp-algorithm-or-lps-array" },
  { name: "Minimum insertions to make string palindrome", topic: "Strings", difficulty: "Hard", problem_link: "https://leetcode.com/problems/minimum-insertion-steps-to-make-a-string-palindrome/", video_link: "https://www.youtube.com/watch?v=xPBLEj41rFU", solution_link: "https://takeuforward.org/data-structure/minimum-insertions-to-make-string-palindrome-dp-29/" },
  { name: "Valid Anagram", topic: "Strings", difficulty: "Easy", problem_link: "https://leetcode.com/problems/valid-anagram/#:~:text=Given%20two%20strings%20s%20and,the%20original%20letters%20exactly%20once.&text=Constraints%3A,.length%20%3C%3D%205%20*%2010", video_link: "", solution_link: "https://takeuforward.org/data-structure/check-if-two-strings-are-anagrams-of-each-other/" },
  { name: "Count and say", topic: "Strings", difficulty: "Hard", problem_link: "https://leetcode.com/problems/count-and-say/", video_link: "", solution_link: "https://takeuforward.org/data-structure/count-and-say" },
  { name: "Compare version numbers", topic: "Strings", difficulty: "Medium", problem_link: "https://leetcode.com/problems/compare-version-numbers/", video_link: "", solution_link: "" },
  { name: "Inorder Traversal", topic: "Trees & BST", difficulty: "Easy", problem_link: "https://leetcode.com/problems/binary-tree-inorder-traversal/", video_link: "https://youtu.be/lxTGsVXjwvM", solution_link: "https://takeuforward.org/data-structure/inorder-traversal-of-binary-tree/" },
  { name: "Preorder Traversal", topic: "Trees & BST", difficulty: "Easy", problem_link: "https://leetcode.com/problems/binary-tree-preorder-traversal/", video_link: "https://youtu.be/RlUu72JrOCQ", solution_link: "https://takeuforward.org/data-structure/preorder-traversal-of-binary-tree/" },
  { name: "Postorder Traversal", topic: "Trees & BST", difficulty: "Easy", problem_link: "https://leetcode.com/problems/binary-tree-postorder-traversal/", video_link: "https://youtu.be/2YBhNLodD8Q", solution_link: "https://takeuforward.org/data-structure/iterative-postorder-traversal-of-binary-tree-using-2-stack" },
  { name: "Morris Inorder Traversal ", topic: "Trees & BST", difficulty: "Hard", problem_link: "https://leetcode.com/problems/binary-tree-inorder-traversal/", video_link: "https://youtu.be/80Zug6D1_r4", solution_link: "https://takeuforward.org/data-structure/morris-inorder-traversal-of-a-binary-tree/" },
  { name: "Morris Preorder Traversal ", topic: "Trees & BST", difficulty: "Hard", problem_link: "https://leetcode.com/problems/binary-tree-inorder-traversal/", video_link: "https://youtu.be/80Zug6D1_r4", solution_link: "https://takeuforward.org/data-structure/morris-preorder-traversal-of-a-binary-tree/" },
  { name: "Right/Left View of BT", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/binary-tree-right-side-view/", video_link: "https://youtu.be/KV4mRzTjlAk", solution_link: "https://takeuforward.org/data-structure/right-left-view-of-binary-tree/" },
  { name: "Bottom view of BT", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/bottom-view-of-bt", video_link: "https://youtu.be/0FtVY6I4pB8", solution_link: "https://takeuforward.org/data-structure/bottom-view-of-a-binary-tree/" },
  { name: "Top View of BT", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/top-view-of-bt", video_link: "https://youtu.be/Et9OCDNvJ78", solution_link: "https://takeuforward.org/data-structure/top-view-of-a-binary-tree/" },
  { name: "Pre, Post, Inorder in one traversal", topic: "Trees & BST", difficulty: "Easy", problem_link: "https://takeuforward.org/plus/dsa/problems/pre,-post,-inorder-in-one-traversal", video_link: "https://youtu.be/ySp2epYvgTE", solution_link: "https://takeuforward.org/data-structure/preorder-inorder-postorder-traversals-in-one-traversal/" },
  { name: "Vertical Order Traversal", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/", video_link: "https://youtu.be/q_a6lpbKJdw", solution_link: "https://takeuforward.org/data-structure/vertical-order-traversal-of-binary-tree/" },
  { name: "Print root to leaf path in BT", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/print-root-to-note-path-in-bt", video_link: "https://youtu.be/fmflMqVOC7k", solution_link: "https://takeuforward.org/data-structure/print-root-to-node-path-in-a-binary-tree/" },
  { name: "Maximum Width of BT", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/maximum-width-of-binary-tree/", video_link: "https://youtu.be/ZbybYvcVLks", solution_link: "https://takeuforward.org/data-structure/maximum-width-of-a-binary-tree/" },
  { name: "Level Order Traversal", topic: "Trees & BST", difficulty: "Easy", problem_link: "https://leetcode.com/problems/binary-tree-level-order-traversal/", video_link: "https://youtu.be/EoAsWbO7sqg", solution_link: "https://takeuforward.org/data-structure/level-order-traversal-of-a-binary-tree/" },
  { name: "Maximum Depth in BT", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", video_link: "https://youtu.be/eD3tmO66aBA", solution_link: "https://takeuforward.org/data-structure/maximum-depth-of-a-binary-tree/" },
  { name: "Diameter of Binary Tree", topic: "Trees & BST", difficulty: "Easy", problem_link: "https://leetcode.com/problems/diameter-of-binary-tree/", video_link: "https://youtu.be/Rezetez59Nk", solution_link: "https://takeuforward.org/data-structure/calculate-the-diameter-of-a-binary-tree/" },
  { name: "Check for balanced binary tree", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/balanced-binary-tree/", video_link: "https://youtu.be/Yt50Jfbd8Po", solution_link: "https://takeuforward.org/data-structure/check-if-the-binary-tree-is-balanced-binary-tree/" },
  { name: "LCA in BT", topic: "Trees & BST", difficulty: "Hard", problem_link: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/", video_link: "https://youtu.be/_-QHfMDde90", solution_link: "https://takeuforward.org/data-structure/lowest-common-ancestor-for-two-given-nodes/" },
  { name: "Check if two trees are identical or not", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/same-tree/", video_link: "https://youtu.be/BhuvF_-PWS0", solution_link: "https://takeuforward.org/data-structure/check-if-two-trees-are-identical/" },
  { name: "Zig Zag or Spiral Traversal", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/", video_link: "https://youtu.be/3OXWEdlIGl4", solution_link: "https://takeuforward.org/data-structure/zig-zag-traversal-of-binary-tree/" },
  { name: "Boundary Traversal", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/boundary-of-binary-tree/", video_link: "https://youtu.be/0ca1nvR0be4", solution_link: "https://takeuforward.org/data-structure/boundary-traversal-of-a-binary-tree/" },
  { name: "Maximum path sum ", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/binary-tree-maximum-path-sum/", video_link: "https://youtu.be/WszrfSwMz58", solution_link: "https://takeuforward.org/data-structure/maximum-sum-path-in-binary-tree/" },
  { name: "Construct a BT from Preorder and Inorder", topic: "Trees & BST", difficulty: "Hard", problem_link: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/", video_link: "https://youtu.be/aZNaLrVebKQ", solution_link: "https://takeuforward.org/data-structure/construct-a-binary-tree-from-inorder-and-preorder-traversal/" },
  { name: "Construct a BT from Postorder and Inorder", topic: "Trees & BST", difficulty: "Hard", problem_link: "https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal/", video_link: "https://youtu.be/LgLRTaEMRVc", solution_link: "https://takeuforward.org/data-structure/construct-binary-tree-from-inorder-and-postorder-traversal/" },
  { name: "Symmetric Binary Tree", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/symmetric-tree/", video_link: "https://www.youtube.com/watch?v=nKggNAiEpBE", solution_link: "https://takeuforward.org/data-structure/check-for-symmetrical-binary-tree/" },
  { name: "Flatten Binary Tree to Linked List", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/flatten-binary-tree-to-linked-list/", video_link: "https://youtu.be/sWf7k1x9XR4", solution_link: "https://takeuforward.org/data-structure/flatten-binary-tree-to-linked-list/" },
  { name: "Check for symmetrical BTs", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/symmetric-tree/", video_link: "https://www.youtube.com/watch?v=nKggNAiEpBE", solution_link: "https://takeuforward.org/data-structure/check-for-symmetrical-binary-tree/" },
  { name: "Children Sum Property in Binary Tree", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/children-sum-property-in-binary-tree", video_link: "https://youtu.be/fnmisPM6cVo", solution_link: "https://takeuforward.org/data-structure/check-for-children-sum-property-in-a-binary-tree/" },
  { name: "Populating Next Right Pointers in Each Node", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/populating-next-right-pointers-in-each-node/", video_link: "", solution_link: "" },
  { name: "Search in BST", topic: "Trees & BST", difficulty: "Easy", problem_link: "https://leetcode.com/problems/search-in-a-binary-search-tree/", video_link: "https://youtu.be/KcNt6v_56cc", solution_link: "https://takeuforward.org/data-structure/search-in-a-binary-search-tree-2/" },
  { name: "Construct BST from given keys", topic: "Trees & BST", difficulty: "Easy", problem_link: "https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/", video_link: "", solution_link: "" },
  { name: "Construct a BST from a preorder traversal", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/construct-binary-search-tree-from-preorder-traversal/", video_link: "https://youtu.be/UmJT3j26t1I", solution_link: "" },
  { name: "Check if a tree is a BST or not", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/validate-binary-search-tree/", video_link: "https://youtu.be/f-sj7I5oXEI", solution_link: "" },
  { name: "LCA in BST", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", video_link: "https://youtu.be/cX_kPV_foZc", solution_link: "" },
  { name: "Inorder successor and predecessor in BST", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/inorder-successor-in-bst/", video_link: "https://youtu.be/SXKAD2svfmI", solution_link: "https://takeuforward.org/data-structure/inorder-successorpredecessor-in-bst" },
  { name: "Floor in a BST", topic: "Trees & BST", difficulty: "Easy", problem_link: "https://takeuforward.org/plus/dsa/problems/floor-and-ceil-in-a-bst", video_link: "https://www.youtube.com/watch?v=xm_W1ub-K-w&list=PLgUwDviBIf0q8Hkd7bK2Bpryj2xVJk8Vk&index=43", solution_link: "" },
  { name: "Ceil in a BST", topic: "Trees & BST", difficulty: "Easy", problem_link: "https://takeuforward.org/plus/dsa/problems/floor-and-ceil-in-a-bst", video_link: "https://www.youtube.com/watch?v=KSsk8AhdOZA&list=PLgUwDviBIf0q8Hkd7bK2Bpryj2xVJk8Vk&index=42", solution_link: "" },
  { name: "Find K-th smallest element in BST", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/", video_link: "https://youtu.be/9TJYWh0adfk", solution_link: "https://takeuforward.org/data-structure/kth-largest-smallest-element-in-binary-search-tree/" },
  { name: "Kth Smallest and Largest element in BST", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/", video_link: "https://youtu.be/9TJYWh0adfk", solution_link: "https://takeuforward.org/data-structure/kth-largest-smallest-element-in-binary-search-tree/" },
  { name: "Two sum in BST", topic: "Trees & BST", difficulty: "Hard", problem_link: "https://leetcode.com/problems/two-sum-iv-input-is-a-bst/", video_link: "https://youtu.be/ssL3sHwPeb4", solution_link: "https://takeuforward.org/data-structure/two-sum-in-bst-check-if-there-exists-a-pair-with-sum-k" },
  { name: "BST iterator", topic: "Trees & BST", difficulty: "Hard", problem_link: "https://leetcode.com/problems/binary-search-tree-iterator/", video_link: "https://youtu.be/D2jMcmxU4bs", solution_link: "https://takeuforward.org/data-structure/bst-iterator" },
  { name: "Size of the largest BST in a Binary Tree", topic: "Trees & BST", difficulty: "Hard", problem_link: "https://leetcode.com/problems/maximum-sum-bst-in-binary-tree/", video_link: "https://youtu.be/X0oXMdtUDwo", solution_link: "" },
  { name: "Serialize and De-serialize BT", topic: "Trees & BST", difficulty: "Hard", problem_link: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/", video_link: "https://youtu.be/-YbXySKJsX8", solution_link: "https://takeuforward.org/data-structure/serialize-and-deserialize-a-binary-tree/" },
  { name: "Binary Tree to Doubly Linked List", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/flatten-binary-tree-to-linked-list/", video_link: "https://www.youtube.com/watch?v=sWf7k1x9XR4&list=PLgUwDviBIf0q8Hkd7bK2Bpryj2xVJk8Vk&index=39", solution_link: "" },
  { name: "Find Median in a Stream", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/find-median-from-data-stream/", video_link: "", solution_link: "" },
  { name: "Kth largest element in a stream of running integers", topic: "Trees & BST", difficulty: "Hard", problem_link: "https://leetcode.com/problems/kth-largest-element-in-a-stream/#:~:text=Implement%20KthLargest%20class%3A,largest%20element%20in%20the%20stream.", video_link: "", solution_link: "https://takeuforward.org/data-structure/kth-largest-element-in-a-stream-of-running-integers" },
  { name: "Distinct Numbers in Each Subarray", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/distinct-numbers-in-each-subarray", video_link: "", solution_link: "" },
  { name: "K-th largest element in an unsorted array.", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/kth-largest-element-in-an-array/", video_link: "", solution_link: "" },
  { name: "Flood-fill Algorithm", topic: "Trees & BST", difficulty: "Medium", problem_link: "https://leetcode.com/problems/flood-fill/", video_link: "", solution_link: "" },
  { name: "Clone Graph", topic: "Graphs", difficulty: "Medium", problem_link: "https://leetcode.com/problems/clone-graph/", video_link: "", solution_link: "" },
  { name: "DFS", topic: "Graphs", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/traversal-techniques", video_link: "https://youtu.be/Qzf1a--rhp8", solution_link: "https://takeuforward.org/data-structure/depth-first-search-dfs/" },
  { name: "Traversal Techniques", topic: "Graphs", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/traversal-techniques", video_link: "https://youtu.be/Qzf1a--rhp8", solution_link: "https://takeuforward.org/data-structure/depth-first-search-dfs/" },
  { name: "Detect A cycle in Undirected Graph using BFS", topic: "Graphs", difficulty: "Hard", problem_link: "https://leetcode.com/problems/course-schedule/", video_link: "https://youtu.be/BPlrALf1LDU", solution_link: "https://takeuforward.org/data-structure/detect-cycle-in-an-undirected-graph-using-bfs/" },
  { name: "Detect A cycle in Undirected Graph using DFS", topic: "Graphs", difficulty: "Hard", problem_link: "https://leetcode.com/problems/course-schedule/", video_link: "https://youtu.be/zQ3zgFypzX4", solution_link: "https://takeuforward.org/data-structure/detect-cycle-in-an-undirected-graph-using-dfs/" },
  { name: "Detect A cycle in a Directed Graph using DFS", topic: "Graphs", difficulty: "Hard", problem_link: "https://leetcode.com/problems/course-schedule/", video_link: "https://www.youtube.com/watch?v=uzVUw90ZFIg&list=PLgUwDviBIf0rGEWe64KWas0Nryn7SCRWw&index=12", solution_link: "https://takeuforward.org/data-structure/detect-a-cycle-in-directed-graph-topological-sort-kahns-algorithm-g-23/" },
  { name: "Detect A cycle in a Directed Graph using BFS", topic: "Graphs", difficulty: "Hard", problem_link: "https://leetcode.com/problems/course-schedule/", video_link: "https://www.youtube.com/watch?v=iTBaI90lpDQ&list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn&index=23", solution_link: "" },
  { name: "Topological Sort BFS", topic: "Graphs", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/topological-sort-or-kahns-algorithm", video_link: "https://www.youtube.com/watch?v=73sneFXuTEg&list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn&index=22", solution_link: "https://takeuforward.org/data-structure/topological-sort-bfs/" },
  { name: "Topological Sort DFS", topic: "Graphs", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/topological-sort-or-kahns-algorithm", video_link: "https://www.youtube.com/watch?v=5lZ0iJMrUMk&list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn&index=22", solution_link: "https://takeuforward.org/data-structure/topological-sort-using-dfs/" },
  { name: "Number of islands(Do in Grid and Graph Both)", topic: "Graphs", difficulty: "Medium", problem_link: "https://leetcode.com/problems/number-of-islands/", video_link: "https://www.youtube.com/watch?v=muncqlKJrH0&list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn&index=8", solution_link: "https://takeuforward.org/data-structure/number-of-distinct-islands/" },
  { name: "Bipartite graph", topic: "Graphs", difficulty: "Hard", problem_link: "https://leetcode.com/problems/is-graph-bipartite/", video_link: "https://youtu.be/KG5YFfR0j8A", solution_link: "https://takeuforward.org/graph/bipartite-graph-dfs-implementation/" },
  { name: "Bipartite Check using DFS", topic: "Graphs", difficulty: "Hard", problem_link: "https://leetcode.com/problems/is-graph-bipartite/", video_link: "https://www.youtube.com/watch?v=KG5YFfR0j8A&list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn&index=18", solution_link: "https://takeuforward.org/graph/bipartite-graph-dfs-implementation/" },
  { name: "Strongly Connected Component(using KosaRaju\u0393\u00c7\u00d6s algo)", topic: "Graphs", difficulty: "Hard", problem_link: "https://leetcode.com/problems/maximum-number-of-non-overlapping-substrings/discuss/766485/kosaraju-algorithm-on", video_link: "https://www.youtube.com/watch?v=V8qIqJxCioo&list=PLgUwDviBIf0rGEWe64KWas0Nryn7SCRWw&index=27", solution_link: "https://takeuforward.org/graph/strongly-connected-components-kosarajus-algorithm-g-54/" },
  { name: "Dijkstra's algorithm", topic: "Graphs", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/dijkstra's-algorithm", video_link: "https://www.youtube.com/watch?v=rp1SMw7HSO8&list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn&index=35", solution_link: "https://takeuforward.org/data-structure/dijkstras-algorithm-using-priority-queue-g-32/" },
  { name: "Bellman ford algorithm", topic: "Graphs", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/bellman-ford-algorithm", video_link: "https://youtu.be/0vVofAhAYjc", solution_link: "https://takeuforward.org/data-structure/bellman-ford-algorithm-g-41/" },
  { name: "Floyd Warshall Algorithm", topic: "Graphs", difficulty: "Hard", problem_link: "https://practice.geeksforgeeks.org/problems/implementing-floyd-warshall2042/1", video_link: "https://www.youtube.com/watch?v=YbY8cVwWAvw&list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn&index=42", solution_link: "https://takeuforward.org/data-structure/floyd-warshall-algorithm-g-42/" },
  { name: "MST using Prim's Algo", topic: "Graphs", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/find-the-mst-weight", video_link: "https://www.youtube.com/watch?v=mJcZjjKzeqk&list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn&index=44", solution_link: "https://takeuforward.org/data-structure/prims-algorithm-minimum-spanning-tree-c-and-java-g-45/" },
  { name: "MST using Kruskal\u0393\u00c7\u00d6s Algo", topic: "Graphs", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/find-the-mst-weight", video_link: "https://www.youtube.com/watch?v=1KRmCzBl_mQ&list=PLgUwDviBIf0rGEWe64KWas0Nryn7SCRWw&index=24", solution_link: "https://takeuforward.org/data-structure/kruskals-algorithm-minimum-spanning-tree-g-47/" },
  { name: "Max Product Subarray", topic: "Dynamic Programming", difficulty: "Hard", problem_link: "https://leetcode.com/problems/maximum-product-subarray/", video_link: "", solution_link: "https://takeuforward.org/data-structure/maximum-product-subarray-in-an-array/" },
  { name: "Longest Increasing Subsequence", topic: "Dynamic Programming", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/longest-increasing-subsequence", video_link: "https://youtu.be/on2hvxBXJH4", solution_link: "https://takeuforward.org/data-structure/longest-increasing-subsequence-binary-search-dp-43/" },
  { name: "Longest common subsequence", topic: "Dynamic Programming", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/longest-common-subsequence", video_link: "https://youtu.be/-zI4mrF2Pb4", solution_link: "https://takeuforward.org/data-structure/print-longest-common-subsequence-dp-26/" },
  { name: "0 and 1 Knapsack", topic: "Dynamic Programming", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/0-and-1-knapsack", video_link: "https://youtu.be/GqOmJHQZivw", solution_link: "https://takeuforward.org/data-structure/0-1-knapsack-dp-19/" },
  { name: "Edit distance", topic: "Dynamic Programming", difficulty: "Hard", problem_link: "https://leetcode.com/problems/edit-distance/", video_link: "https://youtu.be/fJaKO8FbDdo", solution_link: "https://takeuforward.org/data-structure/edit-distance-dp-33/" },
  { name: "Maximum Sum Increasing Subsequence", topic: "Dynamic Programming", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/maximum-sum-increasing-subsequence", video_link: "", solution_link: "" },
  { name: "Matrix chain multiplication", topic: "Dynamic Programming", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/matrix-chain-multiplication", video_link: "https://youtu.be/vRVfmbCFW7Y", solution_link: "https://takeuforward.org/dynamic-programming/matrix-chain-multiplication-dp-48/" },
  { name: "Minimum sum path in the matrix, (count paths and similar type do, also backtrack to find the Minimum path)", topic: "Dynamic Programming", difficulty: "Medium", problem_link: "https://leetcode.com/problems/minimum-path-sum/", video_link: "https://youtu.be/_rgTlyky1uQ", solution_link: "https://takeuforward.org/data-structure/minimum-path-sum-in-a-grid-dp-10/" },
  { name: "Coin change II", topic: "Dynamic Programming", difficulty: "Hard", problem_link: "https://leetcode.com/problems/coin-change-2/", video_link: "https://www.youtube.com/watch?v=HgyouUi11zk", solution_link: "https://takeuforward.org/data-structure/coin-change-2-dp-22/" },
  { name: "Subset sum equals to target", topic: "Dynamic Programming", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/subset-sum-equals-to-target", video_link: "https://www.youtube.com/watch?v=rYkfBRtMJr8&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=52", solution_link: "https://takeuforward.org/data-structure/subset-sum-sum-of-all-subsets/" },
  { name: "Rod cutting problem", topic: "Dynamic Programming", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/rod-cutting-problem", video_link: "https://youtu.be/mO8XpGoJwuo", solution_link: "https://takeuforward.org/data-structure/rod-cutting-problem-dp-24/" },
  { name: "Super Egg Drop", topic: "Dynamic Programming", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/super-egg-drop", video_link: "", solution_link: "" },
  { name: "Word Break", topic: "Dynamic Programming", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/word-break", video_link: "", solution_link: "" },
  { name: "Palindrome Partitioning (MCM Variation)", topic: "Dynamic Programming", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/palindrome-partitioning", video_link: "https://youtu.be/_H8V5hJUGd0", solution_link: "" },
  { name: "Maximum Profit in Job Scheduling", topic: "Dynamic Programming", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/maximum-profit-in-job-scheduling", video_link: "", solution_link: "" },
  { name: "Trie Implementation and Operations", topic: "Trie", difficulty: "Hard", problem_link: "https://leetcode.com/problems/implement-trie-prefix-tree/", video_link: "https://www.youtube.com/watch?v=dBGUmUQhjaM&list=PLgUwDviBIf0pcIDCZnxhv0LkHf5KzG9zp", solution_link: "https://takeuforward.org/data-structure/implement-trie-1/" },
  { name: "Trie Implementation and Advanced Operations", topic: "Trie", difficulty: "Hard", problem_link: "https://takeuforward.org/plus/dsa/problems/trie-implementation-and-advanced-operations", video_link: "", solution_link: "https://takeuforward.org/data-structure/implement-trie-ii/" },
  { name: "Longest Word with All Prefixes", topic: "Trie", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/longest-word-with-all-prefixes", video_link: "https://www.youtube.com/watch?v=AWnBa91lThI&list=PLgUwDviBIf0pcIDCZnxhv0LkHf5KzG9zp&index=3", solution_link: "" },
  { name: "Number of distinct substrings in a string", topic: "Trie", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/number-of-distinct-substrings-in-a-string", video_link: "https://www.youtube.com/watch?v=RV0QeTyHZxo&list=PLgUwDviBIf0pcIDCZnxhv0LkHf5KzG9zp&index=4", solution_link: "https://takeuforward.org/data-structure/number-of-distinct-substrings-in-a-string-using-trie/" },
  { name: "Power Set (this is very important)", topic: "Trie", difficulty: "Medium", problem_link: "https://takeuforward.org/plus/dsa/problems/power-set", video_link: "https://www.youtube.com/watch?v=b7AYbpM5YrE&list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma&index=67", solution_link: "https://takeuforward.org/data-structure/power-set-print-all-the-possible-subsequences-of-the-string/" },
  { name: "Maximum XOR of two numbers in an array", topic: "Trie", difficulty: "Hard", problem_link: "https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/", video_link: "https://www.youtube.com/watch?v=EIhAwfHubE8&list=PLgUwDviBIf0pcIDCZnxhv0LkHf5KzG9zp&index=6", solution_link: "https://takeuforward.org/data-structure/maximum-xor-of-two-numbers-in-an-array/" },
  { name: "Maximum Xor with an element from an array", topic: "Trie", difficulty: "Hard", problem_link: "https://leetcode.com/problems/maximum-xor-with-an-element-from-array/", video_link: "https://www.youtube.com/watch?v=Q8LhG9Pi5KM&list=PLgUwDviBIf0pcIDCZnxhv0LkHf5KzG9zp&index=7", solution_link: "https://takeuforward.org/trie/maximum-xor-queries-trie/" }
];

export default function DsaTracker() {
  const { user } = useAuth();
  const [problems, setProblems] = useState<DsaProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterTopic, setFilterTopic] = useState<string>('All');
  const [filterOpen, setFilterOpen] = useState(false);
  
  // SDE Sheet tab states
  const [activeTab, setActiveTab] = useState<'my-tracker' | 'striver-sheet'>('my-tracker');

  // Spaced Repetition states
  const [activeProblemId, setActiveProblemId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Record<string, DsaAttempt[]>>({});
  const [loadingAttempts, setLoadingAttempts] = useState<Record<string, boolean>>({});
  const [judgingId, setJudgingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from('dsa_tracker')
        .select('id, user_id, problem_name, topic, difficulty, status, solution_link, problem_link, reattempt_at, reattempt_days, ai_judgment, email_sent, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      setProblems((data as DsaProblem[]) ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  // Send email alerts for any reattempts that are due but have not been sent yet
  useEffect(() => {
    async function sendDueEmails() {
      if (!user?.email || problems.length === 0) return;
      
      const dueUnsent = problems.filter((p) => {
        if (!p.reattempt_at || p.email_sent) return false;
        return new Date(p.reattempt_at) <= new Date();
      });

      if (dueUnsent.length === 0) return;

      for (const p of dueUnsent) {
        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dsa-reminder`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              email: user.email,
              problemName: p.problem_name,
              topic: p.topic,
              scheduledAt: null, // Send immediately
            }),
          });

          if (res.ok) {
            await supabase
              .from('dsa_tracker')
              .update({ email_sent: true, updated_at: new Date().toISOString() })
              .eq('id', p.id);
              
            setProblems((prev) =>
              prev.map((item) => (item.id === p.id ? { ...item, email_sent: true } : item))
            );
          }
        } catch (e) {
          console.error("Failed to send immediate email reminder:", e);
        }
      }
    }

    sendDueEmails();
  }, [user, problems]);

  async function syncOverallMetrics(currentProblems: DsaProblem[]) {
    if (!user) return;
    const solvedCount = currentProblems.filter((p) => p.status === 'Solved').length;
    await supabase
      .from('student_metrics')
      .upsert(
        { user_id: user.id, dsa_solved: solvedCount, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
  }

  async function toggleExpand(problemId: string) {
    if (activeProblemId === problemId) {
      setActiveProblemId(null);
      return;
    }
    setActiveProblemId(problemId);

    if (!attempts[problemId]) {
      setLoadingAttempts((prev) => ({ ...prev, [problemId]: true }));
      const { data } = await supabase
        .from('dsa_attempts')
        .select('*')
        .eq('problem_id', problemId)
        .order('created_at', { ascending: true });
      
      setAttempts((prev) => ({ ...prev, [problemId]: (data as DsaAttempt[]) ?? [] }));
      setLoadingAttempts((prev) => ({ ...prev, [problemId]: false }));
    }
  }

  async function addAttempt(problemId: string, att: {
    approach_name: string; time_complexity: string; space_complexity: string; code_snippet: string; notes: string;
  }) {
    if (!user) return;
    const payload = {
      problem_id: problemId,
      user_id: user.id,
      approach_name: att.approach_name.trim(),
      time_complexity: att.time_complexity.trim(),
      space_complexity: att.space_complexity.trim(),
      code_snippet: att.code_snippet.trim() || null,
      notes: att.notes.trim() || null,
    };

    const { data } = await supabase
      .from('dsa_attempts')
      .insert(payload)
      .select('*')
      .maybeSingle();

    if (data) {
      setAttempts((prev) => ({
        ...prev,
        [problemId]: [...(prev[problemId] ?? []), data as DsaAttempt],
      }));
    }
  }

  async function runJudge(problem: DsaProblem) {
    if (!user) return;
    const problemId = problem.id;
    const problemAttempts = attempts[problemId] ?? [];
    if (problemAttempts.length < 2) return;

    setJudgingId(problemId);
    try {
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'judge_dsa_attempts',
          problemName: problem.problem_name,
          attempts: problemAttempts,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Judge request failed');
      }

      const judgmentResult = data.result;

      setProblems((prev) => prev.map((p) => p.id === problemId ? { ...p, ai_judgment: judgmentResult } : p));
      
      await supabase
        .from('dsa_tracker')
        .update({ ai_judgment: judgmentResult, updated_at: new Date().toISOString() })
        .eq('id', problemId);

    } catch (err) {
      alert(err instanceof Error ? err.message : 'AI judging failed');
    } finally {
      setJudgingId(null);
    }
  }

  async function addProblem(p: {
    problem_name: string; topic: string; difficulty: Difficulty; solution_link: string; problem_link: string;
  }) {
    if (!user) return;
    const payload = {
      user_id: user.id,
      problem_name: p.problem_name.trim(),
      topic: p.topic,
      difficulty: p.difficulty,
      solution_link: p.solution_link.trim() || null,
      problem_link: p.problem_link.trim() || null,
    };
    const { data } = await supabase
      .from('dsa_tracker')
      .insert(payload)
      .select('id, user_id, problem_name, topic, difficulty, status, solution_link, problem_link, reattempt_at, reattempt_days, ai_judgment, updated_at')
      .maybeSingle();
    if (data) {
      const updatedList = [data as DsaProblem, ...problems];
      setProblems(updatedList);
      await syncOverallMetrics(updatedList);
    }
    setShowAdd(false);
  }

  async function cycleStatus(id: string, current: DsaStatus) {
    const next = NEXT_STATUS[current];
    const updatedList = problems.map((p) => (p.id === id ? { ...p, status: next } : p));
    setProblems(updatedList);
    await supabase
      .from('dsa_tracker')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', id);
    await syncOverallMetrics(updatedList);
  }

  async function saveLink(id: string, link: string) {
    setProblems((prev) => prev.map((p) => (p.id === id ? { ...p, solution_link: link || null } : p)));
    await supabase
      .from('dsa_tracker')
      .update({ solution_link: link || null, updated_at: new Date().toISOString() })
      .eq('id', id);
  }

  async function scheduleReattempt(id: string, days: number | null) {
    let reattemptAt: string | null = null;
    if (days !== null) {
      const date = new Date();
      date.setDate(date.getDate() + days);
      reattemptAt = date.toISOString();
    }

    const updated = problems.map((p) => (p.id === id ? { ...p, reattempt_at: reattemptAt, reattempt_days: days, email_sent: false } : p));
    setProblems(updated);
    await supabase
      .from('dsa_tracker')
      .update({ reattempt_at: reattemptAt, reattempt_days: days, email_sent: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    // Call Edge Function to schedule the email reminder
    if (days !== null && user?.email) {
      const targetProblem = problems.find(p => p.id === id);
      if (targetProblem) {
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dsa-reminder`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              email: user.email,
              problemName: targetProblem.problem_name,
              topic: targetProblem.topic,
              scheduledAt: reattemptAt,
            }),
          });
        } catch (e) {
          console.error("Failed to schedule email reminder:", e);
        }
      }
    }
  }

  async function deleteProblem(id: string) {
    const updatedList = problems.filter((p) => p.id !== id);
    setProblems(updatedList);
    await supabase.from('dsa_tracker').delete().eq('id', id);
    await syncOverallMetrics(updatedList);
  }

  async function resetStriverSheet() {
    if (!user) return;
    const striverNames = new Set(STRIVER_SHEET_PROBLEMS.map(p => p.name.toLowerCase()));
    const problemsToDelete = problems.filter(p => striverNames.has(p.problem_name.toLowerCase()));
    
    if (problemsToDelete.length === 0) {
      alert("No Striver SDE Sheet problems have been tracked yet.");
      return;
    }

    const confirmReset = window.confirm(
      `Are you sure you want to reset your Striver SDE Sheet progress?\n\nThis will delete all ${problemsToDelete.length} tracked SDE problems and their attempts, allowing you to start fresh.`
    );
    if (!confirmReset) return;

    const idsToDelete = problemsToDelete.map(p => p.id);
    
    // Delete in Supabase
    const { error } = await supabase
      .from('dsa_tracker')
      .delete()
      .in('id', idsToDelete);

    if (error) {
      alert("Failed to reset progress: " + error.message);
      return;
    }

    // Update local state
    const updatedList = problems.filter(p => !idsToDelete.includes(p.id));
    setProblems(updatedList);
    await syncOverallMetrics(updatedList);
    
    // Clear attempts cache
    setAttempts(prev => {
      const copy = { ...prev };
      idsToDelete.forEach(id => {
        delete copy[id];
      });
      return copy;
    });

    alert("Striver SDE Sheet progress successfully reset!");
  }

  const solved = problems.filter((p) => p.status === 'Solved').length;
  const pct = problems.length > 0 ? Math.round((solved / problems.length) * 100) : 0;

  // Find reattempts due today
  const dueProblems = problems.filter((p) => {
    if (!p.reattempt_at) return false;
    return new Date(p.reattempt_at) <= new Date();
  });

  const customTopics = problems
    .map((p) => p.topic)
    .filter((t) => !TOPIC_SET.has(t))
    .filter((t, i, arr) => arr.indexOf(t) === i);
  const allFilterTopics = [...TOPICS, ...customTopics];

  const topicCount = (t: string) => {
    if (activeTab === 'my-tracker') {
      return problems.filter((p) => p.topic === t).length;
    } else {
      return STRIVER_SHEET_PROBLEMS.filter((sp) => sp.topic === t).length;
    }
  };

  const filteredProblems =
    filterTopic === 'All'
      ? problems
      : problems.filter((p) => p.topic === filterTopic);

  const filteredStriverProblems = STRIVER_SHEET_PROBLEMS.filter((sp) => {
    const matchTopic = filterTopic === 'All' || sp.topic === filterTopic;
    return matchTopic;
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">DSA Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Track problems by topic, log multiple solution attempts, and run AI performance judgments.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-ink-900 border border-ink-800 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('my-tracker')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'my-tracker'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> My Tracker
          </button>
          <button
            onClick={() => setActiveTab('striver-sheet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'striver-sheet'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Striver SDE Sheet
          </button>
        </div>
      </div>

      <DailyProblemsWidget
        problems={problems}
        onProblemSolved={setProblems}
        syncOverallMetrics={syncOverallMetrics}
      />

      <section className="glass rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-ink-800/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {activeTab === 'my-tracker' ? 'Problem Checklist' : 'Striver SDE Sheet'}
              </h2>
              <p className="text-sm text-slate-505">
                {activeTab === 'my-tracker'
                  ? 'Log attempts to unlock visual optimization comparisons'
                  : 'Pre-curated sheet by Striver containing top interview questions'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 self-end sm:self-auto">
            {activeTab === 'my-tracker' ? (
              <ProgressRing pct={pct} solved={solved} total={problems.length} />
            ) : (
              <ProgressRing
                pct={Math.round((problems.filter(p => p.status === 'Solved' && STRIVER_SHEET_PROBLEMS.some(s => s.name.toLowerCase() === p.problem_name.toLowerCase())).length / STRIVER_SHEET_PROBLEMS.length) * 100)}
                solved={problems.filter(p => p.status === 'Solved' && STRIVER_SHEET_PROBLEMS.some(s => s.name.toLowerCase() === p.problem_name.toLowerCase())).length}
                total={STRIVER_SHEET_PROBLEMS.length}
              />
            )}
            
            {activeTab === 'my-tracker' && (
              <button
                onClick={() => setShowAdd((s) => !s)}
                className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Problem
              </button>
            )}

            {activeTab === 'striver-sheet' && (
              <button
                onClick={resetStriverSheet}
                className="flex items-center gap-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-xs font-bold px-3.5 py-2 rounded-lg transition-colors shrink-0"
              >
                Reset Sheet
              </button>
            )}
          </div>
        </div>

        {/* Spaced Repetition Alert Banner */}
        {activeTab === 'my-tracker' && dueProblems.length > 0 && (
          <div className="mb-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-300 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Spaced Repetition Alert
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-500/25 text-indigo-200 rounded-md">
                  {dueProblems.length} {dueProblems.length === 1 ? 'Problem' : 'Problems'} Due
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You scheduled these problems for reattempt to solidify your understanding. Click a card to mark it Unsolved & restart:
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {dueProblems.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      cycleStatus(p.id, 'Solved'); // resets back to Unsolved
                      scheduleReattempt(p.id, null);
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 transition-all flex items-center gap-1"
                  >
                    <span>{p.problem_name}</span>
                    <span className="text-[10px] text-indigo-400 font-medium">({p.topic})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* View filter dropdown */}
        <div className="relative mb-4">
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className="flex items-center gap-2 bg-ink-800 hover:bg-ink-700 text-slate-300 text-sm font-medium px-3.5 py-2 rounded-lg border border-ink-700 transition-colors w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              {filterTopic === 'All' ? 'All Topics' : filterTopic}
              <span className="text-xs text-slate-505">
                ({filterTopic === 'All'
                  ? (activeTab === 'my-tracker' ? problems.length : STRIVER_SHEET_PROBLEMS.length)
                  : topicCount(filterTopic)})
              </span>
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>
          {filterOpen && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-ink-800 border border-ink-700 rounded-lg shadow-xl py-1 max-h-72 overflow-y-auto font-sans animate-fadeIn">
              <FilterOption
                label="All Topics"
                count={activeTab === 'my-tracker' ? problems.length : STRIVER_SHEET_PROBLEMS.length}
                active={filterTopic === 'All'}
                onClick={() => { setFilterTopic('All'); setFilterOpen(false); }}
              />
              <div className="my-1 border-t border-ink-700/60" />
              {allFilterTopics.map((t) => (
                <FilterOption
                  key={t}
                  label={t}
                  count={topicCount(t)}
                  active={filterTopic === t}
                  onClick={() => { setFilterTopic(t); setFilterOpen(false); }}
                />
              ))}
            </div>
          )}
        </div>

        {showAdd && activeTab === 'my-tracker' && (
          <AddProblemForm
            defaultTopic={filterTopic !== 'All' ? filterTopic : undefined}
            onSubmit={addProblem}
            onCancel={() => setShowAdd(false)}
          />
        )}

        {/* MY TRACKER VIEW */}
        {activeTab === 'my-tracker' && (
          loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">
                {filterTopic === 'All'
                  ? 'No problems yet. Click "Add Problem" or import from Striver SDE Sheet to start tracking.'
                  : `No problems in ${filterTopic} yet.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProblems.map((p) => {
                const isExpanded = activeProblemId === p.id;
                return (
                  <div key={p.id} className={`rounded-xl border border-ink-700/35 bg-ink-950/20 relative z-10 hover:z-20 focus-within:z-30 ${isExpanded ? 'z-20' : ''}`}>
                    <DsaRow
                       problem={p}
                       showTopic={filterTopic === 'All' || customTopics.length > 0}
                       onCycle={() => cycleStatus(p.id, p.status)}
                       onSaveLink={(link) => saveLink(p.id, link)}
                       onScheduleReattempt={(days) => scheduleReattempt(p.id, days)}
                       onDelete={() => deleteProblem(p.id)}
                       onExpand={() => toggleExpand(p.id)}
                    />
                    {isExpanded && (
                      <DsaAttemptsDrawer
                        attempts={attempts[p.id] ?? []}
                        loading={loadingAttempts[p.id] ?? false}
                        judging={judgingId === p.id}
                        onAddAttempt={(att) => addAttempt(p.id, att)}
                        onRunJudge={() => runJudge(p)}
                        aiJudgment={p.ai_judgment}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* STRIVER SDE SHEET VIEW */}
        {activeTab === 'striver-sheet' && (
          filteredStriverProblems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-505">No questions found in this category.</p>
            </div>
          ) : (
            <div className="space-y-2.5 animate-fadeIn">
              {filteredStriverProblems.map((sp, index) => {
                // Find if this problem has been added to tracker
                const tracked = problems.find(p => p.problem_name.toLowerCase() === sp.name.toLowerCase());
                const isExpanded = tracked ? activeProblemId === tracked.id : false;

                return (
                  <div key={index} className={`rounded-xl border border-ink-700/30 bg-ink-950/10 relative z-10 hover:z-20 focus-within:z-30 ${isExpanded ? 'z-20' : ''}`}>
                    {tracked ? (
                      <DsaRow
                         problem={tracked}
                         showTopic={filterTopic === 'All' || customTopics.length > 0}
                         onCycle={() => cycleStatus(tracked.id, tracked.status)}
                         onSaveLink={(link) => saveLink(tracked.id, link)}
                         onScheduleReattempt={(days) => scheduleReattempt(tracked.id, days)}
                         onDelete={() => deleteProblem(tracked.id)}
                         onExpand={() => toggleExpand(tracked.id)}
                      />
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-ink-800/20 hover:bg-ink-800/30 transition-colors rounded-xl">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Circle className="w-4 h-4 text-slate-650 shrink-0 select-none" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate text-white">
                              {sp.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${DIFF_META[sp.difficulty]}`}>
                                {sp.difficulty}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-300 uppercase tracking-wider">
                                {sp.topic}
                              </span>
                              <a
                                href={sp.problem_link}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 truncate max-w-[140px] font-medium"
                              >
                                <ExternalLink className="w-3 h-3" /> Practice Link
                              </a>
                              {sp.video_link && (
                                <a
                                  href={sp.video_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-[11px] text-rose-455 hover:text-rose-355 shrink-0 font-medium"
                                >
                                  <Play className="w-3 h-3 text-rose-500 fill-rose-500/20" /> Video
                                </a>
                              )}
                              {sp.solution_link && (
                                <a
                                  href={sp.solution_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-[11px] text-emerald-455 hover:text-emerald-355 shrink-0 font-medium"
                                >
                                  <BookOpen className="w-3 h-3 text-emerald-500" /> Striver Solution
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 ml-7 sm:ml-4">
                          <button
                            onClick={() => addProblem({
                              problem_name: sp.name,
                              topic: sp.topic,
                              difficulty: sp.difficulty,
                              solution_link: '',
                              problem_link: sp.problem_link
                            })}
                            className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" /> Track Progress
                          </button>
                        </div>
                      </div>
                    )}

                    {isExpanded && tracked && (
                      <div className="border-t border-ink-800 bg-ink-950/20">
                        <DsaAttemptsDrawer
                          attempts={attempts[tracked.id] ?? []}
                          loading={loadingAttempts[tracked.id] ?? false}
                          judging={judgingId === tracked.id}
                          onAddAttempt={(att) => addAttempt(tracked.id, att)}
                          onRunJudge={() => runJudge(tracked)}
                          aiJudgment={tracked.ai_judgment}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </section>
    </div>
  );
}

function FilterOption({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-ink-700 transition-colors ${
        active ? 'text-brand-300 font-medium' : 'text-slate-300'
      }`}
    >
      <span>{label}</span>
      <span className="text-xs text-slate-500 bg-ink-850 px-1.5 py-0.5 rounded">{count}</span>
    </button>
  );
}

function ProgressRing({ pct, solved, total }: { pct: number; solved: number; total: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="3.5" className="text-ink-700" />
          <circle
            cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="3.5"
            className="text-brand-500 transition-all duration-500"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
          {total === 0 ? '–' : `${pct}%`}
        </span>
      </div>
      <div className="text-xs text-slate-505 leading-tight select-none">
        <p className="text-white font-semibold">{solved}/{total}</p>
        <p>solved</p>
      </div>
    </div>
  );
}

function DsaRow({
  problem, showTopic, onCycle, onSaveLink, onScheduleReattempt, onDelete, onExpand,
}: {
  problem: DsaProblem;
  showTopic: boolean;
  onCycle: () => void;
  onSaveLink: (link: string) => void;
  onScheduleReattempt: (days: number | null) => void;
  onDelete: () => void;
  onExpand: () => void;
}) {
  const [editingLink, setEditingLink] = useState(false);
  const [linkDraft, setLinkDraft] = useState('');
  const [schedulerOpen, setSchedulerOpen] = useState(false);

  const sdeMatch = STRIVER_SHEET_PROBLEMS.find(
    (s) => s.name.toLowerCase() === problem.problem_name.toLowerCase()
  );

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setLinkDraft(problem.solution_link ?? '');
    setEditingLink(true);
  }

  function saveLink(e: React.MouseEvent) {
    e.stopPropagation();
    onSaveLink(linkDraft);
    setEditingLink(false);
  }

  let reattemptText = '';
  let isDue = false;
  if (problem.reattempt_at) {
    const msDiff = new Date(problem.reattempt_at).getTime() - new Date().getTime();
    const daysDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
    if (daysDiff <= 0) {
      isDue = true;
      reattemptText = 'Reattempt Due!';
    } else {
      reattemptText = `Reattempt in ${daysDiff}d`;
    }
  }

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-ink-800/40 hover:bg-ink-800/60 transition-colors rounded-xl">
      {/* Clickable Left side area for expansion (triggers attempts list) */}
      <div 
        onClick={onExpand} 
        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
      >
        <button 
          onClick={(e) => { e.stopPropagation(); onCycle(); }} 
          title={`Status: ${problem.status} (click to change)`} 
          className="shrink-0 transition-transform hover:scale-105"
        >
          {STATUS_ICON[problem.status]}
        </button>
        
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold truncate transition-colors ${problem.status === 'Solved' ? 'text-slate-450 line-through' : 'text-white'}`}>
            {problem.problem_name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${DIFF_META[problem.difficulty]}`}>
              {problem.difficulty}
            </span>
            {showTopic && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-300 uppercase tracking-wider">
                {problem.topic}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Excluded Right side area for interactive action buttons */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="flex items-center flex-wrap gap-2.5 sm:gap-3 shrink-0 ml-7 sm:ml-4"
      >
        {problem.problem_link && (
          <a
            href={problem.problem_link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 truncate max-w-[140px] font-medium"
          >
            <ExternalLink className="w-3 h-3" /> Problem
          </a>
        )}
        {sdeMatch?.video_link && (
          <a
            href={sdeMatch.video_link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] text-rose-450 hover:text-rose-350 shrink-0 font-medium"
          >
            <Play className="w-3 h-3 text-rose-500 fill-rose-500/20" /> Video
          </a>
        )}
        {editingLink ? (
          <div className="flex items-center gap-1">
            <input
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              placeholder="Solution URL"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && saveLink(e as any)}
              className="text-[11px] bg-ink-850 border border-ink-700 rounded px-2 py-0.5 text-slate-200 w-40 focus:outline-none"
            />
            <button onClick={(e) => saveLink(e)} className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold">Save</button>
          </div>
        ) : problem.solution_link ? (
          <a
            href={problem.solution_link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 truncate max-w-[140px] font-medium"
          >
            <ExternalLink className="w-3 h-3" /> Solution
          </a>
        ) : sdeMatch?.solution_link ? (
          <div className="flex items-center gap-2">
            <a
              href={sdeMatch.solution_link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-emerald-455 hover:text-emerald-355 shrink-0 font-medium"
            >
              <BookOpen className="w-3 h-3 text-emerald-500" /> Striver Solution
            </a>
            <button onClick={(e) => startEdit(e)} className="text-[11px] text-slate-500 hover:text-slate-350 font-medium">+ custom</button>
          </div>
        ) : (
          <button onClick={(e) => startEdit(e)} className="text-[11px] text-slate-500 hover:text-slate-350 font-medium">+ add solution</button>
        )}

        {/* Reattempt Scheduler */}
        <div className="relative flex items-center">
          {problem.reattempt_at ? (
            <button
              onClick={() => setSchedulerOpen(!schedulerOpen)}
              className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border transition-all ${
                isDue 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' 
                  : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25'
              }`}
            >
              <Clock className="w-2.5 h-2.5" />
              {reattemptText}
            </button>
          ) : (
            <button
              onClick={() => setSchedulerOpen(!schedulerOpen)}
              className="text-slate-500 hover:text-slate-350 p-1.5 rounded-lg border border-transparent hover:border-ink-700/50 hover:bg-ink-850/60 transition-all opacity-0 group-hover:opacity-100"
            >
              <Clock className="w-4 h-4" />
            </button>
          )}

          {schedulerOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-ink-850 border border-ink-700 rounded-xl p-2.5 shadow-2xl z-30 w-44 font-sans text-xs space-y-1.5 animate-fadeIn">
              <p className="font-bold text-slate-200 border-b border-ink-800 pb-1 mb-1.5">Schedule Reattempt</p>
              <button onClick={() => { onScheduleReattempt(1); setSchedulerOpen(false); }} className="w-full text-left py-1 px-1.5 hover:bg-white/5 rounded text-slate-300 transition-colors">In 1 day</button>
              <button onClick={() => { onScheduleReattempt(3); setSchedulerOpen(false); }} className="w-full text-left py-1 px-1.5 hover:bg-white/5 rounded text-slate-300 transition-colors">In 3 days</button>
              <button onClick={() => { onScheduleReattempt(5); setSchedulerOpen(false); }} className="w-full text-left py-1 px-1.5 hover:bg-white/5 rounded text-slate-300 transition-colors">In 5 days</button>
              <button onClick={() => { onScheduleReattempt(7); setSchedulerOpen(false); }} className="w-full text-left py-1 px-1.5 hover:bg-white/5 rounded text-slate-300 transition-colors">In 1 week</button>
              <button onClick={() => { onScheduleReattempt(14); setSchedulerOpen(false); }} className="w-full text-left py-1 px-1.5 hover:bg-white/5 rounded text-slate-300 transition-colors">In 2 weeks</button>
              {problem.reattempt_at && (
                <button onClick={() => { onScheduleReattempt(null); setSchedulerOpen(false); }} className="w-full text-left py-1.5 px-1.5 hover:bg-rose-500/10 text-rose-300 border-t border-ink-800 mt-1 transition-colors">Remove Schedule</button>
              )}
            </div>
          )}
        </div>

        {/* Delete Row button */}
        <button
          onClick={(e) => { e.stopPropagation(); if (confirm('Delete this problem?')) onDelete(); }}
          className="shrink-0 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function DsaAttemptsDrawer({
  attempts, loading, judging, onAddAttempt, onRunJudge, aiJudgment,
}: {
  attempts: DsaAttempt[];
  loading: boolean;
  judging: boolean;
  onAddAttempt: (att: { approach_name: string; time_complexity: string; space_complexity: string; code_snippet: string; notes: string }) => Promise<void>;
  onRunJudge: () => Promise<void>;
  aiJudgment: string | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [time, setTime] = useState('O(N)');
  const [space, setSpace] = useState('O(1)');
  const [notes, setNotes] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedCodeId, setExpandedCodeId] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    await onAddAttempt({
      approach_name: name,
      time_complexity: time,
      space_complexity: space,
      notes,
      code_snippet: code,
    });
    setSubmitting(false);
    setName('');
    setNotes('');
    setCode('');
    setShowForm(false);
  }

  return (
    <div className="p-4 bg-ink-950/40 border-t border-ink-800/40 space-y-4 font-sans select-none animate-fadeIn">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attempts Logs</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
        >
          {showForm ? 'Cancel Log' : '+ Log Attempt'}
        </button>
      </div>

      {/* Log Form */}
      {showForm && (
        <form onSubmit={submit} className="p-3 bg-ink-900/60 border border-brand-500/10 rounded-xl space-y-3 animate-slide-down">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Approach name (e.g. Brute Force O(N^2), Optimal Hash Map)"
            required
            className="w-full bg-ink-850 border border-ink-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-brand-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time Complexity</label>
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. O(N^2)"
                required
                className="w-full bg-ink-850 border border-ink-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Space Complexity</label>
              <input
                value={space}
                onChange={(e) => setSpace(e.target.value)}
                placeholder="e.g. O(1)"
                required
                className="w-full bg-ink-850 border border-ink-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Logic Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain how this approach works..."
              className="w-full h-14 bg-ink-850 border border-ink-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-650 focus:outline-none resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Code Snippet (Optional)</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your source code here..."
              className="w-full h-24 bg-ink-850 border border-ink-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-650 font-mono focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-xs font-bold text-white rounded-lg transition-colors"
          >
            {submitting ? 'Saving Attempt...' : 'Log Solution Attempt'}
          </button>
        </form>
      )}

      {/* Attempts List */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
        </div>
      ) : attempts.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-2">No attempts logged yet. Record your methods to run the judge.</p>
      ) : (
        <div className="space-y-2">
          {attempts.map((att, idx) => (
            <div key={att.id} className="p-3 bg-ink-900/60 border border-ink-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs font-bold text-white">
                  Approach #{idx + 1}: <span className="text-brand-300">{att.approach_name}</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Time: {att.time_complexity}
                  </span>
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Space: {att.space_complexity}
                  </span>
                </div>
              </div>
              {att.notes && <p className="text-xs text-slate-400">{att.notes}</p>}
              {att.code_snippet && (
                <div className="space-y-1.5">
                  <button
                    onClick={() => setExpandedCodeId(expandedCodeId === att.id ? null : att.id)}
                    className="text-[10px] text-slate-500 hover:text-slate-350 underline cursor-pointer"
                  >
                    {expandedCodeId === att.id ? 'Hide Code' : 'View Code Snippet'}
                  </button>
                  {expandedCodeId === att.id && (
                    <pre className="bg-slate-950 p-2.5 rounded-lg text-slate-300 font-mono text-[11px] overflow-x-auto border border-ink-800">
                      {att.code_snippet}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI Judge comparative section */}
      {attempts.length >= 2 && (
        <div className="pt-2 border-t border-ink-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-brand-400" /> AI Comparative Judge
              </h4>
              <p className="text-[10px] text-slate-500">Compare efficiency and complexity between attempts</p>
            </div>
            <button
              onClick={onRunJudge}
              disabled={judging}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {judging ? <Loader2 className="w-3 h-3 animate-spin" /> : '⚖️'}
              {judging ? 'Evaluating...' : aiJudgment ? 'Re-Evaluate Approaches' : 'Judge Approaches'}
            </button>
          </div>

          {judging && (
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
              <p className="text-xs text-indigo-300">AI is evaluating your code, optimization path, and compiling a verdict...</p>
            </div>
          )}

          {aiJudgment && !judging && (
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/15 rounded-xl space-y-2 animate-fadeIn">
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold mb-1 select-none">
                <Cpu className="w-4 h-4" /> AI Performance Report
              </div>
              <FormattedJudgeReport text={aiJudgment} />
            </div>
          )}
        </div>
      )}

      {attempts.length < 2 && (
        <div className="bg-ink-900/40 p-3 rounded-xl border border-ink-800/80 flex items-center gap-2.5 text-[11px] text-slate-550 select-none">
          <AlertTriangle className="w-4 h-4 shrink-0 text-slate-650" />
          <span>Compare your progress by logging a second approach (e.g. log a brute-force method first, then log your optimized solution).</span>
        </div>
      )}
    </div>
  );
}

function FormattedJudgeReport({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-slate-305 text-xs leading-relaxed">
      {lines.map((line, idx) => {
        if (line.startsWith('###')) {
          return <h5 key={idx} className="text-xs font-bold text-white mt-2.5 mb-1">{line.replace('###', '').trim()}</h5>;
        }
        if (line.startsWith('##')) {
          return <h4 key={idx} className="text-sm font-bold text-indigo-300 mt-3.5 mb-1.5 border-b border-indigo-500/10 pb-0.5">{line.replace('##', '').trim()}</h4>;
        }
        if (line.startsWith('#')) {
          return <h3 key={idx} className="text-sm font-bold text-white mt-4 mb-2">{line.replace('#', '').trim()}</h3>;
        }
        if (line.startsWith('-') || line.startsWith('*')) {
          return <li key={idx} className="ml-3 list-disc text-slate-350">{line.substring(1).trim()}</li>;
        }
        if (line.trim() === '') {
          return <div key={idx} className="h-1.5" />;
        }
        return <p key={idx}>{line}</p>;
      })}
    </div>
  );
}

function AddProblemForm({
  defaultTopic, onSubmit, onCancel,
}: {
  defaultTopic?: string;
  onSubmit: (p: { problem_name: string; topic: string; difficulty: Difficulty; solution_link: string; problem_link: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [problemLink, setProblemLink] = useState('');
  const [topic, setTopic] = useState<string>(defaultTopic ?? TOPICS[0]);
  const [customTopic, setCustomTopic] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [link, setLink] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const finalTopic = isCustom ? customTopic.trim() : topic;
    if (!finalTopic) return;
    onSubmit({ problem_name: name, topic: finalTopic, difficulty, solution_link: link, problem_link: problemLink });
  }

  return (
    <form onSubmit={submit} className="mb-4 p-3.5 rounded-xl bg-ink-800/60 border border-brand-500/20 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">Add a problem</p>
        <button type="button" onClick={onCancel} className="p-1 rounded text-slate-500 hover:text-slate-355">
          <X className="w-4 h-4" />
        </button>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Problem name (e.g. Two Sum)"
        autoFocus
        className="w-full bg-ink-850 border border-ink-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
      />
      <input
        value={problemLink}
        onChange={(e) => setProblemLink(e.target.value)}
        placeholder="Problem Link (Optional) — LeetCode / GeeksforGeeks URL"
        className="w-full bg-ink-850 border border-ink-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
      />

      <div className="rounded-lg bg-ink-850/60 border border-ink-700/50 p-3 space-y-2">
        <label className="text-xs font-medium text-brand-300 flex items-center gap-1.5">
          <ChevronDown className="w-3 h-3" /> Topics
        </label>
        {!isCustom ? (
          <select
            value={topic}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setIsCustom(true);
                setCustomTopic('');
              } else {
                setTopic(e.target.value);
              }
            }}
            className="w-full bg-ink-850 border border-ink-700 rounded-lg px-2.5 py-2 text-sm text-slate-205 focus:outline-none focus:border-brand-500"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            <option value="__custom__">Custom Topic...</option>
          </select>
        ) : (
          <div className="flex gap-2">
            <input
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Custom topic name"
              className="flex-1 bg-ink-850 border border-ink-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
            <button
              type="button"
              onClick={() => setIsCustom(false)}
              className="px-3 bg-ink-800 hover:bg-ink-750 text-xs text-slate-300 rounded-lg"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-brand-300">Difficulty</label>
          <div className="flex gap-1.5">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                  difficulty === d
                    ? d === 'Easy'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : d === 'Medium'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-ink-850 hover:bg-ink-800 text-slate-400 border-ink-700/50'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-brand-300">Solution Link (Optional)</label>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="GitHub / code link URL"
          className="w-full bg-ink-850 border border-ink-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-ink-800 hover:bg-ink-750 text-slate-300 font-medium rounded-lg text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg text-sm transition-colors"
        >
          Add Problem
        </button>
      </div>
    </form>
  );
}
