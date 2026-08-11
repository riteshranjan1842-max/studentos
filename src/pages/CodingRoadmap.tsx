import { useEffect, useState } from 'react';
import { 
  Map, CheckCircle2, Circle, Trophy, Terminal, Code2, Database, Briefcase,
  Check, ExternalLink, Youtube, BookOpen, X 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import roadmapResources from '../data/roadmapResources.json';

interface Milestone {
  id: string;
  name: string;
  desc: string;
  subtopics: string[];
}

interface Stage {
  title: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
  color: string;
  milestones: Milestone[];
}

const STAGES: Stage[] = [
  {
    title: '1. Programming Fundamentals',
    desc: 'Master the basics of logic, syntax, and structured problem solving.',
    icon: <Terminal className="w-5 h-5" />,
    accent: 'emerald',
    color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
    milestones: [
      {
        id: 'fund_syntax',
        name: 'Language Syntax',
        desc: 'Variables, data types, loops, operators, and basic logic.',
        subtopics: ['Variables & Data Types', 'Conditional Statements (If-Else, Switch)', 'Loops (For, While, Do-While)', 'Operators & Expressions', 'Input/Output Operations'],
      },
      {
        id: 'fund_fns',
        name: 'Functions & Scope',
        desc: 'Functional programming, parameters, returns, and variable scopes.',
        subtopics: ['Parameters & Return Types', 'Call by Value vs Call by Reference', 'Recursion Basics', 'Scope & Lifetime (Global, Local)', 'Function Overloading'],
      },
      {
        id: 'fund_oop',
        name: 'Object-Oriented Programming',
        desc: 'Classes, objects, inheritance, polymorphism, and encapsulation.',
        subtopics: ['Classes & Objects', 'Inheritance & Polymorphism', 'Encapsulation & Abstraction', 'Access Modifiers (Public, Private, Protected)', 'Constructors & Destructors'],
      },
    ],
  },
  {
    title: '2. Data Structures & Algorithms',
    desc: 'Build efficiency in handling data structures and problem patterns.',
    icon: <Code2 className="w-5 h-5" />,
    accent: 'sky',
    color: 'border-sky-500/30 text-sky-400 bg-sky-500/5',
    milestones: [
      {
        id: 'fund_complexity',
        name: 'Space & Time Complexity',
        desc: 'Big-O notation, analyzing code efficiency, and running limits.',
        subtopics: ['Big-O Notation', 'Best, Worst, and Average Cases', 'Recursion Complexity (Recursion Trees)', 'Auxiliary Space Analysis', 'Common Complexities (O(N), O(log N), O(N^2))'],
      },
      {
        id: 'dsa_linear',
        name: 'Linear Structures',
        desc: 'Arrays, vectors, linked lists, stacks, queues, and hashing.',
        subtopics: ['Arrays & Dynamic Vectors', 'Singly, Doubly, and Circular Linked Lists', 'Stacks (LIFO operations)', 'Queues (FIFO & Deque)', 'Hashing & HashMaps'],
      },
      {
        id: 'dsa_trees',
        name: 'Hierarchical Structures',
        desc: 'Binary Trees, Binary Search Trees (BST), heaps, and traversals.',
        subtopics: ['Binary Trees', 'Binary Search Trees (BST & AVL)', 'Heaps & Priority Queues', 'Tree Traversals (Inorder, Preorder, Postorder, Level-order)'],
      },
      {
        id: 'dsa_graphs',
        name: 'Graphs & Networks',
        desc: 'BFS, DFS, Dijkstra, MST, topological sorting, and shortest path.',
        subtopics: ['BFS & DFS Traversals', "Dijkstra's Shortest Path", "Kruskal & Prim's Algorithms (MST)", 'Topological Sorting', 'Cycle Detection (Directed & Undirected)'],
      },
      {
        id: 'dsa_dp',
        name: 'Dynamic Programming & Recursion',
        desc: 'Memoization, tabulation, recursion base cases, and optimization.',
        subtopics: ['Memoization (Top-down)', 'Tabulation (Bottom-up)', '0/1 Knapsack Pattern', 'Longest Common Subsequence (LCS) & LIS', 'Backtracking (N-Queens, Sudoku)'],
      },
      {
        id: 'dsa_greedy',
        name: 'Greedy Algorithms',
        desc: 'Making locally optimal choices to solve optimization problems efficiently.',
        subtopics: ['Activity Selection & Interval Scheduling', 'Fractional Knapsack', 'Huffman Coding', 'Job Sequencing with Deadlines', 'Minimum Coin Change (Greedy Approach)'],
      },
    ],
  },
  {
    title: '3. Web & Application Development',
    desc: 'Develop modern user interfaces and connected backend architectures.',
    icon: <Database className="w-5 h-5" />,
    accent: 'amber',
    color: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
    milestones: [
      {
        id: 'dev_frontend',
        name: 'Modern Frontend Development',
        desc: 'HTML5, Tailwind CSS, Javascript ES6, and interactive React/Vite frameworks.',
        subtopics: ['HTML5 & Semantic Elements', 'CSS3 Layouts (Flexbox, Grid)', 'JavaScript ES6+ Features', 'React Components & Tailwind CSS', 'Vite Bundler & React Router'],
      },
      {
        id: 'dev_backend',
        name: 'Backend APIs & Servers',
        desc: 'Node.js, Express, RESTful APIs, routing, and server frameworks.',
        subtopics: ['Node.js Event Loop', 'Express Server Framework', 'RESTful API Design & Methods', 'Middleware Pipelines', 'Authentication & JWT'],
      },
      {
        id: 'dev_db',
        name: 'Relational & NoSQL Databases',
        desc: 'SQL schema design, PostgreSQL, MongoDB, indexes, and queries.',
        subtopics: ['SQL Schema & Relational Joins', 'PostgreSQL Administration', 'MongoDB Collections', 'Mongoose ODM / ORM', 'Database Indexing & Queries'],
      },
      {
        id: 'dev_deploy',
        name: 'Cloud & System Deployments',
        desc: 'Git/GitHub version control, Docker containers, Vercel/Render hosting, and CI/CD pipelines.',
        subtopics: ['Git Branching & Merges', 'Docker Containerization', 'Cloud Hosting & AWS (Render, Vercel)', 'CI/CD Pipelines (GitHub Actions)'],
      },
    ],
  },
  {
    title: '4. Systems & Professional Prep',
    desc: 'Align your knowledge with standard engineering interviews.',
    icon: <Briefcase className="w-5 h-5" />,
    accent: 'rose',
    color: 'border-rose-500/30 text-rose-400 bg-rose-500/5',
    milestones: [
      {
        id: 'prep_cs_core',
        name: 'Core CS Fundamentals',
        desc: 'Operating Systems, Computer Networks, and database transaction properties.',
        subtopics: ['OS Process Management & Scheduling', 'Multi-threading, Deadlocks, & Locks', 'TCP/IP vs UDP Protocols', 'DB Transactions & ACID Properties'],
      },
      {
        id: 'prep_sys_design',
        name: 'System Design (LLD/HLD)',
        desc: 'Design patterns, microservices, load balancers, caching, and scalability.',
        subtopics: ['Design Patterns (Singleton, Factory, Observer)', 'Microservices Architecture', 'Caching (Redis) & CDNs', 'Load Balancing & Scalability'],
      },
      {
        id: 'prep_resume',
        name: 'Resume & Portfolio Building',
        desc: 'Drafting structured technical resumes, listing projects, and GitHub presence.',
        subtopics: ['Resume Templates (ATS-friendly)', 'GitHub Portfolio Display', 'Project Descriptions (STAR Method)', 'LinkedIn Profile Optimization'],
      },
      {
        id: 'prep_mock',
        name: 'Mock Interviews & Behavioral',
        desc: 'Solving puzzles, STAR method behavioral questions, and live coding exercises.',
        subtopics: ['DSA Problem Solving Live', 'STAR Method Response Templates', 'Behavioral Case Analysis', 'Negotiation Basics'],
      },
    ],
  },
];

const dsaModuleKeyMap: Record<string, string> = {
  'fund_complexity': 'space-time-complexity',
  'dsa_linear': 'linear-structures',
  'dsa_trees': 'hierarchical-structures',
  'dsa_graphs': 'graphs-networks',
  'dsa_dp': 'dp-recursion',
  'dsa_greedy': 'greedy-algorithms'
};

export default function CodingRoadmap() {
  const { user } = useAuth();
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return localStorage.getItem('roadmap_language') || 'python';
  });
  const [activeSubtopic, setActiveSubtopic] = useState<{
    milestoneId: string;
    subtopic: string;
  } | null>(null);

  useEffect(() => {
    async function loadRoadmap() {
      if (!user) return;
      const { data } = await supabase
        .from('coding_roadmap')
        .select('milestone_id')
        .eq('user_id', user.id)
        .eq('completed', true);
      
      const ids = new Set((data ?? []).map((r) => r.milestone_id));
      setCompletedIds(ids);
      setLoading(false);
    }
    loadRoadmap();
  }, [user]);

  useEffect(() => {
    if (!loading && window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [loading, window.location.hash]);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    localStorage.setItem('roadmap_language', lang);
  };

  async function toggleMilestone(id: string) {
    if (!user) return;
    const isWebOrPrep = id.startsWith('dev_') || id.startsWith('prep_');
    const milestoneKey = isWebOrPrep ? id : `${id}:${selectedLanguage}`;
    const isCompleted = completedIds.has(milestoneKey) || completedIds.has(id);
    const nextIds = new Set(completedIds);
    
    // Find the milestone definition
    const milestone = STAGES.flatMap(s => s.milestones).find(m => m.id === id);
    if (!milestone) return;

    const subtopics = milestone.subtopics;

    // Toggle the milestone AND all its subtopics to match the new status
    if (isCompleted) {
      nextIds.delete(milestoneKey);
      nextIds.delete(id); // delete un-suffixed legacy progress
      subtopics.forEach(sub => {
        nextIds.delete(`${id}:sub:${sub}:${selectedLanguage}`);
        nextIds.delete(`${id}:sub:${sub}`); // delete legacy
      });
    } else {
      nextIds.add(milestoneKey);
      subtopics.forEach(sub => {
        if (isWebOrPrep) {
          nextIds.add(`${id}:sub:${sub}`);
        } else {
          nextIds.add(`${id}:sub:${sub}:${selectedLanguage}`);
        }
      });
    }
    setCompletedIds(nextIds);

    // Sync milestone status to database
    await supabase
      .from('coding_roadmap')
      .upsert(
        { user_id: user.id, milestone_id: milestoneKey, completed: !isCompleted },
        { onConflict: 'user_id,milestone_id' }
      );

    // Sync all subtopic statuses to database
    const promises = subtopics.map(sub => {
      const subKey = isWebOrPrep ? `${id}:sub:${sub}` : `${id}:sub:${sub}:${selectedLanguage}`;
      return supabase
        .from('coding_roadmap')
        .upsert(
          { user_id: user.id, milestone_id: subKey, completed: !isCompleted },
          { onConflict: 'user_id,milestone_id' }
        );
    });
    await Promise.all(promises);
  }

  async function toggleSubtopic(milestoneId: string, subtopic: string) {
    if (!user) return;
    const isWebOrPrep = milestoneId.startsWith('dev_') || milestoneId.startsWith('prep_');
    const subKey = isWebOrPrep ? `${milestoneId}:sub:${subtopic}` : `${milestoneId}:sub:${subtopic}:${selectedLanguage}`;
    const milestoneKey = isWebOrPrep ? milestoneId : `${milestoneId}:${selectedLanguage}`;
    const isCompleted = completedIds.has(subKey) || completedIds.has(`${milestoneId}:sub:${subtopic}`);
    const nextIds = new Set(completedIds);
    if (isCompleted) {
      nextIds.delete(subKey);
      nextIds.delete(`${milestoneId}:sub:${subtopic}`); // delete legacy un-suffixed
    } else {
      nextIds.add(subKey);
    }

    // Auto-update parent milestone status:
    // If all subtopics of this milestone are completed, we mark the milestone itself as completed.
    const milestone = STAGES.flatMap(s => s.milestones).find(m => m.id === milestoneId);
    if (milestone) {
      const allSubtopics = milestone.subtopics;
      const allCompleted = allSubtopics.every(sub => {
        const key = isWebOrPrep ? `${milestoneId}:sub:${sub}` : `${milestoneId}:sub:${sub}:${selectedLanguage}`;
        return key === subKey ? !isCompleted : (nextIds.has(key) || nextIds.has(`${milestoneId}:sub:${sub}`));
      });

      if (allCompleted) {
        nextIds.add(milestoneKey);
        await supabase
          .from('coding_roadmap')
          .upsert(
            { user_id: user.id, milestone_id: milestoneKey, completed: true },
            { onConflict: 'user_id,milestone_id' }
          );
      } else {
        nextIds.delete(milestoneKey);
        nextIds.delete(milestoneId); // delete legacy
        await supabase
          .from('coding_roadmap')
          .upsert(
            { user_id: user.id, milestone_id: milestoneKey, completed: false },
            { onConflict: 'user_id,milestone_id' }
          );
      }
    }

    setCompletedIds(nextIds);

    // Sync subtopic to database
    await supabase
      .from('coding_roadmap')
      .upsert(
        { user_id: user.id, milestone_id: subKey, completed: !isCompleted },
        { onConflict: 'user_id,milestone_id' }
      );
  }

  // Calculate Overall Progress based on Subtopics
  const totalSubtopicsCount = STAGES.reduce((sum, stage) => {
    return sum + stage.milestones.reduce((s, m) => s + m.subtopics.length, 0);
  }, 0);
  const completedSubtopicsCount = STAGES.reduce((sum, stage) => {
    return sum + stage.milestones.reduce((s, m) => {
      return s + m.subtopics.filter(sub => 
        completedIds.has(`${m.id}:sub:${sub}:${selectedLanguage}`) || 
        completedIds.has(`${m.id}:sub:${sub}`)
      ).length;
    }, 0);
  }, 0);
  const totalPct = totalSubtopicsCount > 0 ? Math.round((completedSubtopicsCount / totalSubtopicsCount) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Map className="w-8 h-8 text-rose-400" /> Coding Roadmap
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track your milestones from basic syntax to professional mock interviews. Click subtopics for study resources.
          </p>
        </div>

        {/* Controls: Language Selector and Progress */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Custom Tabs for Language selection */}
          <div className="flex bg-ink-900/60 p-1 rounded-xl border border-ink-800/80 gap-1 shrink-0">
            {['python', 'java', 'cpp'].map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  selectedLanguage === lang
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-ink-800/40'
                }`}
              >
                {lang === 'cpp' ? 'C++' : lang}
              </button>
            ))}
          </div>

          {totalSubtopicsCount > 0 && (
            <div className="flex items-center gap-3 glass px-5 py-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/5 shrink-0">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Overall Progress</p>
                <h2 className="text-xl font-bold text-rose-400 mt-0.5">
                  {totalPct}%
                </h2>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {STAGES.map((stage, idx) => {
            // Stage progress calculation based on subtopics
            const totalSubtopicsInStage = stage.milestones.reduce((sum, m) => sum + m.subtopics.length, 0);
            const completedSubtopicsInStage = stage.milestones.reduce((sum, m) => {
              return sum + m.subtopics.filter(sub => 
                completedIds.has(`${m.id}:sub:${sub}:${selectedLanguage}`) ||
                completedIds.has(`${m.id}:sub:${sub}`)
              ).length;
            }, 0);
            const stagePct = totalSubtopicsInStage > 0 ? Math.round((completedSubtopicsInStage / totalSubtopicsInStage) * 100) : 0;

            return (
              <div key={idx} id={`stage-${idx}`} className="glass rounded-2xl border border-ink-700/50 overflow-hidden">
                {/* Stage Banner */}
                <div className="px-5 py-4 border-b border-ink-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-ink-950/20">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${stage.color}`}>
                      {stage.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{stage.title}</h3>
                      <p className="text-slate-400 text-xs mt-1">{stage.desc}</p>
                    </div>
                  </div>

                  {/* Stage Progress Bar */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Progress</p>
                      <p className="text-sm font-bold text-white">{stagePct}%</p>
                    </div>
                    <div className="w-24 h-2 bg-ink-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          stage.accent === 'emerald' ? 'bg-emerald-500' :
                          stage.accent === 'sky' ? 'bg-sky-500' :
                          stage.accent === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${stagePct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Milestones List */}
                <div className="divide-y divide-ink-800/40 bg-ink-900/10">
                  {stage.milestones.map((milestone) => {
                    const isDone = completedIds.has(`${milestone.id}:${selectedLanguage}`) || completedIds.has(milestone.id);

                    return (
                      <div
                        key={milestone.id}
                        className="p-5 hover:bg-ink-800/10 transition-colors"
                      >
                        <div 
                          className="flex items-start gap-4 cursor-pointer group"
                          onClick={() => toggleMilestone(milestone.id)}
                        >
                          <button
                            type="button"
                            className="mt-0.5 shrink-0 transition-transform group-hover:scale-105"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-500 group-hover:text-slate-400" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold transition-colors ${
                              isDone ? 'text-slate-500 line-through' : 'text-white'
                            }`}>
                              {milestone.name}
                            </p>
                            <p className="text-xs text-slate-550 mt-0.5 leading-relaxed">{milestone.desc}</p>
                            
                            {/* Subtopics badges list */}
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {milestone.subtopics.map((sub, sIdx) => {
                                const isSubDone = completedIds.has(`${milestone.id}:sub:${sub}:${selectedLanguage}`) || completedIds.has(`${milestone.id}:sub:${sub}`);
                                const isActive = activeSubtopic?.milestoneId === milestone.id && activeSubtopic?.subtopic === sub;

                                return (
                                  <span
                                    key={sIdx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveSubtopic(
                                        isActive ? null : { milestoneId: milestone.id, subtopic: sub }
                                      );
                                    }}
                                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md border transition-colors cursor-pointer flex items-center gap-1 ${
                                      isSubDone 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                        : isActive
                                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                          : 'bg-ink-800/45 text-slate-400 border-ink-700/60 hover:border-brand-500/40 hover:text-white'
                                    }`}
                                  >
                                    {isSubDone && <Check className="w-2.5 h-2.5 shrink-0" />}
                                    {sub}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Resource Drawer */}
                        {activeSubtopic && activeSubtopic.milestoneId === milestone.id && (() => {
                          const currentSubtopic = activeSubtopic.subtopic;
                          const subtopicGroup = (roadmapResources as Record<string, any>)[currentSubtopic];
                          const hasLanguageKeys = subtopicGroup && ('python' in subtopicGroup || 'java' in subtopicGroup || 'cpp' in subtopicGroup);
                          const resource = hasLanguageKeys ? subtopicGroup?.[selectedLanguage] : subtopicGroup;

                          const isDsaModule = milestone.id in dsaModuleKeyMap;
                          const isWebOrPrep = milestone.id.startsWith('dev_') || milestone.id.startsWith('prep_');

                          const videoUrls = Array.isArray(resource?.videoUrl)
                            ? resource.videoUrl
                            : resource?.videoUrl
                              ? [resource.videoUrl]
                              : [];

                          const videoCards: { url: string; label: string; subtext: string }[] = [];

                          if (isWebOrPrep) {
                            videoUrls.forEach((vUrl: string, idx: number) => {
                              const label = videoUrls.length > 1
                                ? `Learn (Video ${idx + 1})`
                                : resource?.videoSource
                                  ? `Learn (${resource.videoSource})`
                                  : 'Learn (Video)';
                              const subtext = videoUrls.length > 1
                                ? `Opens video ${idx + 1} for this topic.`
                                : `Opens dedicated course/video for this topic.`;
                              videoCards.push({ url: vUrl, label, subtext });
                            });
                          } else {
                            let videoUrl = "https://youtube.com";
                            let playlistLabel = "Learn (CodeWithHarry Playlist)";
                            let playlistSubtext = "Opens full course playlist — find this topic inside.";

                            if (isDsaModule) {
                              if (selectedLanguage === 'cpp') {
                                const cppConfig = resource;
                                const isFallback = cppConfig?.fallbackToA2Z === true;
                                videoUrl = cppConfig?.videoUrl || "https://www.youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz";
                                playlistLabel = isFallback ? "Learn (Striver A2Z Fallback)" : "Learn (Striver Playlist)";
                                playlistSubtext = isFallback 
                                  ? `Opens Striver's A2Z DSA Course — search for '${currentSubtopic}' within the playlist.` 
                                  : "Opens Striver's dedicated topic playlist.";
                              } else {
                                const dsaKey = dsaModuleKeyMap[milestone.id];
                                const dsaPlaylists = (roadmapResources as Record<string, any>)["dsaPlaylists"] || {};
                                videoUrl = dsaPlaylists[dsaKey]?.[selectedLanguage] || "https://youtube.com";
                                playlistLabel = `Learn (${selectedLanguage === 'java' ? 'Java' : 'Python'} DSA Playlist)`;
                                playlistSubtext = "Opens full DSA course playlist — find this topic inside.";
                              }
                            } else {
                              const playlistsMap = (roadmapResources as Record<string, any>)["playlists"] || {};
                              videoUrl = playlistsMap[selectedLanguage] || "https://youtube.com";
                            }

                            videoCards.push({ url: videoUrl, label: playlistLabel, subtext: playlistSubtext });
                          }

                          const practiceUrl = resource?.practiceUrl || `https://www.google.com/search?q=${encodeURIComponent(currentSubtopic + ' in ' + (selectedLanguage === 'cpp' ? 'C++' : selectedLanguage) + ' w3schools')}`;
                          const practicePlatform = resource?.practicePlatform || "Web Search";
                          const isSubDone = completedIds.has(`${milestone.id}:sub:${currentSubtopic}:${selectedLanguage}`) || completedIds.has(`${milestone.id}:sub:${currentSubtopic}`);

                          return (
                            <div 
                              className="mt-4 p-4 rounded-xl border border-ink-700/60 bg-ink-950/80 backdrop-blur-md space-y-3.5 relative animate-in fade-in slide-in-from-top-2 duration-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Close Button and Language Picker */}
                              <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
                                {!isWebOrPrep && (
                                  <div className="flex bg-ink-900/65 p-0.5 rounded-lg border border-ink-850 gap-0.5 shrink-0">
                                    {['python', 'java', 'cpp'].map((lang) => (
                                      <button
                                        key={lang}
                                        onClick={() => handleLanguageChange(lang)}
                                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                                          selectedLanguage === lang
                                            ? 'bg-rose-500 text-white shadow-md'
                                            : 'text-slate-400 hover:text-white hover:bg-ink-800/40'
                                        }`}
                                      >
                                        {lang === 'cpp' ? 'C++' : lang}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <button 
                                  onClick={() => setActiveSubtopic(null)}
                                  className="text-slate-500 hover:text-white transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div>
                                <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Concept Study</h4>
                                <h3 className="text-sm font-bold text-white mt-0.5">{currentSubtopic}</h3>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Learn Cards */}
                                {videoCards.map((card, cIdx) => (
                                  <a 
                                    key={cIdx}
                                    href={card.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-lg border border-ink-700/40 bg-ink-900/40 hover:bg-ink-800/30 hover:border-rose-500/30 transition-all group/card"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                                      <Youtube className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-white flex items-center gap-1 text-left">
                                        {card.label} <ExternalLink className="w-3 h-3 text-slate-500 group-hover/card:text-white" />
                                      </p>
                                      <p className="text-[10px] text-slate-400 text-left mt-0.5">{card.subtext}</p>
                                    </div>
                                  </a>
                                ))}

                                {/* Practice Card */}
                                <a 
                                  href={practiceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-3 p-3 rounded-lg border border-ink-700/40 bg-ink-900/40 hover:bg-ink-800/30 hover:border-emerald-500/30 transition-all group/card"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                                    <BookOpen className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-white flex items-center gap-1">
                                      Practice ({practicePlatform}) <ExternalLink className="w-3 h-3 text-slate-500 group-hover/card:text-white" />
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">Start here: Practice Easy questions first</p>
                                  </div>
                                </a>
                              </div>

                              <div className="pt-2 border-t border-ink-800/60 flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input 
                                    type="checkbox" 
                                    checked={isSubDone}
                                    onChange={() => toggleSubtopic(milestone.id, currentSubtopic)}
                                    className="rounded border-ink-700 bg-ink-900 text-rose-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                                  />
                                  <span className="text-xs font-semibold text-slate-355 group-hover:text-white transition-colors">
                                    ✓ Mark as Practiced
                                  </span>
                                </label>

                                {!isWebOrPrep && (
                                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                                    Language: {selectedLanguage === 'cpp' ? 'C++' : selectedLanguage}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
