# Enabling the live-Claude reflection

The Drift Meter can have **Claude read a reader's run and write a short, bespoke reflection** in real time. This is off by default (the button shows a polite "available on request" note). Turning it on takes about 15 minutes and a few dollars of API credit.

## Why a serverless function?

Your Anthropic API key must **never** appear in the webpage — anyone could view-source and steal it. So the browser can't call Claude directly. Instead, a tiny function on a server holds the key and makes the call:

```
Drift Meter (browser)  →  your function (holds the key)  →  Claude API  →  reflection text  →  back to the page
```

The function is already written for you: `api/reflect.js`.

## Steps

### 1. Get an API key
- Go to **console.anthropic.com**, create a key, and add a small amount of credit (each reflection costs a fraction of a cent).
- Keep the key secret. You'll paste it into the host, not the code.

### 2. Deploy to Vercel (free)
- Push this project to a GitHub repo (you already have one for GitHub Pages — you can reuse it).
- Go to **vercel.com → Add New → Project → Import** your repo, and deploy. Vercel automatically serves `api/reflect.js` as a function and your HTML as static pages.

### 3. Add your key as an environment variable
- In the Vercel project: **Settings → Environment Variables**
- Add: name `ANTHROPIC_API_KEY`, value `sk-ant-...` (your key). Redeploy.

### 4. Point the Drift Meter at the function
- Your function lives at `https://<your-project>.vercel.app/api/reflect`. Open it once in the browser — a `POST only` message means it's live.
- In **`Drift Meter.dc.html`**, find:
  ```js
  REFLECT_ENDPOINT = "";
  ```
  and set it to your URL:
  ```js
  REFLECT_ENDPOINT = "https://your-project.vercel.app/api/reflect";
  ```
- Re-bundle to `drift-meter.html` and re-upload. The button now generates a live reflection.

## Notes
- **Hosting everything on Vercel** (instead of GitHub Pages) is simplest, since Vercel serves both the static site and the function from one place. If you keep the site on GitHub Pages, that's fine too — only the function needs Vercel.
- **Cost control:** the function is cheap, but for a public link consider adding rate-limiting and restricting CORS (replace `"*"` with your site's origin in `api/reflect.js`).
- **Model:** `api/reflect.js` uses `claude-sonnet-4-5`; swap in any current model id from the console if you prefer.
- **Netlify/Cloudflare** work too — the logic is identical; only the function wrapper differs slightly.
