import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, FileText, Trash2, Save, Loader2, Send, Sparkles, BookOpen,
  CheckSquare, SpellCheck, MessageSquare, Wrench, AlertCircle, Check, Upload, X,
  Lightbulb, Bookmark, Award, CheckCircle, Code
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { createPortal } from 'react-dom';

interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type AITab = 'chat' | 'tools';
type ToolId = 'summarize' | 'deep_summary' | 'detailed_analysis' | 'flashcards' | 'grammar';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

// Helper function to scan text for ```mermaid blocks and render them as images via mermaid.ink
function FormattedTextWithDiagrams({ text }: { text: string }) {
  if (!text) return null;

  // Split text by ```mermaid ... ``` blocks
  const parts = text.split(/(```mermaid[\s\S]*?```)/g);

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.startsWith('```mermaid') && part.endsWith('```')) {
          const code = part
            .replace(/^```mermaid/, '')
            .replace(/```$/, '')
            .trim();

          let imageUrl = '';
          try {
            const cleanCode = code;
            const encoded = btoa(unescape(encodeURIComponent(cleanCode)));
            imageUrl = `https://mermaid.ink/img/${encoded}`;
          } catch (err) {
            console.error("Failed to encode Mermaid diagram:", err);
          }

          if (!imageUrl) {
            return (
              <pre key={index} className="bg-ink-850 dark:bg-slate-900 text-slate-800 dark:text-slate-300 p-3 rounded-lg overflow-x-auto text-xs font-mono border border-ink-700/40">
                {code}
              </pre>
            );
          }

          return (
            <div key={index} className="my-5 bg-ink-850 rounded-xl p-5 border border-ink-700 flex flex-col items-center shadow-lg">
              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-3 select-none">AI Diagram View</span>
              <img
                src={imageUrl}
                alt="AI Generated Diagram"
                className="max-w-full h-auto rounded-lg bg-white/5 p-2 border border-slate-800/30"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <details className="w-full mt-3 border-t border-slate-800/80 pt-2.5">
                <summary className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 cursor-pointer focus:outline-none select-none">
                  Show Source Code
                </summary>
                <pre className="mt-2 text-left bg-ink-850 dark:bg-slate-950 text-slate-800 dark:text-slate-300 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-ink-700/40">
                  {code}
                </pre>
              </details>
            </div>
          );
        }

        return (
          <div 
            key={index} 
            className="leading-relaxed space-y-1"
            dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(part) }}
          />
        );
      })}
    </div>
  );
}

function parseInlineMarkdown(text: string): string {
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-white">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-200">$1</em>');
  html = html.replace(/`(.*?)`/g, '<code class="bg-ink-950/80 px-1.5 py-0.5 rounded text-xs font-mono text-brand-300 border border-ink-800/50">$1</code>');
  return html;
}

function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  const lines = markdown.split('\n');
  let html = '';

  let inUl = false;
  let inOl = false;

  function closeLists() {
    if (inUl) {
      html += '</ul>';
      inUl = false;
    }
    if (inOl) {
      html += '</ol>';
      inOl = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      closeLists();
      continue;
    }

    // Skip wrapping custom HTML/mermaid elements
    if (trimmed.startsWith('<')) {
      closeLists();
      html += line + '\n';
      continue;
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      closeLists();
      html += '<hr class="border-slate-800/60 my-4" />';
      continue;
    }

    if (trimmed.startsWith('#')) {
      closeLists();
      const level = trimmed.match(/^#+/)?.[0].length ?? 1;
      const text = trimmed.replace(/^#+\s*/, '');
      const parsedText = parseInlineMarkdown(text);
      if (level === 1) {
        html += `<h4 class="text-base font-extrabold text-brand-300 mt-5 mb-2.5 tracking-tight font-sans uppercase">${parsedText}</h4>`;
      } else if (level === 2) {
        html += `<h5 class="text-sm font-bold text-slate-100 mt-4.5 mb-2 border-b border-slate-800/80 pb-1.5 font-sans">${parsedText}</h5>`;
      } else {
        html += `<h6 class="text-xs font-bold text-slate-200 mt-3.5 mb-1.5 uppercase tracking-wider flex items-baseline gap-1.5 border-l-2 border-brand-500 pl-2 bg-brand-500/5 py-1 rounded font-sans">${parsedText}</h6>`;
      }
      continue;
    }

    // Unordered list items: * item or - item
    const ulMatch = line.match(/^(\s*)([\*\-\+])\s+(.*)$/);
    if (ulMatch) {
      if (inOl) {
        html += '</ol>';
        inOl = false;
      }
      if (!inUl) {
        html += '<ul class="list-disc pl-5 mb-3.5 space-y-1.5 text-slate-300 text-sm leading-relaxed">';
        inUl = true;
      }
      const content = ulMatch[3];
      const parsedContent = parseInlineMarkdown(content);
      html += `<li>${parsedContent}</li>`;
      continue;
    }

    // Ordered list items: 1. item
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (inUl) {
        html += '</ul>';
        inUl = false;
      }
      if (!inOl) {
        html += '<ol class="list-decimal pl-5 mb-3.5 space-y-1.5 text-slate-300 text-sm leading-relaxed">';
        inOl = true;
      }
      const content = olMatch[3];
      const parsedContent = parseInlineMarkdown(content);
      html += `<li>${parsedContent}</li>`;
      continue;
    }

    const parsedText = parseInlineMarkdown(trimmed);
    closeLists();
    html += `<p class="mb-2.5 text-slate-350 text-sm leading-relaxed">${parsedText}</p>`;
  }

  closeLists();
  return html;
}

// Convert ```mermaid code blocks in rich notes content into clean HTML image tags before inserting into editor
function processMermaidInHtml(text: string): string {
  if (!text) return '';

  const regex = /```mermaid([\s\S]*?)```/g;

  return text.replace(regex, (_, code) => {
    const cleanCode = code.trim();
    try {
      const encoded = btoa(unescape(encodeURIComponent(cleanCode)));
      const imageUrl = `https://mermaid.ink/img/${encoded}`;
      return `<div class="ai-diagram" contenteditable="false" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; max-width: 100%;">
        <span style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; display: block; user-select: none;">AI Generated Diagram</span>
        <img src="${imageUrl}" alt="AI Diagram" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); background: white; padding: 8px; border: 1px solid #e2e8f0;" />
      </div>`;
    } catch (err) {
      return `<pre style="background: #0f172a; color: #cbd5e1; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 12px; overflow-x: auto;">${cleanCode}</pre>`;
    }
  });
}

export default function NotesGenerator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [explainInPoints, setExplainInPoints] = useState(false);
  
  // Search topic modal states
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTopic, setSearchTopic] = useState('');
  const [searching, setSearching] = useState(false);

  // Topic classification gate states
  const [checkingTopic, setCheckingTopic] = useState(false);
  const [nonCodingWarning, setNonCodingWarning] = useState<{
    show: boolean;
    title: string;
    reason?: string;
  } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const activeNote = notes.find((n) => n.id === activeId) ?? null;

  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'documents' | 'note' | 'aitools'>('documents');

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load notes list
  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from('notes')
        .select('id, user_id, title, content, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      const list = (data as Note[]) ?? [];
      setNotes(list);
      if (list.length > 0) {
        selectNote(list[0]);
        // Land directly on 'note' tab if there is a note initially loaded
        setActiveTab('note');
      }
      setLoadingNotes(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function selectNote(note: Note) {
    setActiveId(note.id);
    setTitle(note.title);
    if (editorRef.current) {
      editorRef.current.innerHTML = note.content ?? '';
    }
    setActiveTab('note');
  }

  // Save current note text
  async function saveNote(noteId: string) {
    if (!editorRef.current || saving) return;
    setSaving(true);
    const content = editorRef.current.innerHTML;
    try {
      await supabase
        .from('notes')
        .update({
          title: title.trim() || 'Untitled Note',
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId);

      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId ? { ...n, title: title.trim() || 'Untitled Note', content } : n
        )
      );
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSaving(false);
    }
  }

  // Create new blank note
  async function handleCreateNote() {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: 'New Note',
          content: '<p>Start typing your study notes here...</p>'
        })
        .select('*')
        .maybeSingle();

      if (data) {
        const note = data as Note;
        setNotes((prev) => [note, ...prev]);
        selectNote(note);
      }
    } catch (err) {
      console.error('Failed to create new note:', err);
    }
  }

  // Delete note
  async function handleDeleteNote(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await supabase.from('notes').delete().eq('id', id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setTitle('');
        if (editorRef.current) editorRef.current.innerHTML = '';
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  }

  // Parse uploaded PDF and extract notes
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || uploading) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert("Unsupported file type. Please upload a PDF file only.");
      return;
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
    if (file.size > MAX_FILE_SIZE) {
      alert("Selected PDF is too large. Please upload a document smaller than 10MB to avoid server timeouts.");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      // Show transcribing loader in the current editor view
      if (editorRef.current) {
        editorRef.current.innerHTML = '<p class="text-slate-400 italic">Transcribing PDF notes via AI...</p>';
      }

      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'ocr',
          image: base64,
          mimeType: 'application/pdf',
          pointExplanation: explainInPoints,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'PDF transcription failed');
      }

      const content = data.result;
      const formattedHtml = parseMarkdownToHtml(content);
      const processedContent = processMermaidInHtml(formattedHtml);

      // Save note to database
      const titleName = file.name.replace(/\.[^/.]+$/, "");
      const { data: noteData } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: titleName,
          content: processedContent
        })
        .select('*')
        .maybeSingle();

      if (noteData) {
        const note = noteData as Note;
        setNotes((prev) => [note, ...prev]);
        selectNote(note);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload and parse PDF file.");
    } finally {
      setUploading(false);
    }
  }

  async function handleTopicSearch(e: FormEvent) {
    e.preventDefault();
    if (!searchTopic.trim() || !user || searching) return;

    setSearching(true);
    try {
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'generate_topic_notes',
          topic: searchTopic.trim(),
          pointExplanation: explainInPoints,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Failed to generate notes');
      }

      const content = data.result;
      const formattedHtml = parseMarkdownToHtml(content);
      const processedContent = processMermaidInHtml(formattedHtml);

      // Save note to database
      const { data: noteData } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: searchTopic.trim(),
          content: processedContent
        })
        .select('*')
        .maybeSingle();

      if (noteData) {
        const note = noteData as Note;
        setNotes((prev) => [note, ...prev]);
        selectNote(note);
        setSearchTopic('');
        setShowSearchModal(false);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate notes.");
    } finally {
      setSearching(false);
    }
  }

  // Rich-text formatting
  function format(command: string, value?: string) {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }

  function getEditorText() {
    return editorRef.current?.innerText ?? '';
  }

  function exportNoteToPDF() {
    if (!activeNote || !editorRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to export as PDF.");
      return;
    }

    const noteTitle = title.trim() || 'Untitled Note';
    const noteHtml = editorRef.current.innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>${noteTitle}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1e293b;
              padding: 2.5cm;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              font-size: 24pt;
              margin-bottom: 20px;
              color: #0f172a;
              border-b: 1px solid #e2e8f0;
              padding-bottom: 10px;
            }
            .ai-diagram {
              background: #f8fafc !important;
              border: 1px solid #e2e8f0 !important;
              border-radius: 12px !important;
              padding: 16px !important;
              margin: 20px 0 !important;
              text-align: center !important;
              page-break-inside: avoid;
            }
            .ai-diagram img {
              max-width: 100% !important;
              height: auto !important;
            }
            details {
              display: none !important; /* Hide source code in PDF export */
            }
            @media print {
              body {
                padding: 0;
              }
              @page {
                size: A4;
                margin: 2.5cm;
              }
            }
          </style>
        </head>
        <body>
          <h1>${noteTitle}</h1>
          <div>${noteHtml}</div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  // Topic classification gate handler
  async function handleCodeQuestionsClick() {
    if (checkingTopic) return;
    const noteTitle = title.trim() || 'Untitled Note';
    const currentHtml = editorRef.current?.innerHTML || '';

    setCheckingTopic(true);
    try {
      const text = (noteTitle + ' ' + currentHtml.replace(/<[^>]*>/g, ' ')).toLowerCase();

      // 1. Fast Keyword Check
      const nonCodingKeywords = [
        'grammar', 'subject-verb', 'vass', 'punctuation', 'vocabulary', 'spelling', 
        'tense', 'verb', 'noun', 'preposition', 'literature', 'history', 'biology', 
        'chemistry', 'physics', 'economics', 'management', 'essay', 'writing skill'
      ];
      const codingKeywords = [
        'linked list', 'array', 'recursion', 'binary tree', 'stack', 'queue', 'graph', 
        'hash table', 'sorting', 'leetcode', 'geeksforgeeks', 'python', 'java', 'c++', 
        'javascript', 'react', 'sql', 'algorithm', 'dsa', 'data structure', 'pointer', 
        'heap', 'trie', 'greedy', 'backtracking', 'dynamic programming', 'operating system',
        'database', 'computer science', 'compiler', 'function', 'class', 'method'
      ];

      const hasNonCoding = nonCodingKeywords.some((k) => text.includes(k));
      const hasCoding = codingKeywords.some((k) => text.includes(k));

      if (hasNonCoding && !hasCoding) {
        setNonCodingWarning({
          show: true,
          title: noteTitle,
          reason: 'This note appears to focus on language/grammar rules rather than programming or DSA.',
        });
        return;
      }

      if (hasCoding && !hasNonCoding) {
        const topicParam = encodeURIComponent(noteTitle);
        const noteIdParam = activeId ? encodeURIComponent(activeId) : '';
        navigate(`/ai/notes/code-questions?topic=${topicParam}&noteId=${noteIdParam}`);
        return;
      }

      // 2. AI Classifier API Call for ambiguous/custom titles
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'classify_coding_topic',
          topic: noteTitle,
          noteContent: currentHtml,
        }),
      });

      const data = await res.json();
      if (res.ok && data.result) {
        const cleanJson = typeof data.result === 'string'
          ? data.result.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim()
          : data.result;
        const parsed = typeof cleanJson === 'string' ? JSON.parse(cleanJson) : cleanJson;

        if (parsed && parsed.isCodingTopic === false) {
          setNonCodingWarning({
            show: true,
            title: noteTitle,
            reason: parsed.reason || "This note doesn't appear to be a programming or DSA topic.",
          });
          return;
        }
      }

      // If classified as coding or default, navigate
      const topicParam = encodeURIComponent(noteTitle);
      const noteIdParam = activeId ? encodeURIComponent(activeId) : '';
      navigate(`/ai/notes/code-questions?topic=${topicParam}&noteId=${noteIdParam}`);
    } catch (err) {
      console.warn('Error during topic classification:', err);
      const topicParam = encodeURIComponent(noteTitle);
      const noteIdParam = activeId ? encodeURIComponent(activeId) : '';
      navigate(`/ai/notes/code-questions?topic=${topicParam}&noteId=${noteIdParam}`);
    } finally {
      setCheckingTopic(false);
    }
  }

  const hasActiveNote = !!activeNote;

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 px-4 md:px-6 py-3 md:py-4 border-b border-ink-700/50 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-ink-950/20">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-white tracking-tight">AI Notes Generator</h1>
          <p className="text-sm text-slate-500 hidden md:block">Write notes, then let AI summarize, flashcard, and answer questions.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Explain in points checkbox option */}
          <label className="flex items-center gap-2 cursor-pointer select-none border border-ink-800 bg-ink-900/40 px-3 py-2 rounded-lg hover:border-brand-500/20 transition-all">
            <input
              type="checkbox"
              checked={explainInPoints}
              onChange={(e) => setExplainInPoints(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-ink-600 bg-ink-800 text-brand-600 focus:ring-brand-500/30"
            />
            <span className="text-[11px] font-semibold text-slate-300 hover:text-slate-200">Explain in Points</span>
          </label>

          {/* Upload PDF Only */}
          <label className="flex items-center gap-2 bg-ink-850 hover:bg-ink-800 border border-ink-700/60 hover:border-brand-500/30 text-slate-300 hover:text-white text-xs md:text-sm font-medium px-3 md:px-4 py-2 rounded-lg cursor-pointer transition-all">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-brand-400" /> : <Upload className="w-4 h-4 text-brand-400" />}
            <span>{uploading ? 'Transcribing...' : 'Upload PDF (Max 10MB)'}</span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>

          {/* Search Topic Button */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-xs md:text-sm font-medium px-3 md:px-4 py-2 rounded-lg transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Search Topic</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar Selector */}
      <div className="md:hidden shrink-0 border-b border-ink-800/80 bg-ink-950/40 p-2 flex gap-1.5 select-none">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl border transition-all ${
            activeTab === 'documents'
              ? 'bg-brand-600/10 border-brand-500/20 text-brand-400'
              : 'bg-transparent border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          Documents
        </button>
        <button
          onClick={() => setActiveTab('note')}
          className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl border transition-all ${
            activeTab === 'note'
              ? 'bg-brand-600/10 border-brand-500/20 text-brand-400'
              : 'bg-transparent border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          Note
        </button>
        <button
          onClick={() => setActiveTab('aitools')}
          className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl border transition-all ${
            activeTab === 'aitools'
              ? 'bg-brand-600/10 border-brand-500/20 text-brand-400'
              : 'bg-transparent border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          AI Tools
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0 w-full relative">
        <div
          className="flex h-full w-[300%] md:w-full transition-transform duration-300 ease-in-out"
          style={{
            transform: isMobile
              ? `translateX(-${activeTab === 'documents' ? 0 : activeTab === 'note' ? 33.3333 : 66.6666}%)`
              : 'none'
          }}
        >
          {/* LEFT: Notes list sidebar */}
          <div className="w-[33.3333%] md:w-64 md:shrink-0 border-r border-ink-700/50 flex flex-col bg-ink-950/20 h-full shrink-0 overflow-hidden">
            <div className="p-4 shrink-0">
              <button
                onClick={handleCreateNote}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" /> New Document
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {loadingNotes ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
                </div>
              ) : notes.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No notes saved yet.</p>
              ) : (
                notes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`w-full group text-left px-3.5 py-3 rounded-xl flex items-center justify-between transition-all ${
                      activeId === note.id
                        ? 'bg-brand-600/10 border border-brand-500/20 text-white'
                        : 'hover:bg-white/5 border border-transparent text-slate-450'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className={`w-4 h-4 shrink-0 ${activeId === note.id ? 'text-brand-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-semibold truncate leading-none">{note.title || 'Untitled Note'}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="p-1 rounded text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* MIDDLE: Live Rich-text Editor */}
          <div className="w-[33.3333%] md:flex-1 flex flex-col bg-ink-950/40 p-4 md:p-6 min-w-0 h-full shrink-0 overflow-hidden">
            <div className="flex-1 glass rounded-2xl flex flex-col overflow-hidden border border-ink-700/50 bg-ink-950/20">
              {hasActiveNote ? (
                <>
                  {/* Editor header */}
                  <div className="shrink-0 px-4 md:px-6 py-3 md:py-4 border-b border-ink-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Note Title"
                      className="bg-transparent text-base md:text-lg font-bold text-white placeholder-slate-600 focus:outline-none flex-1 min-w-0"
                    />
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto animate-fadeIn">
                      {saving ? (
                        <span className="text-xs text-slate-550 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</span>
                      ) : savedAt ? (
                        <span className="text-xs text-emerald-455/80 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Saved {savedAt}</span>
                      ) : null}
                      <button
                        onClick={() => saveNote(activeId!)}
                        className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
                      >
                        <Save className="w-4 h-4" /> Save
                      </button>
                      <button
                        onClick={exportNoteToPDF}
                        className="flex items-center gap-1.5 bg-brand-600/10 hover:bg-brand-600/20 text-brand-300 border border-brand-500/20 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                      >
                        Export PDF
                      </button>
                      <button
                        onClick={handleCodeQuestionsClick}
                        disabled={checkingTopic}
                        className="flex items-center gap-1.5 bg-brand-600/10 hover:bg-brand-600/20 disabled:opacity-60 text-brand-300 border border-brand-500/20 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                        title="Generate practice coding questions for this topic"
                      >
                        {checkingTopic ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                            <span>Checking topic...</span>
                          </>
                        ) : (
                          <>
                            <Code className="w-4 h-4" />
                            <span>Code Questions</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Text styling toolbar */}
                  <div className="shrink-0 px-4 md:px-6 py-2 border-b border-ink-800 bg-ink-900/40 flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-none">
                    <ToolbarBtn onClick={() => format('bold')} label="B" className="font-bold" />
                    <ToolbarBtn onClick={() => format('italic')} label="I" className="italic font-serif" />
                    <ToolbarBtn onClick={() => format('underline')} label="U" className="underline" />
                    <ToolbarBtn onClick={() => format('strikeThrough')} label="S" className="line-through" />
                    <div className="h-4 w-px bg-ink-800 mx-0.5" />
                    <ToolbarBtn onClick={() => format('insertOrderedList')} label="1." />
                    <ToolbarBtn onClick={() => format('insertUnorderedList')} label="•" />
                    <div className="h-4 w-px bg-ink-800 mx-0.5" />
                    <ToolbarBtn onClick={() => format('justifyLeft')} label="Left" />
                    <ToolbarBtn onClick={() => format('justifyCenter')} label="Center" />
                    <ToolbarBtn onClick={() => format('justifyRight')} label="Right" />
                  </div>

                  {/* Editor content block */}
                  <div
                    ref={editorRef}
                    contentEditable
                    className="flex-1 p-4 md:p-6 text-slate-300 text-sm focus:outline-none overflow-y-auto whitespace-pre-wrap select-text scrollbar-thin"
                    style={{ minHeight: '200px' }}
                  />
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
                  <BookOpen className="w-12 h-12 text-brand-500/30 mb-3" />
                  <p className="text-sm font-semibold">No document active</p>
                  <p className="text-xs text-slate-600 mt-1 max-w-xs">
                    Click "New Document", "Upload PDF", or "Search Topic" to start. Your notes save to your account automatically.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: AI Assistant */}
          <div className="w-[33.3333%] md:w-80 md:shrink-0 flex flex-col h-full shrink-0 overflow-hidden">
            <AIPanel getEditorText={getEditorText} hasActiveNote={!!activeNote} className="w-full h-full border-l border-ink-700/50" />
          </div>
        </div>
      </div>

      {/* Search Topic Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass w-full max-w-md border border-ink-700/60 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-ink-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-400" /> Search & Generate Notes
              </h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTopicSearch} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Topic Name
                </label>
                <input
                  value={searchTopic}
                  onChange={(e) => setSearchTopic(e.target.value)}
                  placeholder="e.g. TCP vs UDP, Quantum Computing, Photosynthesis..."
                  className="w-full bg-ink-850 border border-ink-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                  required
                  autoFocus
                />
              </div>

              {/* Explain in points checkbox option inside search modal */}
              <div className="pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-ink-800/60 border border-ink-700/50 cursor-pointer hover:border-brand-500/30 transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={explainInPoints}
                    onChange={(e) => setExplainInPoints(e.target.checked)}
                    className="w-4 h-4 rounded border-ink-600 bg-ink-800 text-brand-600 focus:ring-brand-500/30"
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-200">Point Explanation Mode</p>
                    <p className="text-[10px] text-slate-500">Explain the entire notes content in structured points</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="px-4 py-2 bg-ink-800 hover:bg-ink-700 text-slate-300 font-medium rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={searching || !searchTopic.trim()}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm flex items-center gap-2 transition-colors"
                >
                  {searching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Notes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Non-Coding Topic Warning Modal */}
      {nonCodingWarning?.show && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-ink-900 border border-amber-500/30 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Non-Coding Topic Detected</h3>
                <p className="text-xs text-amber-400 font-semibold truncate max-w-[240px]">{nonCodingWarning.title}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed bg-ink-950/60 p-4 rounded-2xl border border-ink-800">
              <p className="font-medium text-white">
                This note doesn't appear to be a programming or Data Structures topic.
              </p>
              <p className="text-slate-400">
                Code Questions works best with DSA, algorithms, software engineering, or programming language notes (e.g., Linked List, Arrays, Recursion, Python).
              </p>
              {nonCodingWarning.reason && (
                <div className="pt-2.5 border-t border-ink-800/80 text-[11px] text-amber-300">
                  <span className="font-bold text-amber-400">Topic Analysis:</span> {nonCodingWarning.reason}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setNonCodingWarning(null)}
                className="px-4 py-2 bg-ink-800 hover:bg-ink-750 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Back to Notes
              </button>
              <button
                onClick={() => {
                  const topicParam = encodeURIComponent(nonCodingWarning.title);
                  const noteIdParam = activeId ? encodeURIComponent(activeId) : '';
                  setNonCodingWarning(null);
                  navigate(`/ai/notes/code-questions?topic=${topicParam}&noteId=${noteIdParam}`);
                }}
                className="px-4 py-2 bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 text-xs font-bold rounded-xl transition-colors"
              >
                Generate Anyway
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function ToolbarBtn({ onClick, label, className = '' }: { onClick: () => void; label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 min-w-[2rem] h-8 text-xs font-medium bg-ink-800 hover:bg-ink-700 hover:text-white rounded-lg text-slate-400 flex items-center justify-center transition-colors ${className}`}
    >
      {label}
    </button>
  );
}

/* ============ AI Assistant Right Sidebar panel ============ */

function AIPanel({ getEditorText, hasActiveNote, className = '' }: { getEditorText: () => string; hasActiveNote: boolean; className?: string }) {
  const [tab, setTab] = useState<AITab>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [useContext, setUseContext] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [toolResult, setToolResult] = useState<string | null>(null);
  const [toolRunning, setToolRunning] = useState<ToolId | null>(null);
  const [toolError, setToolError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // States for interactive Flashcards & Quiz Study Center
  const [isStudyCenterOpen, setIsStudyCenterOpen] = useState(false);
  const [studyCenterTab, setStudyCenterTab] = useState<'flashcards' | 'quiz'>('flashcards');
  const [flashcardsData, setFlashcardsData] = useState<{ front: string; back: string }[] | null>(null);
  const [quizData, setQuizData] = useState<{ question: string; options: string[]; correctIndex: number; explanation: string }[] | null>(null);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [flashcardError, setFlashcardError] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);

  // States for card progression
  const [currentCardIdx, setCurrentCardIdx] = useState(0);

  // States for quiz progression
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [quizTimeTaken, setQuizTimeTaken] = useState<number>(0);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [questionTimestamps, setQuestionTimestamps] = useState<number[]>([]);
  const [questionTimesSpent, setQuestionTimesSpent] = useState<number[]>([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function callAI(action: string, payload: Record<string, unknown>) {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error ?? `Request failed (${res.status})`);
    }
    return data.result as string;
  }

  async function sendChat(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setSending(true);
    setChatError(null);
    try {
      const apiMessages = history.map((m) => ({ role: m.role, content: m.content }));
      const result = await callAI('chat', {
        messages: apiMessages,
        useContext,
        noteContent: useContext ? getEditorText() : undefined,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: result }]);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Failed to get AI response.');
    }
    setSending(false);
  }

  async function runTool(id: ToolId) {
    if (!hasActiveNote) return;
    setToolRunning(id);
    setToolError(null);
    setToolResult(null);
    try {
      const result = await callAI(id, { noteContent: getEditorText() });
      setToolResult(result);
    } catch (err) {
      setToolError(err instanceof Error ? err.message : 'Tool failed.');
    } finally {
      setToolRunning(null);
    }
  }

  function parseJSONResponse<T>(raw: string): T {
    let clean = raw.trim();
    if (clean.startsWith('```json')) {
      clean = clean.substring(7);
    } else if (clean.startsWith('```')) {
      clean = clean.substring(3);
    }
    if (clean.endsWith('```')) {
      clean = clean.substring(0, clean.length - 3);
    }
    clean = clean.trim();
    return JSON.parse(clean) as T;
  }

  async function generateFlashcards() {
    setGeneratingFlashcards(true);
    setFlashcardError(null);
    try {
      const result = await callAI('flashcards', { noteContent: getEditorText() });
      const data = parseJSONResponse<{ front: string; back: string }[]>(result);
      setFlashcardsData(data);
      setCurrentCardIdx(0);
    } catch (err) {
      console.error(err);
      setFlashcardError('Failed to generate flashcards. Please try again.');
    } finally {
      setGeneratingFlashcards(false);
    }
  }

  async function generateQuiz() {
    setGeneratingQuiz(true);
    setQuizError(null);
    try {
      const result = await callAI('quiz', { noteContent: getEditorText() });
      const data = parseJSONResponse<{ question: string; options: string[]; correctIndex: number; explanation: string }[]>(result);
      setQuizData(data);
      setQuizAnswers(new Array(data.length).fill(-1));
      setQuizSubmitted(false);
      setCurrentQuizIdx(0);
      setQuizStartTime(Date.now());
      const now = Date.now();
      setQuestionTimestamps(new Array(data.length).fill(now));
      setQuestionTimesSpent(new Array(data.length).fill(0));
    } catch (err) {
      console.error(err);
      setQuizError('Failed to generate quiz. Please try again.');
    } finally {
      setGeneratingQuiz(false);
    }
  }

  const navigateQuestion = (targetIdx: number) => {
    if (quizStartTime !== null) {
      const now = Date.now();
      const elapsed = (now - questionTimestamps[currentQuizIdx]) / 1000;
      setQuestionTimesSpent(prev => {
        const copy = [...prev];
        copy[currentQuizIdx] = Math.round((copy[currentQuizIdx] || 0) + elapsed);
        return copy;
      });
      setQuestionTimestamps(prev => {
        const copy = [...prev];
        copy[targetIdx] = now;
        return copy;
      });
    }
  };

  const renderFlashcardsContent = () => {
    if (flashcardsData === null) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <BookOpen className="w-10 h-10 text-brand-500/20" />
          <div>
            <h4 className="text-sm font-bold text-slate-255">Generate Quick Revision Flashcards</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">AI will analyze your notes and create colorful study cards with concise standalone revision snippets.</p>
          </div>
          {flashcardError && <p className="text-xs text-rose-455">{flashcardError}</p>}
          <button
            onClick={generateFlashcards}
            disabled={generatingFlashcards}
            className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50 border border-brand-500/30 rounded-xl transition-all shadow-[0_4px_15px_rgba(99,102,241,0.25)] active:scale-95 cursor-pointer flex items-center gap-2"
          >
            {generatingFlashcards && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {generatingFlashcards ? "Generating..." : "Generate Flashcards"}
          </button>
        </div>
      );
    }

    const CARD_PALETTES = [
      {
        bg: "bg-[#e0f2f1] border-teal-300",
        textTopic: "text-teal-955",
        textContent: "text-teal-900",
        textMuted: "text-teal-800/80",
        iconBg: "bg-teal-650/10",
        iconColor: "text-teal-800"
      },
      {
        bg: "bg-[#f3e5f5] border-purple-300",
        textTopic: "text-purple-955",
        textContent: "text-purple-900",
        textMuted: "text-purple-800/80",
        iconBg: "bg-purple-650/10",
        iconColor: "text-purple-800"
      },
      {
        bg: "bg-[#ffebee] border-rose-300",
        textTopic: "text-rose-955",
        textContent: "text-rose-900",
        textMuted: "text-rose-800/80",
        iconBg: "bg-rose-655/10",
        iconColor: "text-rose-800"
      },
      {
        bg: "bg-[#fff8e1] border-amber-300",
        textTopic: "text-amber-955",
        textContent: "text-amber-900",
        textMuted: "text-amber-800/80",
        iconBg: "bg-amber-655/10",
        iconColor: "text-amber-850"
      },
      {
        bg: "bg-[#e3f2fd] border-blue-300",
        textTopic: "text-blue-955",
        textContent: "text-blue-900",
        textMuted: "text-blue-800/80",
        iconBg: "bg-blue-650/10",
        iconColor: "text-blue-800"
      },
      {
        bg: "bg-[#fce4ec] border-pink-300",
        textTopic: "text-pink-955",
        textContent: "text-pink-900",
        textMuted: "text-pink-800/80",
        iconBg: "bg-pink-650/10",
        iconColor: "text-pink-800"
      }
    ];

    const ICONS = [BookOpen, Lightbulb, Bookmark, Sparkles, Award, FileText, CheckCircle];

    const palette = CARD_PALETTES[currentCardIdx % CARD_PALETTES.length];
    const CardIcon = ICONS[currentCardIdx % ICONS.length];

    return (
      <div className="flex-1 flex flex-col justify-between min-h-0 space-y-4">
        {/* Card container */}
        <div className="flex-1 flex items-center justify-center min-h-0 py-4">
          <div 
            key={currentCardIdx}
            className={"w-full max-w-md aspect-[16/10] sm:aspect-[3/2] border rounded-2xl p-6 flex flex-col justify-between shadow-lg transition-all animate-card-slide " + palette.bg}
          >
            {/* Top Row: Topic and Icon */}
            <div className="flex items-start justify-between gap-4">
              <span 
                className={"text-[10px] font-extrabold uppercase tracking-wider select-none " + palette.textTopic}
                dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(flashcardsData[currentCardIdx]?.front || '') }}
              />
              <div className={"p-1.5 rounded-lg shrink-0 " + palette.iconBg}>
                <CardIcon className={"w-4 h-4 " + palette.iconColor} />
              </div>
            </div>

            {/* Middle Row: Revision statement */}
            <div className="flex-1 flex items-center justify-center py-4 overflow-y-auto">
              <div 
                className={"text-xs sm:text-sm font-semibold leading-relaxed text-center font-sans max-h-full scrollbar-thin select-text " + palette.textContent}
                dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(flashcardsData[currentCardIdx]?.back || '') }}
              />
            </div>

            {/* Bottom tag decoration */}
            <div className="flex justify-between items-center select-none pt-2 border-t border-black/5">
              <span className={"text-[9px] font-bold uppercase tracking-widest " + palette.textMuted}>
                Revision Snippet
              </span>
              <span className={"text-[9px] font-bold uppercase tracking-widest " + palette.textMuted}>
                StudentOS
              </span>
            </div>
          </div>
        </div>

        {/* Footer Nav */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
          <span className="text-xs font-semibold text-slate-450 select-none">
            Card {currentCardIdx + 1} of {flashcardsData.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setCurrentCardIdx(prev => Math.max(0, prev - 1));
              }}
              disabled={currentCardIdx === 0}
              className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-850 hover:bg-slate-750 disabled:opacity-40 border border-slate-800 rounded-lg transition-all"
            >
              Prev
            </button>
            <button
              onClick={() => {
                setCurrentCardIdx(prev => Math.min(flashcardsData.length - 1, prev + 1));
              }}
              disabled={currentCardIdx === flashcardsData.length - 1}
              className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-850 hover:bg-slate-750 disabled:opacity-40 border border-slate-800 rounded-lg transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderQuizContent = () => {
    if (quizData === null) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <Sparkles className="w-10 h-10 text-brand-500/20" />
          <div>
            <h4 className="text-sm font-bold text-slate-255">Take a Multiple-Choice Quiz</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">AI will analyze key rules and distinctions in your notes to generate a timed-feel 10-question quiz.</p>
          </div>
          {quizError && <p className="text-xs text-rose-450">{quizError}</p>}
          <button
            onClick={generateQuiz}
            disabled={generatingQuiz}
            className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50 border border-brand-500/30 rounded-xl transition-all shadow-[0_4px_15px_rgba(99,102,241,0.25)] active:scale-95 cursor-pointer flex items-center gap-2"
          >
            {generatingQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {generatingQuiz ? "Generating..." : "Generate Quiz"}
          </button>
        </div>
      );
    }

    if (!quizSubmitted) {
      return (
        <div className="flex-1 flex flex-col justify-between min-h-0 space-y-4">
          {/* Progress indicator */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-450 uppercase tracking-wider">
              <span>Question {currentQuizIdx + 1} of {quizData.length}</span>
              <span>{Math.round(((quizAnswers.filter(a => a !== -1).length) / quizData.length) * 100)}% Answered</span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-brand-500 h-1.5 transition-all duration-300"
                style={{ width: (((currentQuizIdx + 1) / quizData.length) * 100) + "%" }}
              />
            </div>
          </div>

          {/* Question and options */}
          <div className="flex-1 overflow-y-auto pr-1 py-2 space-y-4 min-h-0">
            <h4 
              className="text-sm font-bold text-slate-100 leading-snug"
              dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(quizData[currentQuizIdx]?.question || '') }}
            />
            
            <div className="grid grid-cols-1 gap-2.5">
              {quizData[currentQuizIdx]?.options.map((opt, oIdx) => {
                const isSelected = quizAnswers[currentQuizIdx] === oIdx;
                return (
                  <button
                    key={oIdx}
                    onClick={() => {
                      setQuizAnswers(prev => {
                        const copy = [...prev];
                        copy[currentQuizIdx] = oIdx;
                        return copy;
                      });
                    }}
                    className={"w-full text-left p-3.5 rounded-xl border text-xs font-semibold leading-relaxed transition-all flex items-center gap-3 " + (
                      isSelected 
                        ? 'bg-brand-550/10 border-brand-500 text-white shadow-md shadow-brand-500/5' 
                        : 'bg-ink-850 hover:bg-ink-800/60 border-ink-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                    )}
                  >
                    <div className={"w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-[10px] font-bold " + (
                      isSelected 
                        ? 'bg-brand-500 border-brand-500 text-white' 
                        : 'border-slate-700 text-slate-500'
                    )}>
                      {String.fromCharCode(65 + oIdx)}
                    </div>
                    <span 
                      className="flex-1"
                      dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(opt || '') }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Nav */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
            <div className="flex gap-2">
              <button
                onClick={() => navigateQuestion(Math.max(0, currentQuizIdx - 1))}
                disabled={currentQuizIdx === 0}
                className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-850 hover:bg-slate-750 disabled:opacity-40 border border-slate-800 rounded-lg transition-all"
              >
                Prev
              </button>
              <button
                onClick={() => navigateQuestion(Math.min(quizData.length - 1, currentQuizIdx + 1))}
                disabled={currentQuizIdx === quizData.length - 1}
                className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-850 hover:bg-slate-750 disabled:opacity-40 border border-slate-800 rounded-lg transition-all"
              >
                Next
              </button>
            </div>
            
            {currentQuizIdx === quizData.length - 1 ? (
              <button
                onClick={() => {
                  if (quizStartTime !== null) {
                    const now = Date.now();
                    const elapsed = (now - questionTimestamps[currentQuizIdx]) / 1000;
                    const finalTimesSpent = [...questionTimesSpent];
                    finalTimesSpent[currentQuizIdx] = Math.round((finalTimesSpent[currentQuizIdx] || 0) + elapsed);
                    setQuestionTimesSpent(finalTimesSpent);
                    setQuizTimeTaken(Math.round((now - quizStartTime) / 1000));
                  }
                  setQuizSubmitted(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-650 hover:bg-emerald-550 border border-emerald-500/25 rounded-xl transition-all shadow-[0_4px_15px_rgba(16,185,129,0.25)] cursor-pointer active:scale-95"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={() => navigateQuestion(currentQuizIdx + 1)}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-650 hover:bg-brand-550 border border-brand-500/20 rounded-xl transition-all shadow-md shadow-brand-500/5 cursor-pointer active:scale-95"
              >
                Next Question
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col min-h-0 space-y-4">
        {/* Overall Stats Banner */}
        <div className="bg-ink-850 border border-ink-700 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold dark:text-slate-100 text-slate-900">Quiz Completed!</h4>
            <p className="text-xs text-slate-500">You completed this 10-question evaluation in {Math.floor(quizTimeTaken / 60)}m {quizTimeTaken % 60}s.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-brand-550/10 border border-brand-500/30 rounded-xl px-4 py-2 text-center">
              <span className="text-[10px] font-bold text-brand-400 block uppercase tracking-wider">Score</span>
              <span className="text-lg font-black dark:text-white text-slate-900">
                {quizAnswers.reduce((acc, ans, idx) => acc + (ans === quizData[idx].correctIndex ? 1 : 0), 0)} / {quizData.length}
              </span>
            </div>
            <button
              onClick={generateQuiz}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white bg-ink-800 border border-ink-700 rounded-xl transition-all cursor-pointer active:scale-95"
            >
              Retake Quiz
            </button>
          </div>
        </div>

        {/* Scrollable breakdown */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin select-text">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Question Breakdown & Explanation</span>
          
          {quizData.map((item, idx) => {
            const userAnsIdx = quizAnswers[idx];
            const isCorrect = userAnsIdx === item.correctIndex;
            const spentTime = questionTimesSpent[idx] || 0;
            const needsReview = spentTime > 20;

            return (
              <div key={idx} className="bg-ink-850/60 border border-ink-700 rounded-2xl p-4 space-y-3">
                {/* Question Heading */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Question {idx + 1}</span>
                    <h5 
                      className="text-xs font-bold text-slate-105 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(item.question || '') }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {needsReview && (
                      <span className="text-[9px] font-bold text-amber-500 bg-amber-500/5 border border-amber-500/20 px-2 py-0.5 rounded-full select-none" title={"Spent " + spentTime + "s on this question"}>
                        Needs Review ({spentTime}s)
                      </span>
                    )}
                    {isCorrect ? (
                      <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 select-none"><Check className="w-2.5 h-2.5" /> Correct</span>
                    ) : (
                      <span className="text-[9px] font-bold text-rose-500 bg-rose-500/5 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 select-none"><X className="w-2.5 h-2.5" /> Incorrect</span>
                    )}
                  </div>
                </div>

                {/* Options review */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] leading-snug">
                  <div className={"p-2.5 rounded-lg border " + (
                    isCorrect ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-450' : 'bg-rose-500/5 border-rose-500/20 text-rose-450'
                  )}>
                    <span className="font-extrabold uppercase text-[9px] block text-slate-455 mb-0.5">Your Answer:</span>
                    {userAnsIdx !== -1 ? (
                      <span>
                        <span className="font-semibold">{String.fromCharCode(65 + userAnsIdx)}. </span>
                        <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(item.options[userAnsIdx] || '') }} />
                      </span>
                    ) : "No answer selected"}
                  </div>
                  {!isCorrect && (
                    <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/20 text-emerald-450 rounded-lg">
                      <span className="font-extrabold uppercase text-[9px] block text-slate-455 mb-0.5">Correct Answer:</span>
                      <span>
                        <span className="font-semibold">{String.fromCharCode(65 + item.correctIndex)}. </span>
                        <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(item.options[item.correctIndex] || '') }} />
                      </span>
                    </div>
                  )}
                </div>

                {/* Explanation block */}
                <div className="p-3 bg-slate-950/40 border border-slate-900/60 rounded-xl text-[11px] leading-relaxed text-slate-400">
                  <span className="font-bold text-brand-400 block mb-0.5 uppercase tracking-wider text-[9px]">Explanation</span>
                  <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(item.explanation || '') }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-ink-700/50 flex flex-col bg-ink-950/20 h-full ${className}`}>
      {/* Tabs */}
      <div className="shrink-0 p-4 border-b border-ink-800/60 flex gap-2">
        <button
          onClick={() => setTab('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${
            tab === 'chat'
              ? 'bg-brand-600/10 border-brand-500/20 text-white'
              : 'border-transparent hover:bg-white/5 text-slate-450'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> AI Chat
        </button>
        <button
          onClick={() => setTab('tools')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${
            tab === 'tools'
              ? 'bg-brand-600/10 border-brand-500/20 text-white'
              : 'border-transparent hover:bg-white/5 text-slate-450'
          }`}
        >
          <Wrench className="w-4 h-4" /> Study Tools
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {tab === 'chat' ? (
          <div className="h-full flex flex-col">
            {/* Context switch */}
            <div className="shrink-0 p-3 bg-ink-900/20 border-b border-ink-800 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">AI Context Mode</span>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useContext}
                  onChange={(e) => setUseContext(e.target.checked)}
                  disabled={!hasActiveNote}
                  className="w-3.5 h-3.5 rounded border-ink-600 bg-ink-800 text-brand-600 focus:ring-brand-500/30 disabled:opacity-50"
                />
                <span className={`text-[10px] font-semibold ${useContext && hasActiveNote ? 'text-brand-400' : 'text-slate-505'}`}>
                  Use Note Content
                </span>
              </label>
            </div>

            {/* Messages box */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin select-text">
              {messages.length === 0 && (
                <div className="text-center py-12 text-slate-500 max-w-[12rem] mx-auto space-y-2 select-none">
                  <Sparkles className="w-8 h-8 text-brand-500/20 mx-auto" />
                  <p className="text-xs">Ask questions about this note, request formulas, or brainstorm study topics!</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}>
                  <span className="text-[9px] font-bold text-slate-550 uppercase tracking-widest mb-1 select-none">
                    {m.role === 'user' ? 'You' : 'StudentOS AI'}
                  </span>
                  <div className={`text-xs p-3 rounded-xl max-w-[90%] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-ink-800 border border-ink-700 text-slate-200 rounded-tl-none'
                  }`}>
                    <FormattedTextWithDiagrams text={m.content} />
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex flex-col items-start animate-pulse">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">StudentOS AI</span>
                  <div className="bg-ink-800 border border-ink-700 p-3 rounded-xl rounded-tl-none text-xs text-slate-400 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" /> thinking...
                  </div>
                </div>
              )}
              {chatError && (
                <div className="flex items-start gap-1.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{chatError}</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={sendChat} className="shrink-0 p-3 border-t border-ink-800/60 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI assistant..."
                className="flex-1 bg-ink-850 border border-ink-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="p-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all shrink-0"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {!hasActiveNote ? (
              <div className="text-center py-12 text-slate-500 max-w-[12rem] mx-auto select-none">
                <Wrench className="w-8 h-8 text-brand-500/20 mx-auto mb-2" />
                <p className="text-xs">Open or create a note first to unlock Study Tools.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest select-none">Summarization & Analysis</span>
                  <div className="grid grid-cols-1 gap-2">
                    <ToolBtn onClick={() => runTool('summarize')} label="Brief Summary" desc="Short outline of key takeaways" running={toolRunning === 'summarize'} icon={<BookOpen className="w-4 h-4 text-brand-400" />} />
                    <ToolBtn onClick={() => runTool('deep_summary')} label="Detailed Summary" desc="In-depth outline of all concepts" running={toolRunning === 'deep_summary'} icon={<Sparkles className="w-4 h-4 text-brand-400" />} />
                    <ToolBtn onClick={() => runTool('detailed_analysis')} label="Detailed Analysis" desc="Analyze structure & formulas" running={toolRunning === 'detailed_analysis'} icon={<FileText className="w-4 h-4 text-brand-400" />} />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest select-none">Practice & Editing</span>
                  <div className="grid grid-cols-1 gap-2">
                    <ToolBtn 
                      onClick={() => {
                        setIsStudyCenterOpen(true);
                        setStudyCenterTab('flashcards');
                      }} 
                      label="Flashcards & Quiz" 
                      desc="Practice cards or multiple-choice quiz" 
                      running={generatingFlashcards || generatingQuiz} 
                      icon={<CheckSquare className="w-4 h-4 text-brand-400" />} 
                    />
                    <ToolBtn onClick={() => runTool('grammar')} label="Fix Grammar & Style" desc="Proofread spelling and formatting" running={toolRunning === 'grammar'} icon={<SpellCheck className="w-4 h-4 text-brand-400" />} />
                  </div>
                </div>

                {toolError && (
                  <div className="flex items-start gap-1.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{toolError}</span>
                  </div>
                )}

              </>
            )}
          </div>
        )}
      </div>

      {/* Study Tools Centered Modal */}
      {toolResult && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
          onClick={() => setToolResult(null)}
        >
          <div 
            className="w-full max-w-2xl bg-ink-900 border border-ink-700 shadow-2xl rounded-2xl p-6 relative flex flex-col max-h-[85vh] transition-all duration-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button in top-right */}
            <button 
              onClick={() => setToolResult(null)}
              className="absolute top-3 right-3 md:top-4 md:right-4 text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header / Title */}
            <div className="border-b border-slate-800/80 pb-3 mb-4 pr-10">
              <h3 className="text-xs font-bold text-brand-400 uppercase tracking-widest">Study Tool Output</h3>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto pr-1 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap scrollbar-thin select-text">
              <FormattedTextWithDiagrams text={toolResult} />
            </div>

            {/* Footer with actions */}
            <div className="border-t border-slate-800/80 pt-3 mt-4 flex justify-end gap-3">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(toolResult);
                  alert('Copied to clipboard!');
                }}
                className="text-xs font-extrabold text-white bg-brand-650 hover:bg-brand-550 border border-brand-500/20 px-4 py-2 rounded-xl transition-all shadow-md shadow-brand-500/5 cursor-pointer active:scale-95"
              >
                Copy Output
              </button>
              <button
                onClick={() => setToolResult(null)}
                className="text-xs font-extrabold text-slate-300 hover:text-white bg-[#2e2e38] hover:bg-slate-700 border border-slate-700/40 px-4 py-2 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Interactive Study Center (Flashcards & Quiz) Modal */}
      {isStudyCenterOpen && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
          onClick={() => setIsStudyCenterOpen(false)}
        >
          <div 
            className="w-full max-w-2xl bg-ink-900 border border-ink-700 shadow-2xl rounded-2xl p-6 relative flex flex-col max-h-[85vh] transition-all duration-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button in top-right */}
            <button 
              onClick={() => setIsStudyCenterOpen(false)}
              className="absolute top-3 right-3 md:top-4 md:right-4 text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with tabs */}
            <div className="border-b border-slate-800/80 pb-3 mb-5 pr-10 flex gap-4">
              <button
                onClick={() => setStudyCenterTab('flashcards')}
                className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${
                  studyCenterTab === 'flashcards' 
                    ? 'border-brand-500 text-brand-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Flashcards
              </button>
              <button
                onClick={() => setStudyCenterTab('quiz')}
                className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${
                  studyCenterTab === 'quiz' 
                    ? 'border-brand-500 text-brand-400' 
                    : 'border-transparent text-slate-450 hover:text-slate-200'
                }`}
              >
                Take a Quiz
              </button>
            </div>

            {/* Content Tab 1: Flashcards */}
            {studyCenterTab === 'flashcards' && (
              <div className="flex-1 flex flex-col min-h-0">
                {renderFlashcardsContent()}
              </div>
            )}

            {/* Content Tab 2: Quiz */}
            {studyCenterTab === 'quiz' && (
              <div className="flex-1 flex flex-col min-h-0">
                {renderQuizContent()}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function ToolBtn({
  onClick, label, desc, running, icon,
}: {
  onClick: () => void;
  label: string;
  desc: string;
  running: boolean;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={running}
      className="w-full text-left p-3 rounded-xl bg-ink-800/30 hover:bg-ink-800/60 border border-ink-700/30 hover:border-brand-500/20 flex items-start gap-3 transition-all disabled:opacity-50"
    >
      <div className="w-8 h-8 rounded-lg bg-brand-500/5 text-brand-400 flex items-center justify-center shrink-0 border border-brand-500/10 mt-0.5">{running ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}</div>
      <div>
        <p className="text-xs font-bold text-white">{label}</p>
        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{desc}</p>
      </div>
    </button>
  );
}
