// The Drift Meter — live-Claude reflection endpoint
// ---------------------------------------------------
// A tiny serverless function that lets the static Drift Meter page call Claude
// without ever exposing your API key in the browser.
//
// Works as-is on Vercel (and, with a one-line tweak noted below, Netlify).
//
// SETUP (see SETUP-live-claude.md for the full walkthrough):
//   1. Get an API key at console.anthropic.com and add a few dollars of credit.
//   2. Deploy this repo to Vercel (vercel.com → New Project → import the repo).
//   3. In the Vercel project: Settings → Environment Variables → add
//        ANTHROPIC_API_KEY = sk-ant-...   (your key)
//   4. Copy the deployed URL and paste it into REFLECT_ENDPOINT in Drift Meter.dc.html
//        e.g. "https://your-project.vercel.app/api/reflect"
//      then re-bundle / re-upload drift-meter.html.

const MODEL = "claude-sonnet-4-5"; // any current model id from console.anthropic.com works

const SYSTEM = `You are writing a brief, candid reflection for a reader who has just finished "The Drift Meter," a prototype that measures how a person's judgment changes when AI assists them versus when it does not.

You are given two sets of figures for the same short judgment task: one completed WITH AI assistance, one WITHOUT. Higher numbers mean more independent evaluative engagement (more assumptions interrogated, more evidence opened, more framing autonomy, etc.). "perceivedSharpness" is how sharp the reader felt; "measuredEngagement" is what the instrument observed.

Write 2 to 4 sentences. Constraints:
- Plain, unhurried, honest. No hype, no flattery, no exclamation points.
- Do NOT classify the person or assign a type. Describe only what this run shows.
- It is a trace, not a verdict. Name the most interesting gap between the two conditions, and what it might mean for the reader's judgment — without overclaiming.
- If perceived sharpness outran measured engagement under assistance, that gap is worth naming gently.
- Address the reader as "you." Do not restate the raw numbers.`;

export default async function handler(req, res) {
  // CORS — tighten "*" to your GitHub Pages origin in production, e.g. "https://mp7770.github.io"
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });
  }

  try {
    // Vercel parses JSON bodies automatically; fall back to manual parse otherwise.
    const run = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    const userMsg =
      "Here is one reader's run:\n\n" +
      JSON.stringify(run, null, 2) +
      "\n\nWrite the reflection.";

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 320,
        system: SYSTEM,
        messages: [{ role: "user", content: userMsg }],
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: (data.error && data.error.message) || "Claude API error" });
    }
    const reflection = (data.content || []).map((b) => b.text || "").join("").trim();
    return res.status(200).json({ reflection });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
