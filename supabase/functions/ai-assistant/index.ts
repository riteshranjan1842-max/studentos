import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface RequestBody {
  action: "chat" | "summarize" | "flashcards" | "grammar";
  noteContent?: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
  useContext?: boolean;
}

const SYSTEM_INSTRUCTION =
  "You are StudentOS AI, a helpful study assistant for college students. " +
  "Answer questions clearly and concisely. When given a student's note as context, " +
  "use it to ground your answers. If the question is outside the note's scope, say so " +
  "and answer from general knowledge. Keep responses focused and student-friendly.";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function callGemini(
  prompt: string,
  history: ChatMessage[],
): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("AI service is not configured. Add GEMINI_API_KEY to Supabase Edge Function secrets.");
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: history,
        systemInstruction: { parts: [{ text: prompt }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200,
        },
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const noteText = body.noteContent ? stripHtml(body.noteContent) : "";

    let systemPrompt = SYSTEM_INSTRUCTION;
    let history: ChatMessage[] = [];

    if (body.action === "chat") {
      if (body.useContext && noteText) {
        systemPrompt +=
          `\n\nThe student's current note content is:\n\n"${noteText.slice(0, 4000)}"\n\nUse this as context for their questions.`;
      }
      if (body.messages && body.messages.length > 0) {
        history = body.messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          content: m.content,
        }));
      } else {
        throw new Error("No messages provided for chat.");
      }
    } else if (body.action === "summarize") {
      if (!noteText) throw new Error("Note is empty. Add some content first.");
      systemPrompt = "You are a study assistant. Summarize the student's note into clear, concise bullet points capturing the key concepts.";
      history = [{ role: "user", content: `Summarize this note:\n\n${noteText.slice(0, 4000)}` }];
    } else if (body.action === "flashcards") {
      if (!noteText) throw new Error("Note is empty. Add some content first.");
      systemPrompt = "You are a study assistant. Generate flashcards from the student's note. Format each as 'Q: <question>\\nA: <answer>'. Generate 5-8 cards.";
      history = [{ role: "user", content: `Create flashcards from this note:\n\n${noteText.slice(0, 4000)}` }];
    } else if (body.action === "grammar") {
      if (!noteText) throw new Error("Note is empty. Add some content first.");
      systemPrompt = "You are a proofreading assistant. Fix grammar, spelling, and clarity in the student's note. Return only the corrected text, preserving the meaning.";
      history = [{ role: "user", content: `Fix the grammar of this note:\n\n${noteText.slice(0, 4000)}` }];
    } else {
      throw new Error(`Unknown action: ${body.action}`);
    }

    const result = await callGemini(systemPrompt, history);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
