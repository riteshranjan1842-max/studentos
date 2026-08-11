import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Curated Fallbacks for GeeksforGeeks
const GFG_FALLBACK_PROBLEMS = [
  {
    title: "Kadane's Algorithm",
    link: "https://www.geeksforgeeks.org/problems/kadanes-algorithm-1587115620/1",
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
    link: "https://www.geeksforgeeks.org/problems/missing-number-in-array1416/1",
    difficulty: "Easy",
    tags: ["Arrays", "Searching"]
  },
  {
    title: "Merge Without Extra Space",
    link: "https://www.geeksforgeeks.org/problems/merge-two-sorted-arrays-1587115620/1",
    difficulty: "Hard",
    tags: ["Arrays", "Sorting"]
  },
  {
    title: "Parenthesis Checker",
    link: "https://www.geeksforgeeks.org/problems/parenthesis-checker2744/1",
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
    link: "https://www.geeksforgeeks.org/problems/binary-search-1587115620/1",
    difficulty: "Easy",
    tags: ["Algorithms", "Searching"]
  },
  {
    title: "Reverse a linked list",
    link: "https://www.geeksforgeeks.org/problems/reverse-a-linked-list/1",
    difficulty: "Easy",
    tags: ["Linked List"]
  },
  {
    title: "Detect Loop in linked list",
    link: "https://www.geeksforgeeks.org/problems/detect-loop-in-linked-list/1",
    difficulty: "Medium",
    tags: ["Linked List", "Two-pointer"]
  },
  {
    title: "Diameter of Binary Tree",
    link: "https://www.geeksforgeeks.org/problems/diameter-of-binary-tree/1",
    difficulty: "Medium",
    tags: ["Trees", "Recursion"]
  },
  {
    title: "Height of Binary Tree",
    link: "https://www.geeksforgeeks.org/problems/height-of-binary-tree/1",
    difficulty: "Easy",
    tags: ["Trees", "Recursion"]
  },
  {
    title: "Lowest Common Ancestor in a BST",
    link: "https://www.geeksforgeeks.org/problems/lowest-common-ancestor-in-a-bst/1",
    difficulty: "Easy",
    tags: ["BST", "Trees"]
  },
  {
    title: "Spirally traversing a matrix",
    link: "https://www.geeksforgeeks.org/problems/spirally-traversing-a-matrix-1587115621/1",
    difficulty: "Medium",
    tags: ["Matrix", "Arrays"]
  },
  {
    title: "Search in a Rotated Array",
    link: "https://www.geeksforgeeks.org/problems/search-in-a-rotated-array4618/1",
    difficulty: "Medium",
    tags: ["Arrays", "Searching"]
  },
  {
    title: "Find triplets with zero sum",
    link: "https://www.geeksforgeeks.org/problems/find-triplets-with-zero-sum/1",
    difficulty: "Medium",
    tags: ["Arrays", "Sorting", "Two-pointer"]
  },
  {
    title: "Product array puzzle",
    link: "https://www.geeksforgeeks.org/problems/product-array-puzzle4525/1",
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

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// Fetch LeetCode daily coding challenge
async function fetchLeetCode(): Promise<any> {
  const query = `
    query questionOfToday {
      activeDailyCodingChallengeQuestion {
        date
        link
        question {
          difficulty
          title
          titleSlug
          topicTags {
            name
          }
        }
      }
    }
  `;

  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(`LeetCode request failed with status ${res.status}`);
  }

  const json = await res.json();
  const challenge = json.data?.activeDailyCodingChallengeQuestion;
  if (!challenge) {
    throw new Error("No active daily challenge returned from LeetCode");
  }

  return {
    title: challenge.question.title,
    link: `https://leetcode.com${challenge.link}`,
    difficulty: challenge.question.difficulty,
    tags: challenge.question.topicTags.map((t: any) => t.name),
  };
}

// Fetch Codeforces problem set and select one deterministically
async function fetchCodeforces(): Promise<any> {
  const res = await fetch("https://codeforces.com/api/problemset.problems");
  if (!res.ok) {
    throw new Error(`Codeforces API request failed with status ${res.status}`);
  }

  const json = await res.json();
  if (json.status !== "OK") {
    throw new Error(`Codeforces returned status: ${json.status}`);
  }

  const problems = json.result.problems;
  // Filter for medium/introductory difficulty problems (ratings 900 to 1500)
  const eligible = problems.filter((p: any) => p.rating && p.rating >= 900 && p.rating <= 1500);
  if (eligible.length === 0) {
    throw new Error("No eligible Codeforces problems found in rating range 900-1500");
  }

  // Pick deterministically based on day of year
  const dayOfYear = getDayOfYear();
  const index = dayOfYear % eligible.length;
  const problem = eligible[index];

  return {
    title: `${problem.contestId}${problem.index}. ${problem.name}`,
    link: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
    difficulty: problem.rating >= 1300 ? "Hard" : (problem.rating >= 1100 ? "Medium" : "Easy"),
    tags: problem.tags || [],
  };
}

// Fetch CodeChef daily problem via deterministic rotation
async function fetchCodeChef(): Promise<any> {
  const dayOfYear = getDayOfYear();
  const index = dayOfYear % CODECHEF_PROBLEMS.length;
  return CODECHEF_PROBLEMS[index];
}

// Fetch GFG via live API query with rotation fallback
async function fetchGeeksforGeeks(): Promise<any> {
  try {
    const res = await fetch("https://practiceapi.geeksforgeeks.org/api/v1/problems-of-day/problem/today/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://practice.geeksforgeeks.org/problem-of-the-day",
        "Origin": "https://practice.geeksforgeeks.org"
      }
    });
    if (!res.ok) {
      throw new Error(`Status ${res.status}`);
    }
    const json = await res.json();
    if (json && json.problem_name && json.problem_url) {
      return {
        title: json.problem_name,
        link: json.problem_url,
        difficulty: json.difficulty || "Medium",
        tags: json.tags?.topic_tags || json.tags?.company_tags || [],
      };
    }
    throw new Error("Invalid response format");
  } catch (err) {
    console.error("Failed to fetch live GeeksforGeeks POTD, using fallback:", err);
    // Fallback rotation
    const dayOfYear = getDayOfYear();
    const index = dayOfYear % GFG_FALLBACK_PROBLEMS.length;
    return GFG_FALLBACK_PROBLEMS[index];
  }
}

// Fetch HackerRank via rotation fallback
async function fetchHackerRank(): Promise<any> {
  const dayOfYear = getDayOfYear();
  const index = dayOfYear % HACKERRANK_PROBLEMS.length;
  return HACKERRANK_PROBLEMS[index];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const urlObj = new URL(req.url);
  const nocache = urlObj.searchParams.get("nocache") === "true";
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    // 1. Query database cache for today's problems (unless nocache is true)
    let cached = null;
    if (!nocache) {
      const { data, error: cacheErr } = await supabaseClient
        .from("potd_cache")
        .select("*")
        .eq("date", todayStr);

      if (cacheErr) {
        console.error("Cache query error:", cacheErr);
      } else {
        cached = data;
      }
    }

    const cachedPlatforms = new Map<string, any>();
    if (cached) {
      for (const item of cached) {
        cachedPlatforms.set(item.platform, item);
      }
    }

    const platforms = ["leetcode", "codechef", "geeksforgeeks", "codeforces", "hackerrank"];
    const results: Record<string, any> = {};

    // 2. Fetch missing or nocache platforms
    for (const platform of platforms) {
      if (!nocache && cachedPlatforms.has(platform)) {
        results[platform] = cachedPlatforms.get(platform);
        continue;
      }

      try {
        let potd;
        if (platform === "leetcode") {
          potd = await fetchLeetCode();
        } else if (platform === "codechef") {
          potd = await fetchCodeChef();
        } else if (platform === "geeksforgeeks") {
          potd = await fetchGeeksforGeeks();
        } else if (platform === "codeforces") {
          potd = await fetchCodeforces();
        } else {
          potd = await fetchHackerRank();
        }

        // Cache (upsert) the result in DB
        const { data: inserted, error: insertErr } = await supabaseClient
          .from("potd_cache")
          .upsert({
            platform,
            date: todayStr,
            title: potd.title,
            link: potd.link,
            difficulty: potd.difficulty,
            tags: potd.tags,
          }, { onConflict: "platform,date" })
          .select("*")
          .single();

        if (insertErr) {
          console.error(`Failed to cache ${platform}:`, insertErr);
        }

        results[platform] = inserted || {
          platform,
          date: todayStr,
          title: potd.title,
          link: potd.link,
          difficulty: potd.difficulty,
          tags: potd.tags,
        };
      } catch (err) {
        console.error(`Error fetching ${platform}:`, err);
        // Fallback for this specific platform in response
        results[platform] = {
          error: true,
          platform,
          message: err.message,
          link: platform === "leetcode" ? "https://leetcode.com" :
                platform === "codechef" ? "https://www.codechef.com" :
                platform === "geeksforgeeks" ? "https://practice.geeksforgeeks.org/" :
                platform === "codeforces" ? "https://codeforces.com" : "https://www.hackerrank.com",
        };
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (globalErr) {
    console.error("Global request error:", globalErr);
    return new Response(
      JSON.stringify({ error: globalErr.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
