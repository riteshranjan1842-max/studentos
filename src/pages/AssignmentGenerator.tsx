import { useState, type FormEvent } from 'react';
import { FileText, Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export default function AssignmentGenerator() {
  const { user } = useAuth();
  
  // Input states
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState('Essay');
  const [length, setLength] = useState('Medium (3-5 pages)');
  const [explainInPoints, setExplainInPoints] = useState(false);
  
  // Status states
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);

  async function generateAssignment(e: FormEvent) {
    e.preventDefault();
    if (!topic.trim() || generating) return;

    setGenerating(true);
    setError(null);
    setResult(null);
    setSavedNoteId(null);

    try {
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'assignment',
          subject: subject.trim() || 'General',
          topic: topic.trim(),
          format,
          length,
          pointExplanation: explainInPoints,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate assignment outline.');
    } finally {
      setGenerating(false);
    }
  }

  async function copyToClipboard() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function exportToPDF() {
    if (!result) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to export as PDF.");
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${subject || 'Assignment'} - Draft</title>
          <style>
            body {
              font-family: 'Georgia', serif;
              line-height: 1.6;
              color: #111;
              padding: 2cm;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              font-size: 24pt;
              margin-bottom: 5px;
              text-align: center;
            }
            .meta {
              font-size: 10pt;
              color: #555;
              text-align: center;
              margin-bottom: 30px;
              font-style: italic;
            }
            h4 {
              font-size: 14pt;
              font-weight: bold;
              margin-top: 22px;
              margin-bottom: 10px;
              color: #111;
            }
            h5 {
              font-size: 12pt;
              font-weight: bold;
              margin-top: 18px;
              margin-bottom: 8px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 3px;
              color: #222;
            }
            h6 {
              font-size: 11pt;
              font-weight: bold;
              margin-top: 14px;
              margin-bottom: 6px;
              color: #2563eb;
            }
            p {
              font-size: 11pt;
              margin-bottom: 10px;
              color: #333;
            }
            .flex {
              display: flex;
            }
            .items-baseline {
              align-items: baseline;
            }
            .gap-2 {
              gap: 8px;
            }
            .gap-2\.5 {
              gap: 10px;
            }
            .shrink-0 {
              flex-shrink: 0;
            }
            .mr-2 {
              margin-right: 8px;
            }
            .flex-1 {
              flex: 1;
            }
            .font-bold {
              font-weight: bold;
            }
            .font-extrabold {
              font-weight: 800;
            }
            .italic {
              font-style: italic;
            }
            .text-brand-400 {
              color: #2563eb;
            }
            hr {
              border: 0;
              border-top: 1px solid #ddd;
              margin: 20px 0;
            }
            code {
              font-family: monospace;
              background-color: #f1f5f9;
              padding: 2px 4px;
              border-radius: 4px;
              font-size: 9.5pt;
            }
            @media print {
              body {
                padding: 0;
              }
              @page {
                size: A4;
                margin: 2cm;
              }
            }
          </style>
        </head>
        <body>
          <h1>${subject || 'Academic Assignment'}</h1>
          <div class="meta">
            Format: ${format} | Length: ${length}<br>
            Topic: ${topic}
          </div>
          <div>${parseMarkdownToHtml(result)}</div>
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

  async function saveAsNote() {
    if (!user || !result) return;
    try {
      const { data } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: `${subject || 'Assignment'} Draft - ${format}`,
          // Wrap in basic HTML for the rich text editor compatibility
          content: `<div style="font-family: sans-serif; line-height: 1.6;">
            <h2>${subject || 'Assignment'} Draft</h2>
            <p><strong>Topic:</strong> ${topic}</p>
            <p><strong>Format:</strong> ${format} | <strong>Length:</strong> ${length}</p>
            <hr />
            <pre style="white-space: pre-wrap; font-family: inherit;">${result}</pre>
          </div>`
        })
        .select('id')
        .maybeSingle();

      if (data) {
        setSavedNoteId(data.id);
      }
    } catch (err) {
      console.error('Failed to save assignment as note:', err);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-brand-400" /> AI Assignment Generator
        </h1>
        <p className="text-sm text-slate-500 mt-1">Create structured outlines, thesis arguments, research directions, and content drafts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Form controls panel */}
        <form onSubmit={generateAssignment} className="lg:col-span-5 glass rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Generation Criteria</h2>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subject / Course</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Computer Networks, Macroeconomics"
              className="w-full bg-ink-800 border border-ink-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Topic / Prompt</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Describe your assignment topic, question details, or guidelines..."
              rows={4}
              className="w-full bg-ink-800 border border-ink-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors resize-none scrollbar-thin"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full bg-ink-800 border border-ink-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              >
                <option>Essay</option>
                <option>Lab Report</option>
                <option>Case Study</option>
                <option>Q&A Assignment</option>
                <option>Literature Review</option>
                <option>Presentation Outline</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Length</label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full bg-ink-800 border border-ink-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              >
                <option>Short (1-2 pages)</option>
                <option>Medium (3-5 pages)</option>
                <option>Long (6+ pages)</option>
              </select>
            </div>
          </div>

          {/* Explain in points checkbox option */}
          <div className="pt-1.5 pb-1">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-ink-800/60 border border-ink-700/50 cursor-pointer hover:border-brand-500/30 transition-colors select-none">
              <input
                type="checkbox"
                checked={explainInPoints}
                onChange={(e) => setExplainInPoints(e.target.checked)}
                className="w-4 h-4 rounded border-ink-600 bg-ink-800 text-brand-600 focus:ring-brand-500/30"
              />
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-200">Point Explanation Mode</p>
                <p className="text-[10px] text-slate-500">Explain the entire concepts/assignment in structured points</p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={generating || !topic.trim()}
            className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating outlines...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate Outline
              </>
            )}
          </button>
        </form>

        {/* Output panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass rounded-2xl p-5 min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-ink-800/40 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Generated Plan</span>
              </div>
              {result && (
                <div className="flex items-center gap-2 animate-fadeIn">
                  <button
                    onClick={copyToClipboard}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="flex items-center gap-1 bg-brand-600/10 hover:bg-brand-600/20 text-brand-300 border border-brand-500/20 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    Export PDF
                  </button>
                  <button
                    onClick={saveAsNote}
                    disabled={!!savedNoteId}
                    className="flex items-center gap-1 bg-brand-600 hover:bg-brand-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:bg-emerald-600 disabled:cursor-not-allowed"
                  >
                    {savedNoteId ? 'Saved as Note' : 'Save as Note'}
                  </button>
                </div>
              )}
            </div>

            {generating ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-brand-400 mb-3" />
                <p className="text-sm">Generating assignment content draft using Gemini AI...</p>
                <p className="text-xs text-slate-600 mt-1">This may take a few seconds depending on the length criteria.</p>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center text-rose-400 text-sm py-12 text-center max-w-md mx-auto">
                {error}
              </div>
            ) : result ? (
              <div 
                className="flex-1 text-slate-300 leading-relaxed select-text max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin space-y-1.5"
                dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(result) }}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto text-slate-500">
                <Sparkles className="w-10 h-10 text-brand-500/30 mb-3" />
                <p className="text-sm">No assignment draft generated yet.</p>
                <p className="text-xs text-slate-600 mt-1">Configure your generation criteria and hit "Generate Outline" to begin.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function parseInlineMarkdown(text: string): string {
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-white">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-200">$1</em>');
  html = html.replace(/`(.*?)`/g, '<code class="bg-ink-800/80 px-1.5 py-0.5 rounded text-xs font-mono text-brand-300 border border-ink-700/50">$1</code>');
  return html;
}

function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  const lines = markdown.split('\n');
  let html = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      html += '<hr class="border-ink-800/40 my-4" />';
      continue;
    }

    if (trimmed.startsWith('#')) {
      const level = trimmed.match(/^#+/)?.[0].length ?? 1;
      const text = trimmed.replace(/^#+\s*/, '');
      const parsedText = parseInlineMarkdown(text);
      if (level === 1) {
        html += `<h4 class="text-sm font-extrabold text-white mt-4 mb-2">${parsedText}</h4>`;
      } else if (level === 2) {
        html += `<h5 class="text-xs font-bold text-white mt-3.5 mb-2 border-b border-ink-800/40 pb-1">${parsedText}</h5>`;
      } else {
        html += `<h6 class="text-[11px] font-bold text-brand-400 mt-3 mb-1.5 uppercase tracking-wide flex items-baseline gap-1.5">${parsedText}</h6>`;
      }
      continue;
    }

    // Unordered list items: * item or - item or + item
    const ulMatch = line.match(/^(\s*)([\*\-\+])\s+(.*)$/);
    if (ulMatch) {
      const content = ulMatch[3];
      const parsedContent = parseInlineMarkdown(content);
      html += `<div class="flex items-baseline gap-2.5 mb-1.5 text-slate-300 text-xs md:text-sm leading-relaxed"><span class="select-none text-brand-400 font-bold shrink-0 mr-2">•</span><div class="flex-1">${parsedContent}</div></div>`;
      continue;
    }

    // Ordered list items: 1. item
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (olMatch) {
      const content = olMatch[3];
      const parsedContent = parseInlineMarkdown(content);
      const number = olMatch[2];
      html += `<div class="flex items-baseline gap-2.5 mb-1.5 text-slate-300 text-xs md:text-sm leading-relaxed"><span class="font-bold text-brand-400 shrink-0 mr-2">${number}.</span><div class="flex-1">${parsedContent}</div></div>`;
      continue;
    }

    const parsedText = parseInlineMarkdown(trimmed);
    html += `<p class="mb-2 text-slate-300 text-xs md:text-sm leading-relaxed">${parsedText}</p>`;
  }

  return html;
}
