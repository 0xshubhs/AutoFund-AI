# Deploying AutoFund AI (Vercel)

Next.js 16 app — deploys to Vercel with zero config. The only thing to get right
is the environment so the **live AI** and **live data** don't depend on an
ephemeral RunPod URL.

## 1. One-time

```bash
npm i -g vercel      # if not installed
vercel login
```

## 2. Deploy

From the repo root:

```bash
vercel            # first run: link/create the project, accept defaults
vercel --prod     # promote to a public production URL
```

## 3. Set env vars (Project → Settings → Environment Variables)

All optional — with none set the app still runs (mock data + heuristic AI). Set
these for a **judge-facing** deployment:

| Variable | Value | Why |
| --- | --- | --- |
| `OPENAI_BASE_URL` | `https://<your-pod>-8002.proxy.runpod.net/v1` | Pin the AI endpoint so the demo doesn't fall back to heuristic when the baked-in default rotates. |
| `OPENAI_MODEL` | `Qwen/Qwen3-VL-8B-Instruct` | Model id served by the endpoint. |
| `OPENAI_API_KEY` | `runpod-local` (any non-empty) | vLLM ignores it; required so the client constructs. |
| `SOSO_API_KEY` | *(paste when the Buildathon key lands)* | Flips news/market/sector/ETF data from mock → **live**. No code change. |

After adding vars, redeploy (`vercel --prod`) so they take effect.

## 4. Verify live

```bash
curl https://<your-url>/api/autofund/health
# expect: ai.live=true, and once the SoSo key is set: sosovalue.live=true
```

Then open `/dashboard` — the **AI Desk Brief** card should read "live model".

> RunPod proxy URLs are ephemeral. If the demo AI goes quiet, update
> `OPENAI_BASE_URL` to the current pod URL and redeploy — or switch to an OpenAI
> key (`OPENAI_BASE_URL=https://api.openai.com/v1`, real `OPENAI_API_KEY`).
