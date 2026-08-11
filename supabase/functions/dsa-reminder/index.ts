import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, problemName, topic, scheduledAt } = await req.json();
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Resend API key is not configured. Add RESEND_API_KEY to Supabase Secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email || !problemName || !topic) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, problemName, topic" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Configure the Resend email request payload
    const emailPayload: any = {
      from: "StudentOS Reminders <onboarding@resend.dev>",
      to: [email],
      subject: `DSA Reattempt Reminder: ${problemName}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; padding: 12px; background-color: #e0e7ff; border-radius: 12px; color: #4f46e5;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <h1 style="font-size: 22px; font-weight: 700; margin-top: 16px; margin-bottom: 8px; color: #1e1b4b;">Spaced Repetition Alert</h1>
            <p style="font-size: 14px; color: #64748b; margin: 0;">DSA Revision Tracker</p>
          </div>
          
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #f1f5f9; margin-bottom: 24px;">
            <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.5; color: #334155;">
              This is a reminder to reattempt the following problem to reinforce your conceptual understanding:
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #64748b; width: 120px;">Problem:</td>
                <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${problemName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #64748b;">Topic:</td>
                <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #4f46e5;">${topic}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center;">
            <a href="https://studentos.dev" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 14px; font-weight: 600; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
              Open DSA Tracker
            </a>
          </div>

          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0 20px 0;" />
          <p style="font-size: 11px; text-align: center; color: #94a3b8; margin: 0; line-height: 1.5;">
            You received this email because you scheduled a spaced repetition reattempt in StudentOS.<br/>
            © 2026 StudentOS. All rights reserved.
          </p>
        </div>
      `,
    };

    if (scheduledAt) {
      // Validate scheduled date is in the future
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate > new Date()) {
        emailPayload.scheduled_at = scheduledDate.toISOString();
      }
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const resData = await res.json();
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: resData.message || "Failed to send email via Resend" }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: resData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
