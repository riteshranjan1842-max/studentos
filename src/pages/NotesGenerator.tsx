import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Plus, FileText, Trash2, Save, Loader2, Send, Sparkles, BookOpen,
  CheckSquare, SpellCheck, MessageSquare, Wrench, AlertCircle, Check,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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
type ToolId = 'summarize' | 'flashcards' | 'grammar';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export default function NotesGenerator() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const activeNote = notes.find((n) => n.id === activeId) ?? null;

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
      if (list.length > 0) selectNote(list[0]);
      setLoadingNotes(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function selectNote(note: Note) {
    setActiveId(note.id);
    setTitle(note.title);
    if (editorRef.current) editorRef.current.innerHTML = note.content ?? '';
    setSavedAt(null);
  }

  function getEditorText(): string {
    return editorRef.current?.innerHTML ?? '';
  }

  async function newDocument() {
    if (!user) return;
    const { data } = await supabase
      .from('notes')
      .insert({ user_id: user.id, title: 'Untitled', content: '' })
      .select('id, user_id, title, content, created_at, updated_at')
      .maybeSingle();
    if (data) {
      const note = data as Note;
      setNotes((prev) => [note, ...prev]);
      selectNote(note);
    }
  }

  async function saveNote() {
    if (!user || !activeId) return;
    setSaving(true);
    const content = getEditorText();
    const { data } = await supabase
      .from('notes')
      .update({ title: title.trim() || 'Untitled', content, updated_at: new Date().toISOString() })
      .eq('id', activeId)
      .select('id, user_id, title, content, created_at, updated_at')
      .maybeSingle();
    if (data) {
      const updated = data as Note;
      setNotes((prev) => [updated, ...prev.filter((n) => n.id !== activeId)]);
      setSavedAt(new Date().toLocaleTimeString());
    }
    setSaving(false);
  }

  async function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await supabase.from('notes').delete().eq('id', id);
    if (activeId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      if (remaining.length > 0) selectNote(remaining[0]);
      else {
        setActiveId(null);
        setTitle('');
        if (editorRef.current) editorRef.current.innerHTML = '';
      }
    }
  }

  // Rich-text formatting
  function format(command: string, value?: string) {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex flex-col">
      {/* Top bar */}
      <div className="shrink-0 px-6 py-4 border-b border-ink-700/50 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">AI Notes Generator</h1>
          <p className="text-sm text-slate-500">Write notes, then let AI summarize, flashcard, and answer questions.</p>
        </div>
        <button
          onClick={newDocument}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> New Document
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Editor */}
        <div className="flex-1 flex flex-col border-r border-ink-700/50 min-w-0">
          {/* Doc list sidebar */}
          <div className="w-full lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-ink-700/50 max-h-32 lg:max-h-none overflow-y-auto scrollbar-thin">
            <div className="p-3 space-y-1">
              {loadingNotes ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                </div>
              ) : notes.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No documents yet</p>
              ) : (
                notes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => selectNote(n)}
                    className={`group w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeId === n.id ? 'bg-brand-600/15 text-brand-200 border border-brand-500/20' : 'text-slate-400 hover:bg-ink-800/60 border border-transparent'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1 text-sm truncate">{n.title || 'Untitled'}</span>
                    <span
                      onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Editor area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeNote ? (
              <>
                {/* Title + save */}
                <div className="shrink-0 px-6 pt-4 pb-2 flex items-center gap-3">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Document title"
                    className="flex-1 bg-transparent text-lg font-semibold text-white placeholder-slate-600 focus:outline-none"
                  />
                  <button
                    onClick={saveNote}
                    disabled={saving}
                    className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-sm font-medium px-3.5 py-1.5 rounded-lg transition-colors"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save
                  </button>
                </div>
                {savedAt && (
                  <p className="px-6 text-xs text-emerald-400/70 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Saved at {savedAt}
                  </p>
                )}

                {/* Formatting toolbar */}
                <div className="shrink-0 px-6 py-2 flex items-center gap-1 border-b border-ink-700/40">
                  <ToolbarBtn onClick={() => format('bold')} label="B" className="font-bold" />
                  <ToolbarBtn onClick={() => format('italic')} label="I" className="italic" />
                  <ToolbarBtn onClick={() => format('underline')} label="U" className="underline" />
                  <div className="w-px h-5 bg-ink-700 mx-1" />
                  <ToolbarBtn onClick={() => format('formatBlock', '<h1>')} label="H1" />
                  <ToolbarBtn onClick={() => format('formatBlock', '<h2>')} label="H2" />
                  <ToolbarBtn onClick={() => format('formatBlock', '<h3>')} label="H3" />
                  <div className="w-px h-5 bg-ink-700 mx-1" />
                  <ToolbarBtn onClick={() => format('insertUnorderedList')} label="• List" />
                  <ToolbarBtn onClick={() => format('insertOrderedList')} label="1. List" />
                </div>

                {/* ContentEditable */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 text-slate-200 leading-relaxed focus:outline-none prose-invert max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-white [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
                  data-placeholder="Start typing your notes..."
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-brand-400" />
                </div>
                <h3 className="text-base font-semibold text-white">No document selected</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-xs">
                  Click "New Document" to create your first note. Your notes save to your account automatically.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: AI Assistant */}
        <AIPanel getEditorText={getEditorText} hasActiveNote={!!activeNote} />
      </div>
    </div>
  );
}

function ToolbarBtn({ onClick, label, className = '' }: { onClick: () => void; label: string; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-sm text-slate-300 hover:text-white hover:bg-ink-800 rounded-md transition-colors ${className}`}
    >
      {label}
    </button>
  );
}

function AIPanel({
  getEditorText, hasActiveNote,
}: {
  getEditorText: () => string;
  hasActiveNote: boolean;
}) {
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
    }
    setToolRunning(null);
  }

  const tools: { id: ToolId; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'summarize', label: 'Summarize Note', icon: <Sparkles className="w-4 h-4" />, desc: 'Condense your note into key bullet points' },
    { id: 'flashcards', label: 'Generate Flashcards', icon: <BookOpen className="w-4 h-4" />, desc: 'Create Q&A flashcards from your note' },
    { id: 'grammar', label: 'Fix Grammar', icon: <SpellCheck className="w-4 h-4" />, desc: 'Correct spelling and grammar in your note' },
  ];

  return (
    <div className="w-full lg:w-96 shrink-0 flex flex-col bg-ink-900/50">
      {/* Tabs */}
      <div className="shrink-0 flex border-b border-ink-700/50">
        <TabBtn active={tab === 'chat'} onClick={() => setTab('chat')} icon={<MessageSquare className="w-4 h-4" />} label="AI Chat" />
        <TabBtn active={tab === 'tools'} onClick={() => setTab('tools')} icon={<Wrench className="w-4 h-4" />} label="Quick AI Tools" />
      </div>

      {tab === 'chat' ? (
        <>
          {/* Context checkbox */}
          <div className="shrink-0 px-4 py-2.5 border-b border-ink-700/40">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useContext}
                onChange={(e) => setUseContext(e.target.checked)}
                className="w-4 h-4 rounded border-ink-600 bg-ink-800 text-brand-600 focus:ring-brand-500/30"
              />
              Use current note as context
            </label>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
            {messages.length === 0 && !sending && (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-brand-400" />
                </div>
                <p className="text-sm text-slate-400 font-medium">Ask me anything</p>
                <p className="text-xs text-slate-500 mt-1">I can solve doubts, explain concepts, and use your note as context.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-800 text-slate-200 border border-ink-700'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-ink-800 border border-ink-700 rounded-xl px-3.5 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                </div>
              </div>
            )}
            {chatError && (
              <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{chatError}</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendChat} className="shrink-0 p-3 border-t border-ink-700/50 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 bg-ink-800 border border-ink-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="px-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 rounded-lg text-white transition-colors"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
          <p className="text-sm text-slate-400 mb-2">
            Run AI tools on your current note. Results appear below.
          </p>
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => runTool(t.id)}
              disabled={!hasActiveNote || toolRunning !== null}
              className="w-full flex items-start gap-3 p-3.5 rounded-xl bg-ink-800/60 hover:bg-ink-800 border border-ink-700/50 hover:border-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
                {toolRunning === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : t.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{t.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
              </div>
            </button>
          ))}

          {!hasActiveNote && (
            <p className="text-xs text-slate-500 text-center py-2">Open or create a note first.</p>
          )}

          {toolError && (
            <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{toolError}</span>
            </div>
          )}

          {toolResult && (
            <div className="mt-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-2">
                <CheckSquare className="w-3.5 h-3.5" /> Result
              </div>
              <div className="bg-ink-800/60 border border-ink-700/50 rounded-xl p-3.5 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {toolResult}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${
        active ? 'text-brand-300 border-brand-500' : 'text-slate-400 border-transparent hover:text-slate-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
