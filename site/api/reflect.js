// The Drift Meter — Claude endpoint
// ---------------------------------------------------
// Two modes, one function:
//
//   mode: "reflect" (default) — reads a finished run and writes a short reflection.
//   mode: "teach"             — answers one learner question twice, once as a
//                               default assistant and once under the four-rule
//                               judgment-preserving system prompt, then scores
//                               the second against the rubric with a grader call.
//   mode: "repair"            — feeds the failed rubric items back as instructions,
//                               rewrites the answer against them, and re-scores it.
//
// The API key never reaches the browser.
//
// SETUP (see SETUP-live-claude.md):
//   1. Get an API key at console.anthropic.com and add credit.
//   2. Deploy to Vercel, set ANTHROPIC_API_KEY in project env vars.
//   3. Paste the deployed URL into REFLECT_ENDPOINT in Drift Meter.dc.html.
//   4. Set a hard spend cap in the console. That is the only real guarantee.

// PINNED, not an alias. The measuring instrument contains a model: if the model
// moves, the instrument moves. Results are comparable only within a pinned
// version, so the exact ID is reported in the UI alongside every response and
// an upgrade forces a re-baseline rather than a silent continuation of the series.
const MODEL = "claude-sonnet-4-5-20250929";

// ---- abuse protection ----------------------------------------------------
const ALLOWED_ORIGINS = [
  "https://drift-meter.vercel.app",
  "https://mp7770.github.io",
];
const PER_IP_MAX = 6;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const GLOBAL_MAX_PER_DAY = 200;
const MAX_BODY_BYTES = 3000;

// Best-effort in-memory counters. Serverless instances are short-lived and can
// run in parallel, so treat these as a strong deterrent, NOT a hard guarantee:
// the console spend limit is the guarantee.
const ipHits = new Map();
let dayCount = 0;
let dayStamp = new Date().toISOString().slice(0, 10);

function allowOrigin(req) {
  const o = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(o)) return o;
  const ref = req.headers.referer || "";
  const hit = ALLOWED_ORIGINS.find((a) => ref.startsWith(a));
  return hit || null;
}

function rateLimited(ip, cost) {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dayStamp) { dayStamp = today; dayCount = 0; }
  if (dayCount + cost > GLOBAL_MAX_PER_DAY) return "global";
  const arr = (ipHits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length + cost > PER_IP_MAX) { ipHits.set(ip, arr); return "ip"; }
  for (let i = 0; i < cost; i++) arr.push(now);
  ipHits.set(ip, arr);
  dayCount += cost;
  return null;
}

// ---- prompts -------------------------------------------------------------

const REFLECT_SYSTEM = `You are writing a brief, candid reflection for a reader who has just finished "The Drift Meter," a prototype instrument that observes how one person's evaluative behavior changes when a cost-effectiveness estimate is supplied to them versus when it is not.

You are given: a "design" block (which condition came first, and which attribution arm the reader was in), a "supplied" block (the round where an estimate was handed to them), and a "notSupplied" block (the control round). Higher numbers mean more independent evaluative engagement. "perceivedSharpness" is the reader's self-rated confidence; "measuredEngagement" is the behavioral composite. "framingAutonomy" may be the string "undefined-in-this-condition" — that is correct and deliberate, not missing data; never treat it as zero.

Write 2 to 4 sentences. Constraints:
- Plain, unhurried, honest. No hype, no flattery, no exclamation points.
- Do NOT classify the person, assign a type, or predict how they behave elsewhere. Describe only this run.
- n = 1, six cases, no within-run control for practice or case difficulty. It is a trace, not a finding. Do not imply causation.
- ATTRIBUTION MATTERS. If the arm is human-attributed or unattributed, no AI produced the estimate the reader saw — say nothing that implies AI caused the difference. Only in the AI-attributed arm may you speak about AI assistance, and even then note that a supplied number alone could account for it.
- Name the most interesting difference between the two conditions and what it might mean, without overclaiming.
- If perceived sharpness outran measured engagement in the supplied round, name that gap gently.
- Address the reader as "you." Do not restate the raw numbers.`;

// The artifact. This is the craft, encoded: four rules that keep the learner
// building their own model of the problem instead of accepting a finished one.
const TEACH_SYSTEM = `You are answering a learner's technical question. Four rules govern the shape of your answer. They exist because a fluent, finished answer teaches the learner to stop building their own model of the problem.

1. ELICIT BEFORE YOU ANSWER. Open by asking for the learner's own read: what they think is happening, and what they think the answer turns on. One or two specific questions they can answer in a sentence. Never ask for something they have already told you.

2. GIVE A RANGE, AND NAME WHAT THE ANSWER TURNS ON. Do not lead with a single recommendation. Give the realistic span of answers, then name the one variable or fact that moves the answer more than anything else. That named thing is what the learner should go and check first.

3. SURFACE DISAGREEMENT, DO NOT RESOLVE IT. If the question rests on a premise you doubt, say so plainly and leave it open. Do not adopt the learner's framing to be agreeable, and do not quietly substitute your own without saying that is what you are doing.

4. STATE WHAT WOULD CHANGE YOUR MIND. Close with the specific measurement or evidence that would move your view.

Constraints: under 200 words. No preamble, no restating the question, no exhaustive bulleted list of every option. Plain, direct, unhurried. You are not withholding help. You are handing back the part of the work that is the learning.`;

const PLAIN_SYSTEM = `You are a helpful technical assistant. Answer the learner's question clearly and usefully. Under 200 words.`;

// The ONLY questions this endpoint will ever answer. The client sends an index,
// never text. Without this the endpoint is an open proxy to the API key: the origin
// lock stops a browser on another site and does nothing against a forged header.
const TEACH_QUESTIONS = [
  "My RAG pipeline's retrieval quality is bad. Should I switch to a better embedding model?",
  "Is it worth fine-tuning for my use case, or should I just write a longer prompt?",
  "My evals all pass but the product still feels wrong. What am I measuring incorrectly?",
];

const GRADER_SYSTEM = `You score one AI answer against a four-item rubric for judgment-preserving teaching. Be strict: a perfunctory or token attempt is a fail. Judge only what is present in the answer.

r1 — Elicits the learner's own read before giving substance.
r2 — Gives a range or set of live possibilities AND explicitly names the one thing the answer most turns on.
r3 — Names a disagreement with the question's premise or framing and leaves it open rather than resolving it.
r4 — States the specific evidence or measurement that would change its view.

Return ONLY valid JSON. No prose, no code fence, no explanation:
{"r1":{"pass":true,"note":"under 12 words"},"r2":{"pass":false,"note":"under 12 words"},"r3":{"pass":true,"note":"..."},"r4":{"pass":true,"note":"..."}}`;

const RUBRIC_TEXT = {
  r1: "Elicit the learner's own read before giving substance.",
  r2: 'Give a range of live possibilities and explicitly name the one thing the answer most turns on.',
  r3: "Name a disagreement with the question's premise and leave it open rather than resolving it.",
  r4: 'State the specific evidence or measurement that would change your view.',
};

async function gradeAnswer(question, answer) {
  const g = await callClaude(GRADER_SYSTEM, "Learner question:\n" + question + "\n\nAnswer to score:\n" + answer, 400);
  const m = g.text.match(/\{[\s\S]*\}/);
  return JSON.parse(m ? m[0] : g.text);
}

// Rebuild the reflect payload from scratch from known keys, coercing everything to a
// number or a fixed label. Nothing the caller sends reaches the prompt as free text.
const RUN_KEYS = ["panelsOpened", "assumptionsMoved", "uncertaintyFlags", "evidenceEngagement",
                  "evaluativeRange", "ambiguityTolerance", "framingAutonomy", "perceivedSharpness", "measuredEngagement"];
const ARM_LABELS = ["AI-attributed", "Human-attributed", "Unattributed"];

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(-1000, Math.min(1000, Math.round(n))) : 0;
}

function sanitizeRun(block) {
  const out = {};
  const src = (block && typeof block === "object") ? block : {};
  for (const k of RUN_KEYS) {
    out[k] = (src[k] === "undefined-in-this-condition") ? "undefined-in-this-condition" : num(src[k]);
  }
  return out;
}

function sanitizeReflect(body) {
  const d = (body && typeof body.design === "object") ? body.design : {};
  return {
    design: {
      conditionOrder: d.conditionOrder === "unassisted-first" ? "unassisted-first" : "assisted-first",
      attributionArm: ARM_LABELS.includes(d.attributionArm) ? d.attributionArm : "Unattributed",
      note: "n=1, order and slate randomised, no within-run control for practice or case difficulty",
    },
    supplied: sanitizeRun(body.supplied),
    notSupplied: sanitizeRun(body.notSupplied),
  };
}

async function callClaude(system, userMsg, maxTokens) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error((data.error && data.error.message) || "Claude API error");
  return { text: (data.content || []).map((b) => b.text || "").join("").trim(), model: data.model || MODEL };
}

export default async function handler(req, res) {
  const origin = allowOrigin(req);
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!origin) return res.status(403).json({ error: "Forbidden origin" });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });
  }

  try {
    const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    if (raw.length > MAX_BODY_BYTES) return res.status(413).json({ error: "Payload too large" });
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const mode = body.mode === "teach" ? "teach" : body.mode === "repair" ? "repair" : "reflect";

    // Teach is three model calls, repair is two, so each costs that much against the visitor budget.
    const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
    const limit = rateLimited(ip, mode === "teach" ? 3 : mode === "repair" ? 2 : 1);
    if (limit === "ip") return res.status(429).json({ error: "Rate limit: please wait a bit before trying again." });
    if (limit === "global") return res.status(429).json({ error: "This demo has hit its usage cap for today." });

    // The loop closing: a failed rubric item is fed back as an instruction, the answer
    // is rewritten against it, and the rewrite is scored again by the same grader.
    if (mode === "repair") {
      const qi = Number(body.questionId);
      if (!Number.isInteger(qi) || qi < 0 || qi >= TEACH_QUESTIONS.length) return res.status(400).json({ error: "Unknown question" });
      const q = TEACH_QUESTIONS[qi];
      // The prior answer is this endpoint's own output coming back. Capped hard, and the
      // worst an attacker gets for it is a 420-token rewrite of their own text, rate-limited.
      const prior = String(body.answer || "").slice(0, 2000);
      const failed = Array.isArray(body.failed) ? body.failed.filter((k) => RUBRIC_TEXT[k]).slice(0, 4) : [];
      if (!prior || !failed.length) return res.status(400).json({ error: "Nothing to repair" });

      const repairSystem =
        TEACH_SYSTEM +
        "\n\nREPAIR PASS. A grader scored your previous answer against the four rules and failed these:\n" +
        failed.map((k) => "- " + k + ": " + RUBRIC_TEXT[k]).join("\n") +
        "\n\nRewrite the answer so it clears every failed item. Keep what already worked. Do not mention the grader, the rubric, or that this is a revision. Same length limit.";

      const revised = await callClaude(repairSystem, "Learner question:\n" + q + "\n\nYour previous answer:\n" + prior, 420);
      let grades = null, graderError = null;
      try { grades = await gradeAnswer(q, revised.text); }
      catch (e) { graderError = String((e && e.message) || e); }

      return res.status(200).json({ governed: revised.text, grades, graderError, repairedRules: failed, model: revised.model });
    }

    if (mode === "teach") {
      const qi = Number(body.questionId);
      if (!Number.isInteger(qi) || qi < 0 || qi >= TEACH_QUESTIONS.length) return res.status(400).json({ error: "Unknown question" });
      const q = TEACH_QUESTIONS[qi];

      const [plain, governed] = await Promise.all([
        callClaude(PLAIN_SYSTEM, q, 420),
        callClaude(TEACH_SYSTEM, q, 420),
      ]);

      let grades = null, graderError = null;
      try { grades = await gradeAnswer(q, governed.text); }
      catch (e) { graderError = String((e && e.message) || e); }

      return res.status(200).json({
        plain: plain.text,
        governed: governed.text,
        grades,
        graderError,
        systemPrompt: TEACH_SYSTEM,
        model: governed.model,
      });
    }

    const userMsg = "Here is one reader's run:\n\n" + JSON.stringify(sanitizeReflect(body), null, 2) + "\n\nWrite the reflection.";
    const out = await callClaude(REFLECT_SYSTEM, userMsg, 320);
    // Report the exact model that served this response so the page can print it.
    return res.status(200).json({ reflection: out.text, model: out.model });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
