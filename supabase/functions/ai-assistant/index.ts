import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: "user" | "model";
  parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }>;
}

interface RequestBody {
  action: "chat" | "summarize" | "flashcards" | "quiz" | "grammar" | "assignment" | "detailed_analysis" | "deep_summary" | "ocr" | "generate_topic_notes" | "judge_dsa_attempts" | "generate_code_questions";
  noteContent?: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
  useContext?: boolean;
  subject?: string;
  topic?: string;
  format?: string;
  length?: string;
  image?: string; // base64 representation of PDF or image
  mimeType?: string;
  pointExplanation?: boolean;
  explainInPoints?: boolean;
  problemName?: string;
  attempts?: Array<{
    approach_name: string;
    time_complexity: string;
    space_complexity: string;
    code_snippet?: string;
    notes?: string;
  }>;
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

  // Attempt using Gemini 2.5 Flash as requested
  let model = "gemini-2.5-flash";
  let res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: history,
        systemInstruction: { parts: [{ text: prompt }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2500,
        },
      }),
    },
  );

  let data = await res.json();
  const isDeprecated404 = res.status === 404 || 
    (data.error && data.error.message && data.error.message.includes("no longer available"));

  if (isDeprecated404) {
    console.warn(`Model ${model} deprecated or unavailable. Falling back to gemini-3.1-flash-lite...`);
    model = "gemini-3.1-flash-lite";
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: history,
          systemInstruction: { parts: [{ text: prompt }] },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2500,
          },
        }),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API request failed (${res.status}): ${errText}`);
    }
    data = await res.json();
  } else if (!res.ok) {
    throw new Error(`Gemini API request failed (${res.status}): ${JSON.stringify(data.error || data)}`);
  }

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
          parts: [{ text: m.content }],
        }));
      } else {
        throw new Error("No messages provided for chat.");
      }
    } else if (body.action === "summarize") {
      if (!noteText) throw new Error("Note is empty. Add some content first.");
      systemPrompt = "You are a study assistant. Summarize the student's note into clear, concise bullet points capturing the key concepts.";
      history = [{ role: "user", parts: [{ text: `Summarize this note:\n\n${noteText.slice(0, 4000)}` }] }];
    } else if (body.action === "deep_summary") {
      if (!noteText) throw new Error("Note is empty. Add some content first.");
      systemPrompt = "You are a senior academic assistant. Generate a highly detailed, comprehensive study summary of the student's notes, structured in a multi-page style, capturing every key concept. Wherever relationships, processes, architectures, or flows are discussed, include a visual diagram using a Mermaid.js code block (wrapped in ```mermaid ... ```).";
      history = [{ role: "user", parts: [{ text: `Generate a comprehensive study summary of this note:\n\n${noteText.slice(0, 4000)}` }] }];
    } else if (body.action === "detailed_analysis") {
      if (!noteText) throw new Error("Note is empty. Add some content first.");
      systemPrompt = 
        "You are a senior university professor. Analyze the student's notes to extract the key learning outcomes and important topics.\n\n" +
        "Output your response with these exact headers:\n" +
        "1. IMPORTANT TOPICS\n" +
        "List all key topics with a brief explanation of each. Include visual diagrams using Mermaid.js code blocks (wrapped in ```mermaid ... ```) to visually represent flows, concepts, or architectures.\n\n" +
        "2. EXAM CRITICAL QUESTIONS\n" +
        "Identify 1-2 most important questions on these topics that are regularly asked in university exams, along with a suggested brief response direction.\n\n" +
        "3. REVIEW QUIZ\n" +
        "Generate a 5-question multiple choice or Q&A study quiz to test understanding of the material.";
      history = [{ role: "user", parts: [{ text: `Provide a detailed academic analysis, exam questions, and study quiz for this note:\n\n${noteText.slice(0, 4000)}` }] }];
    } else if (body.action === "flashcards") {
      if (!noteText) throw new Error("Note is empty. Add some content first.");
      systemPrompt = "You are a study assistant. Generate standalone, self-contained quick revision flashcards from the note context.\n" +
        "Extract the most important, distinct rules, concepts, or facts, and condense each into one crisp, complete, standalone statement per card (aim for 1-3 sentences) that a student can read straight through to refresh their memory.\n" +
        "Do NOT write questions or hide answers. Do NOT generate question-answer pairs. The card's 'back' must contain the complete key point rule or concept, including examples where relevant.\n\n" +
        "Return ONLY a valid JSON array of 10-12 objects, where each object has:\n" +
        "- 'front': a short topic or rule label (e.g., 'Subject-Verb Agreement — Rule 2')\n" +
        "- 'back': the concise revision statement containing the complete key point.\n\n" +
        "Do not wrap in markdown or backticks.";
      history = [{ role: "user", parts: [{ text: `Create JSON flashcards from this note:\n\n${noteText.slice(0, 4000)}` }] }];
    } else if (body.action === "quiz") {
      if (!noteText) throw new Error("Note is empty. Add some content first.");
      systemPrompt = "You are an expert examiner. Generate a structured multiple-choice quiz from the note context. " +
        "Select exactly 10 conceptually significant points (rules, definitions, key distinctions, common patterns/exceptions) - do not test surface-level trivia or literal wording.\n\n" +
        "Return ONLY a valid JSON array of 10 objects, where each object has:\n" +
        "- 'question': the question text\n" +
        "- 'options': an array of exactly 4 strings (A, B, C, D choices)\n" +
        "- 'correctIndex': the 0-indexed number of the correct option\n" +
        "- 'explanation': a clear explanation of why the correct option is right and others are wrong.\n\n" +
        "Do not wrap in markdown or backticks.";
      history = [{ role: "user", parts: [{ text: `Create JSON multiple-choice quiz from this note:\n\n${noteText.slice(0, 4000)}` }] }];
    } else if (body.action === "grammar") {
      if (!noteText) throw new Error("Note is empty. Add some content first.");
      systemPrompt = "You are a proofreading assistant. Fix grammar, spelling, and clarity in the student's note. Return only the corrected text, preserving the meaning.";
      history = [{ role: "user", parts: [{ text: `Fix the grammar of this note:\n\n${noteText.slice(0, 4000)}` }] }];
    } else if (body.action === "ocr") {
      if (!body.image || !body.mimeType) throw new Error("File data and mimeType are required for OCR.");
      const isPoints = body.pointExplanation === true || body.explainInPoints === true;
      systemPrompt = isPoints
        ? "You are an expert academic tutor. Transcribe, extract, and explain the content from the document file. Organize the notes strictly into clear, detailed bullet points and numbered lists. Do not write paragraphs. Output the notes in structured section headers, and include visual diagrams using Mermaid.js code blocks (wrapped in ```mermaid ... ```) to visually represent concepts. Do not add conversational prefixes."
        : "You are an expert OCR transcription assistant. Transcribe and extract every word from the document file (PDF or Image). Output ONLY the extracted text, maintaining document structure where possible. Do not add conversational prefixes.";
      history = [{
        role: "user",
        parts: [
          { text: "Extract and transcribe all content from this document:" },
          {
            inline_data: {
              mime_type: body.mimeType,
              data: body.image
            }
          }
        ]
      }];
    } else if (body.action === "generate_topic_notes") {
      if (!body.topic) throw new Error("Topic is required.");
      const isPoints = body.pointExplanation === true || body.explainInPoints === true;
      systemPrompt = isPoints
        ? "You are an expert academic professor. Generate highly detailed, comprehensive study notes on the given topic. You MUST write all explanations, details, and sections strictly as structured bullet points or numbered lists. Do not write paragraphs. Include visual diagrams using Mermaid.js code blocks (wrapped in ```mermaid ... ```) to visually represent relationships, processes, architectures, or flows."
        : "You are an expert academic professor. Generate highly detailed, comprehensive study notes on the given topic. Include definitions, key concepts, explanations, structured sections with headers, and visual diagrams using Mermaid.js code blocks (wrapped in ```mermaid ... ```) to visually represent relationships, processes, architectures, or flows.";
      history = [{ role: "user", parts: [{ text: `Generate detailed study notes for this topic:\n\n${body.topic}` }] }];
    } else if (body.action === "assignment") {
      if (!body.topic) throw new Error("Assignment topic is required.");
      const isPoints = body.pointExplanation === true || body.explainInPoints === true;
      systemPrompt = isPoints
        ? "You are a specialized academic writer. Help the student write a complete, fully-fleshed-out, highly detailed draft for their assignment topic. You MUST organize the entire draft strictly in structured bullet points and numbered lists with headings. Do not write paragraphs. Ensure it is thorough, clear, and comprehensive."
        : "You are a specialized academic writer. Help the student write a complete, fully-fleshed-out, highly detailed draft for their assignment topic. Do not just return an outline or structure. Write the actual content, paragraphs, and details of the assignment itself.";
      history = [{
        role: "user",
        parts: [{ text: `Write a complete, fully-written academic assignment draft for the following topic:
Subject: ${body.subject || "General"}
Topic/Prompt: ${body.topic}
Format: ${body.format || "Essay"}
Target Length: ${body.length || "Standard"}

Guidelines:
- ${isPoints ? "Write the actual assignment contents strictly as structured bullet points and numbered lists under each section." : "Write the actual assignment contents (e.g. Introduction, main body paragraphs, and Conclusion)."}
- Do not use placeholders or tell the student to "write here". Write the complete paragraphs.
- Keep the writing academic, thorough, and highly detailed to fulfill the target length.` }]
      }];
    } else if (body.action === "judge_dsa_attempts") {
      if (!body.problemName || !body.attempts || body.attempts.length === 0) {
        throw new Error("Problem name and attempts array are required.");
      }
      systemPrompt = 
        "You are StudentOS AI, an expert DSA interviewer and compiler optimization judge. " +
        "Compare the student's different attempts/methods for the specified DSA problem. " +
        "Analyze the time complexity reduction, space trade-offs, and correctness of each approach. " +
        "Provide a clear, formatted comparison report explaining which one is better, and why, and give an Optimization Verdict.";
      
      const attemptsSummary = body.attempts.map((a, i) => `
Approach #${i + 1}: ${a.approach_name}
- Time Complexity: ${a.time_complexity}
- Space Complexity: ${a.space_complexity}
- Explanation: ${a.notes || "None provided"}
- Code Snippet:
\`\`\`
${a.code_snippet || "// No code snippet logged"}
\`\`\`
`).join("\n\n");

      history = [{
        role: "user",
        parts: [{ text: `Compare my attempts for the DSA problem "${body.problemName}":\n\n${attemptsSummary}` }]
      }];
    } else if (body.action === "generate_code_questions") {
      const topicName = body.topic || "Data Structures and Algorithms";
      systemPrompt =
        "You are an expert computer science professor and tech interviewer. " +
        `Generate a structured JSON response containing exactly 25 practice coding questions for the topic: "${topicName}". ` +
        (noteText ? `Base the questions on the student's note content: "${noteText.slice(0, 3000)}". ` : "") +
        "\n\nSTRICT REQUIRMENTS:\n" +
        "1. You must return EXACTLY 25 questions divided into 3 difficulty tiers:\n" +
        "   - Basic (8 questions): core operations, basic syntax, fundamental structures. Tag as difficulty: 'Easy'.\n" +
        "   - Intermediate (9 questions): combining concepts, common algorithmic patterns, moderate complexity. Tag as difficulty: 'Medium'.\n" +
        "   - Advanced (8 questions): tricky edge cases, optimizations, complex data structure designs. Tag as difficulty: 'Hard'.\n" +
        "2. For EVERY question, suggest real practice URLs following this strict platform priority:\n" +
        "   - Priority 1: LeetCode direct problem link if an exact or close equivalent problem exists (e.g. https://leetcode.com/problems/reverse-linked-list/)\n" +
        "   - Priority 2: GeeksforGeeks Practice link if not on LeetCode (e.g. https://www.geeksforgeeks.org/problems/detect-loop-in-linked-list/1)\n" +
        "   - Priority 3: Other platforms (HackerRank, InterviewBit, Codeforces) if neither LeetCode nor GFG has it.\n" +
        "   - If no exact real problem URL exists on the platform, provide a platform search URL (e.g. https://leetcode.com/problemset/?search=linked+list or https://www.geeksforgeeks.org/explore?page=1&search=linked+list) rather than a fake or broken URL.\n" +
        "3. Indicate whether the note topic is primarily programming/DSA related using 'isCodingTopic' (boolean).\n\n" +
        "Return ONLY a raw JSON object (no markdown, no backticks, no conversational commentary) with this exact schema:\n" +
        "{\n" +
        '  "isCodingTopic": true,\n' +
        '  "topic": "' + topicName + '",\n' +
        '  "questions": [\n' +
        '    {\n' +
        '      "id": "1",\n' +
        '      "title": "Reverse a Linked List",\n' +
        '      "description": "Reverse a singly linked list in-place and return the new head node.",\n' +
        '      "tier": "Basic",\n' +
        '      "difficulty": "Easy",\n' +
        '      "platform": "LeetCode",\n' +
        '      "practiceUrl": "https://leetcode.com/problems/reverse-linked-list/",\n' +
        '      "alternativePlatform": "GeeksforGeeks",\n' +
        '      "alternativePracticeUrl": "https://www.geeksforgeeks.org/problems/reverse-a-linked-list/1"\n' +
        '    }\n' +
        '  ]\n' +
        "}";

      history = [{
        role: "user",
        parts: [{ text: `Generate 25 tiered coding practice questions with verified practice links for topic: ${topicName}` }]
      }];
    } else {
      throw new Error(`Unknown action: ${body.action}`);
    }

    const result = await callGemini(systemPrompt, history);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
