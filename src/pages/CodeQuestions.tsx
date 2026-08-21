import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Code, Sparkles, CheckCircle2, ExternalLink, ChevronDown, ChevronUp,
  Loader2, Search, RotateCcw, Plus, Check, AlertTriangle, Layers, BookOpen, Filter,
  Share2, Bookmark
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export interface PracticeQuestion {
  id: string;
  title: string;
  description: string;
  tier: 'Basic' | 'Intermediate' | 'Advanced';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  platform: 'LeetCode' | 'GeeksforGeeks' | 'HackerRank' | 'InterviewBit' | 'Codeforces' | string;
  practiceUrl: string;
  alternativePlatform?: string;
  alternativePracticeUrl?: string;
}

interface AIQuestionsResponse {
  isCodingTopic?: boolean;
  topic?: string;
  notice?: string;
  questions: PracticeQuestion[];
}

const DIFFICULTY_STYLES: Record<'Easy' | 'Medium' | 'Hard', string> = {
  Easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Hard: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

const TIER_ICONS: Record<'Basic' | 'Intermediate' | 'Advanced', string> = {
  Basic: '🌱',
  Intermediate: '⚡',
  Advanced: '🚀',
};

// Fallback questions generator if AI service encounters error or needs backup
function getFallbackQuestions(rawTopic: string): PracticeQuestion[] {
  const topic = rawTopic.trim() || 'Data Structures & Algorithms';
  const cleanTopic = topic.toLowerCase();
  
  const isLL = cleanTopic.includes('link') || cleanTopic.includes('list');
  const isArray = cleanTopic.includes('array') || cleanTopic.includes('vector') || cleanTopic.includes('matrix');
  const isTree = cleanTopic.includes('tree') || cleanTopic.includes('bst') || cleanTopic.includes('binary');

  let baseTopic = 'DSA';
  if (isLL) baseTopic = 'Linked List';
  else if (isArray) baseTopic = 'Array';
  else if (isTree) baseTopic = 'Binary Tree';

  const basicTitles = [
    `Implementation & Traversal of ${baseTopic}`,
    `Find Length / Size of ${baseTopic}`,
    `Search Element in ${baseTopic}`,
    `Insert Node/Element at Head & Tail in ${baseTopic}`,
    `Delete Given Node/Element in ${baseTopic}`,
    `Check if ${baseTopic} is Empty or Has Single Element`,
    `Print Reverse / Backward View of ${baseTopic}`,
    `Find Middle Element of ${baseTopic}`
  ];

  const intTitles = [
    `Reverse ${baseTopic} in Groups of K`,
    `Detect and Remove Loop / Cycle in ${baseTopic}`,
    `Merge Two Sorted ${baseTopic}s`,
    `Find Intersection Point of Two ${baseTopic}s`,
    `Remove N-th Node from End of ${baseTopic}`,
    `Check if ${baseTopic} is Palindrome`,
    `Rotate ${baseTopic} by K Places`,
    `Clone ${baseTopic} with Random Pointers`,
    `Add Two Numbers Represented by ${baseTopic}`
  ];

  const advTitles = [
    `Flatten a Multi-Level Doubly ${baseTopic}`,
    `LRU Cache Implementation using ${baseTopic}`,
    `LFU Cache Implementation using ${baseTopic}`,
    `Merge K Sorted ${baseTopic}s in O(N log K)`,
    `Reorder ${baseTopic} in Zip Pattern (L0 → Ln → L1 → Ln-1)`,
    `Segregate Even and Odd Nodes in ${baseTopic}`,
    `Find K-th Smallest / Largest in Complex ${baseTopic}`,
    `Convert Sorted ${baseTopic} to Balanced BST`
  ];

  const buildUrl = (title: string, platform: 'LeetCode' | 'GeeksforGeeks') => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (platform === 'LeetCode') {
      return `https://leetcode.com/problemset/?search=${encodeURIComponent(title)}`;
    }
    return `https://www.geeksforgeeks.org/explore?page=1&search=${encodeURIComponent(title)}`;
  };

  const list: PracticeQuestion[] = [];

  basicTitles.forEach((t, i) => {
    list.push({
      id: `basic-${i + 1}`,
      title: t,
      description: `Fundamentals of ${baseTopic}: basic manipulation, pointer/index access, and boundary safety checks.`,
      tier: 'Basic',
      difficulty: 'Easy',
      platform: 'LeetCode',
      practiceUrl: buildUrl(t, 'LeetCode'),
      alternativePlatform: 'GeeksforGeeks',
      alternativePracticeUrl: buildUrl(t, 'GeeksforGeeks')
    });
  });

  intTitles.forEach((t, i) => {
    list.push({
      id: `int-${i + 1}`,
      title: t,
      description: `Intermediate problem combining pattern-matching, two-pointer techniques, and state tracking.`,
      tier: 'Intermediate',
      difficulty: 'Medium',
      platform: 'LeetCode',
      practiceUrl: buildUrl(t, 'LeetCode'),
      alternativePlatform: 'GeeksforGeeks',
      alternativePracticeUrl: buildUrl(t, 'GeeksforGeeks')
    });
  });

  advTitles.forEach((t, i) => {
    list.push({
      id: `adv-${i + 1}`,
      title: t,
      description: `Advanced optimization problem with strict memory and runtime requirements, handling tricky edge cases.`,
      tier: 'Advanced',
      difficulty: 'Hard',
      platform: 'LeetCode',
      practiceUrl: buildUrl(t, 'LeetCode'),
      alternativePlatform: 'GeeksforGeeks',
      alternativePracticeUrl: buildUrl(t, 'GeeksforGeeks')
    });
  });

  return list;
}

export default function CodeQuestions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const noteId = searchParams.get('noteId') || '';
  const initialTopic = searchParams.get('topic') || '';

  const [topic, setTopic] = useState<string>(initialTopic || 'Linked List');
  const [noteContent, setNoteContent] = useState<string>('');
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [isCodingTopic, setIsCodingTopic] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTierFilter, setActiveTierFilter] = useState<'All' | 'Basic' | 'Intermediate' | 'Advanced'>('All');
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
  const [trackingLoading, setTrackingLoading] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Collapsible section state
  const [expandedSections, setExpandedSections] = useState<{ Basic: boolean; Intermediate: boolean; Advanced: boolean }>({
    Basic: true,
    Intermediate: true,
    Advanced: true,
  });

  // Fetch note details if noteId is present
  useEffect(() => {
    async function loadNote() {
      if (!noteId) return;
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('title, content')
          .eq('id', noteId)
          .maybeSingle();

        if (data) {
          if (data.title && !initialTopic) {
            setTopic(data.title);
          }
          if (data.content) {
            setNoteContent(data.content);
          }
        }
      } catch (err) {
        console.error('Error fetching note details:', err);
      }
    }
    loadNote();
  }, [noteId, initialTopic]);

  // Generate 25 questions via AI
  async function fetchQuestions(currentTopic: string, currentContent?: string) {
    setLoading(true);
    setError(null);
    try {
      const targetTopic = currentTopic.trim() || 'Data Structures and Algorithms';
      
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'generate_code_questions',
          topic: targetTopic,
          noteContent: currentContent || '',
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate practice questions');
      }

      let parsed: AIQuestionsResponse;
      if (typeof data.result === 'string') {
        const cleanJson = data.result
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/, '')
          .replace(/\s*```$/, '')
          .trim();
        parsed = JSON.parse(cleanJson);
      } else {
        parsed = data.result;
      }

      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        setQuestions(sanitizeQuestions(parsed.questions, targetTopic));
        setIsCodingTopic(parsed.isCodingTopic !== false);
      } else {
        // Fallback if AI response format isn't array
        setQuestions(getFallbackQuestions(targetTopic));
      }
    } catch (err) {
      console.warn('AI code question generation failed, using fallback questions:', err);
      setQuestions(getFallbackQuestions(currentTopic || topic));
    } finally {
      setLoading(false);
    }
  }

  // Ensure link priority and validity
  function sanitizeQuestions(rawList: PracticeQuestion[], fallbackTopic: string): PracticeQuestion[] {
    return rawList.map((q, idx) => {
      const tier: 'Basic' | 'Intermediate' | 'Advanced' = 
        q.tier === 'Basic' || q.tier === 'Intermediate' || q.tier === 'Advanced'
          ? q.tier
          : idx < 8 ? 'Basic' : idx < 17 ? 'Intermediate' : 'Advanced';

      const difficulty: 'Easy' | 'Medium' | 'Hard' =
        q.difficulty === 'Easy' || q.difficulty === 'Medium' || q.difficulty === 'Hard'
          ? q.difficulty
          : tier === 'Basic' ? 'Easy' : tier === 'Intermediate' ? 'Medium' : 'Hard';

      let practiceUrl = q.practiceUrl || '';
      let platform = q.platform || 'LeetCode';

      // Priority Rule enforcement: LeetCode -> GeeksforGeeks -> Other
      if (practiceUrl) {
        if (practiceUrl.includes('leetcode.com')) {
          platform = 'LeetCode';
        } else if (practiceUrl.includes('geeksforgeeks.org')) {
          platform = 'GeeksforGeeks';
        } else if (practiceUrl.includes('hackerrank.com')) {
          platform = 'HackerRank';
        } else if (practiceUrl.includes('interviewbit.com')) {
          platform = 'InterviewBit';
        } else if (practiceUrl.includes('codeforces.com')) {
          platform = 'Codeforces';
        }
      } else {
        platform = 'LeetCode';
        practiceUrl = `https://leetcode.com/problemset/?search=${encodeURIComponent(q.title)}`;
      }

      let altUrl = q.alternativePracticeUrl;
      let altPlatform = q.alternativePlatform;
      if (!altUrl) {
        if (platform === 'LeetCode') {
          altPlatform = 'GeeksforGeeks';
          altUrl = `https://www.geeksforgeeks.org/explore?page=1&search=${encodeURIComponent(q.title)}`;
        } else {
          altPlatform = 'LeetCode';
          altUrl = `https://leetcode.com/problemset/?search=${encodeURIComponent(q.title)}`;
        }
      }

      return {
        id: q.id || `q-${idx + 1}`,
        title: q.title || `Practice Problem #${idx + 1}`,
        description: q.description || `Master key operations and problem solving for ${fallbackTopic}.`,
        tier,
        difficulty,
        platform,
        practiceUrl,
        alternativePlatform: altPlatform,
        alternativePracticeUrl: altUrl,
      };
    });
  }

  useEffect(() => {
    fetchQuestions(topic, noteContent);
  }, []);

  const toggleSection = (section: 'Basic' | 'Intermediate' | 'Advanced') => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const setAllSections = (expanded: boolean) => {
    setExpandedSections({ Basic: expanded, Intermediate: expanded, Advanced: expanded });
  };

  // Add question to DSA Tracker in Supabase
  async function handleAddToDsaTracker(q: PracticeQuestion) {
    if (!user) return;
    setTrackingLoading(q.id);
    try {
      const { data, error } = await supabase.from('dsa_tracker').insert({
        user_id: user.id,
        problem_name: q.title,
        topic: topic || 'Notes AI Generated',
        difficulty: q.difficulty,
        status: 'Unsolved',
        problem_link: q.practiceUrl,
        solution_link: '',
      }).select();

      if (error) {
        console.error('Error tracking problem:', error);
      } else {
        setTrackedIds((prev) => new Set(prev).add(q.id));
      }
    } catch (err) {
      console.error('Failed to add to tracker:', err);
    } finally {
      setTrackingLoading(null);
    }
  }

  // Filter questions based on search query & active tier filter
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = activeTierFilter === 'All' || q.tier === activeTierFilter;
      return matchesSearch && matchesTier;
    });
  }, [questions, searchQuery, activeTierFilter]);

  const basicList = useMemo(() => filteredQuestions.filter((q) => q.tier === 'Basic'), [filteredQuestions]);
  const intList = useMemo(() => filteredQuestions.filter((q) => q.tier === 'Intermediate'), [filteredQuestions]);
  const advList = useMemo(() => filteredQuestions.filter((q) => q.tier === 'Advanced'), [filteredQuestions]);

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-ink-950 text-slate-100 p-4 sm:p-6 md:p-8 space-y-6">
      {/* Top Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-800/80 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(noteId ? `/ai/notes` : '/ai/notes')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-ink-900 hover:bg-ink-850 text-slate-300 hover:text-white border border-ink-700/60 text-xs font-semibold transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Notes</span>
          </button>
          <div className="h-5 w-px bg-ink-800" />
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <BookOpen className="w-3.5 h-3.5 text-brand-400" />
            <span className="truncate max-w-[200px] sm:max-w-[300px]">Note: {topic}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-900 hover:bg-ink-800 text-slate-300 border border-ink-700/50 text-xs font-medium transition-colors"
            title="Share or bookmark this page URL"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Page'}</span>
          </button>

          <button
            onClick={() => fetchQuestions(topic, noteContent)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-brand-600/20"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate 25 Questions</span>
          </button>
        </div>
      </div>

      {/* Page Header */}
      <div className="glass rounded-3xl p-6 md:p-8 border border-ink-700/60 bg-gradient-to-br from-ink-900/90 via-ink-900/40 to-brand-950/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center gap-1">
                <Code className="w-3.5 h-3.5" /> AI Coding Practice Set
              </span>
              <span className="text-xs font-semibold text-slate-400 bg-ink-800 px-2.5 py-0.5 rounded-full">
                25 Tiered Problems
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Code Questions: <span className="text-brand-300">{topic}</span>
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed">
              Targeted practice questions generated directly from your note topic. Work through Basic, Intermediate, and Advanced problems with verified practice links on LeetCode and GeeksforGeeks.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="bg-ink-950/60 border border-ink-800 rounded-2xl p-3.5 text-center min-w-[90px]">
              <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Basic</div>
              <div className="text-xl font-black text-white">{questions.filter(q => q.tier === 'Basic').length || 8}</div>
              <div className="text-[10px] text-slate-500">Easy Tier</div>
            </div>
            <div className="bg-ink-950/60 border border-ink-800 rounded-2xl p-3.5 text-center min-w-[90px]">
              <div className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-0.5">Inter.</div>
              <div className="text-xl font-black text-white">{questions.filter(q => q.tier === 'Intermediate').length || 9}</div>
              <div className="text-[10px] text-slate-500">Medium Tier</div>
            </div>
            <div className="bg-ink-950/60 border border-ink-800 rounded-2xl p-3.5 text-center min-w-[90px]">
              <div className="text-xs text-rose-400 font-bold uppercase tracking-wider mb-0.5">Advanced</div>
              <div className="text-xl font-black text-white">{questions.filter(q => q.tier === 'Advanced').length || 8}</div>
              <div className="text-[10px] text-slate-500">Hard Tier</div>
            </div>
          </div>
        </div>

        {/* Non-coding Note Banner */}
        {!isCodingTopic && !loading && (
          <div className="mt-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Topic Notice: </span>
              This feature works best with programming/DSA topics. We generated general algorithmic & logic practice questions based on "{topic}".
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-ink-900/60 p-3 rounded-2xl border border-ink-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter questions by title or keyword..."
            className="w-full bg-ink-950 border border-ink-700/60 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-ink-950 p-1 rounded-xl border border-ink-700/60 text-xs">
            {(['All', 'Basic', 'Intermediate', 'Advanced'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setActiveTierFilter(tier)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTierFilter === tier
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-ink-800 hidden sm:block" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => setAllSections(true)}
              className="px-2.5 py-1.5 rounded-lg bg-ink-950 hover:bg-ink-850 text-slate-400 hover:text-slate-200 text-xs font-medium border border-ink-800"
            >
              Expand All
            </button>
            <button
              onClick={() => setAllSections(false)}
              className="px-2.5 py-1.5 rounded-lg bg-ink-950 hover:bg-ink-850 text-slate-400 hover:text-slate-200 text-xs font-medium border border-ink-800"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="glass rounded-3xl p-12 text-center border border-ink-700/50 space-y-4 my-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto text-brand-400 animate-pulse">
            <Code className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
              Generating practice questions for {topic}...
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Curating 25 tiered coding problems (8 Basic, 9 Intermediate, 8 Advanced) and matching priority practice links from LeetCode and GeeksforGeeks...
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <div className="h-1.5 w-12 bg-brand-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 w-1/2 animate-pulse" />
            </div>
          </div>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center border border-ink-700/50 space-y-3">
          <Filter className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No questions match your filter</h3>
          <p className="text-xs text-slate-400">Try clearing your search query or changing the difficulty tier filter.</p>
          <button
            onClick={() => { setSearchQuery(''); setActiveTierFilter('All'); }}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Accordion Sections */
        <div className="space-y-6">
          {/* 1. BASIC SECTION */}
          {(activeTierFilter === 'All' || activeTierFilter === 'Basic') && basicList.length > 0 && (
            <SectionAccordion
              title="Basic Questions"
              subtitle="Fundamental operations, core definitions, and basic traversals"
              count={basicList.length}
              badgeColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              icon={TIER_ICONS.Basic}
              isOpen={expandedSections.Basic}
              onToggle={() => toggleSection('Basic')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {basicList.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={idx + 1}
                    isTracked={trackedIds.has(q.id)}
                    isTracking={trackingLoading === q.id}
                    onTrack={() => handleAddToDsaTracker(q)}
                  />
                ))}
              </div>
            </SectionAccordion>
          )}

          {/* 2. INTERMEDIATE SECTION */}
          {(activeTierFilter === 'All' || activeTierFilter === 'Intermediate') && intList.length > 0 && (
            <SectionAccordion
              title="Intermediate Questions"
              subtitle="Combining concepts, multi-pointer strategies, and standard patterns"
              count={intList.length}
              badgeColor="text-amber-400 bg-amber-500/10 border-amber-500/20"
              icon={TIER_ICONS.Intermediate}
              isOpen={expandedSections.Intermediate}
              onToggle={() => toggleSection('Intermediate')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {intList.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={idx + 1}
                    isTracked={trackedIds.has(q.id)}
                    isTracking={trackingLoading === q.id}
                    onTrack={() => handleAddToDsaTracker(q)}
                  />
                ))}
              </div>
            </SectionAccordion>
          )}

          {/* 3. ADVANCED SECTION */}
          {(activeTierFilter === 'All' || activeTierFilter === 'Advanced') && advList.length > 0 && (
            <SectionAccordion
              title="Advanced Questions"
              subtitle="Tricky edge cases, hard optimizations, and multi-concept designs"
              count={advList.length}
              badgeColor="text-rose-400 bg-rose-500/10 border-rose-500/20"
              icon={TIER_ICONS.Advanced}
              isOpen={expandedSections.Advanced}
              onToggle={() => toggleSection('Advanced')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {advList.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={idx + 1}
                    isTracked={trackedIds.has(q.id)}
                    isTracking={trackingLoading === q.id}
                    onTrack={() => handleAddToDsaTracker(q)}
                  />
                ))}
              </div>
            </SectionAccordion>
          )}
        </div>
      )}
    </div>
  );
}

// Accordion Component for collapsible tier sections
function SectionAccordion({
  title,
  subtitle,
  count,
  badgeColor,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  subtitle: string;
  count: number;
  badgeColor: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl border border-ink-700/60 overflow-hidden bg-ink-900/40">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-ink-850/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-white">{title}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
                {count} Questions
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="p-1.5 rounded-lg bg-ink-950 border border-ink-800 text-slate-400">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && <div className="p-5 border-t border-ink-800/80 bg-ink-950/30">{children}</div>}
    </div>
  );
}

// Question Card Component
function QuestionCard({
  question,
  index,
  isTracked,
  isTracking,
  onTrack,
}: {
  question: PracticeQuestion;
  index: number;
  isTracked: boolean;
  isTracking: boolean;
  onTrack: () => void;
}) {
  const isLeetCode = question.platform.toLowerCase().includes('leetcode');
  const isGFG = question.platform.toLowerCase().includes('geeks');

  return (
    <div className="bg-ink-900/80 border border-ink-700/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-ink-600 transition-all hover:shadow-lg hover:shadow-black/20 group">
      <div className="space-y-2.5">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-ink-950 border border-ink-800 text-slate-400 text-xs font-bold flex items-center justify-center">
              #{index}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${DIFFICULTY_STYLES[question.difficulty]}`}>
              {question.difficulty}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 bg-ink-950 px-2 py-0.5 rounded-md border border-ink-800">
              {question.tier}
            </span>
          </div>

          <span className="text-[10px] text-slate-500 font-mono">
            {question.platform}
          </span>
        </div>

        {/* Question Title & Description */}
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-brand-300 transition-colors leading-snug">
            {question.title}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed mt-1 line-clamp-3">
            {question.description}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 mt-3 border-t border-ink-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority Practice Link */}
          <a
            href={question.practiceUrl}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
              isLeetCode
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                : isGFG
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-brand-600/10 hover:bg-brand-600/20 text-brand-300 border-brand-500/30'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Practice on {question.platform}</span>
          </a>

          {/* Alternative Practice Link */}
          {question.alternativePracticeUrl && (
            <a
              href={question.alternativePracticeUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg bg-ink-950 border border-ink-800 transition-colors"
            >
              <span>Alt: {question.alternativePlatform || 'GeeksforGeeks'}</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          )}
        </div>

        {/* 1-click Add to DSA Tracker */}
        <button
          onClick={onTrack}
          disabled={isTracked || isTracking}
          className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
            isTracked
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-ink-950 hover:bg-ink-850 text-slate-300 hover:text-white border border-ink-750'
          }`}
          title="Track problem in your DSA Tracker"
        >
          {isTracking ? (
            <Loader2 className="w-3 h-3 animate-spin text-brand-400" />
          ) : isTracked ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Tracked</span>
            </>
          ) : (
            <>
              <Plus className="w-3 h-3 text-slate-400" />
              <span>Track in DSA</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
