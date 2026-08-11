
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ParsedClass {
  subject: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  professor?: string | null;
  room?: string | null;
}

interface RequestBody {
  image: string; // base64-encoded image data (without data URI prefix)
  mimeType: string;
}

const VALID_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const SYSTEM_PROMPT =
  "You are an expert OCR assistant specialized in reading college/university timetable images. " +
  "You receive an image of a weekly class schedule. Extract every class entry you can identify.\n\n" +
  "Return ONLY a JSON object with this exact shape — no markdown, no explanation:\n" +
  '{\n  "readable": boolean,\n  "confidence": "high" | "medium" | "low",\n  "reason": string,\n  "classes": [\n    {\n      "subject": string,\n      "day_of_week": "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday",\n      "start_time": "HH:MM",\n      "end_time": "HH:MM",\n      "professor": string | null,\n      "room": string | null\n    }\n  ]\n}\n\n' +
  "Rules:\n" +
  "- Set readable=false if the image is blurry, low-resolution, cut off, poorly lit, or you cannot confidently read the table structure. Provide a reason.\n" +
  "- Set readable=true only when you can clearly identify the schedule structure.\n" +
  "- Times must be 24-hour HH:MM format. If the timetable uses 12-hour format, convert it.\n" +
  "- day_of_week must be one of Monday, Tuesday, Wednesday, Thursday, Friday. Skip entries on other days.\n" +
  "- If professor or room is not visible, set them to null.\n" +
  "- If no classes are found but the image is clear, return readable=true with an empty classes array.\n" +
  "- Do NOT wrap the JSON in markdown code fences. Return raw JSON only.";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();

    if (!body.image || !body.mimeType) {
      return new Response(
        JSON.stringify({ error: "Missing image data or mimeType." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service is not configured. Add GEMINI_API_KEY to Supabase Edge Function secrets." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Attempt using Gemini 2.5 Flash first, with fallback to gemini-3.1-flash-lite
    let model = "gemini-2.5-flash";
    let geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: SYSTEM_PROMPT },
                {
                  inline_data: {
                    mime_type: body.mimeType,
                    data: body.image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    let geminiData = await geminiRes.json();
    const isDeprecated455 = geminiRes.status === 404 || 
      (geminiData.error && geminiData.error.message && (
        geminiData.error.message.includes("no longer available") || 
        geminiData.error.message.includes("not found")
      ));

    if (isDeprecated455) {
      console.warn(`Model ${model} unavailable. Falling back to gemini-3.1-flash-lite...`);
      model = "gemini-3.1-flash-lite";
      geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: SYSTEM_PROMPT },
                  {
                    inline_data: {
                      mime_type: body.mimeType,
                      data: body.image,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        },
      );
      geminiData = await geminiRes.json();
    }

    if (!geminiRes.ok) {
      return new Response(
        JSON.stringify({ 
          error: `Gemini API request failed (${geminiRes.status})`,
          details: geminiData?.error?.message || "Unknown error"
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: "Gemini returned an empty response." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Strip markdown code fences if present
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: { readable: boolean; confidence: string; reason: string; classes: ParsedClass[] };

    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[timetable-scan] JSON parse error:", errMsg);
      console.error("[timetable-scan] raw text:", rawText);
      return new Response(
        JSON.stringify({
          error: "Failed to parse AI response as JSON.",
          details: errMsg,
          rawText: rawText,
          geminiData: geminiData,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate and sanitize class entries
    const validClasses = (parsed.classes ?? []).filter((c) => {
      const hasSubject = c.subject && c.subject.trim().length > 0;
      const hasDay = VALID_DAYS.includes(c.day_of_week);
      const hasTimes = c.start_time && c.end_time && /^\d{2}:\d{2}$/.test(c.start_time) && /^\d{2}:\d{2}$/.test(c.end_time);
      return hasSubject && hasDay && hasTimes;
    }).map((c) => ({
      subject: c.subject.trim(),
      day_of_week: c.day_of_week,
      start_time: c.start_time,
      end_time: c.end_time,
      professor: c.professor?.trim() || null,
      room: c.room?.trim() || null,
    }));

    return new Response(
      JSON.stringify({
        readable: parsed.readable ?? false,
        confidence: parsed.confidence ?? "low",
        reason: parsed.reason ?? "",
        classes: validClasses,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
