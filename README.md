# Driver Job Max Flow

An interactive, browser-only visualizer for the **Job Assignment Using Network Flow** problem: assigning snow-plough drivers to job shifts by modeling the problem as a maximum-flow network and solving it with Edmonds–Karp.

**Live demo:** [driver-job-max-flow.vercel.app](https://driver-job-max-flow.vercel.app/)

## 📄 Algorithm write-up

The full problem statement, flow-network construction, complexity analysis, and proof of correctness are in **[`Network_Flow_Algo.pdf`](./Network_Flow_Algo.pdf)**.

The same write-up is also rendered live on the site itself — scroll to the bottom of the app, or jump straight to [driver-job-max-flow.vercel.app/#paper](https://driver-job-max-flow.vercel.app/#paper).

## What it does

Given a set of drivers, jobs, shifts, and eligibility constraints, the app:

1. Builds a flow network: `source → drivers → driver-shift slots → jobs → sink`, with edge capacities encoding each constraint (at most 2 shifts per driver, at most one job per shift, per-job driver requirements).
2. Runs Edmonds–Karp (BFS-based Ford–Fulkerson) to compute the maximum flow, step by step.
3. Animates each augmenting path and bottleneck as it's found, and reads the final flow back out as a concrete driver → job assignment.
4. Reports whether every job's demand was fully met, or which jobs are left short.

Scenarios can be edited directly in the UI, or imported/exported as JSON.

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

## Tech stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/) + TypeScript
- [@xyflow/react](https://reactflow.dev/) for the interactive flow-network diagram
- [KaTeX](https://katex.org/) for rendering the math in the paper section
- [Zod](https://zod.dev/) for scenario validation
- [Playwright](https://playwright.dev/) + [Vitest](https://vitest.dev/) for e2e and unit tests

## Deployment

The app is a static site. It's hosted on [Vercel](https://vercel.com/) at [driver-job-max-flow.vercel.app](https://driver-job-max-flow.vercel.app/), and pushes to `main` are also built and published through the GitHub Pages workflow in `.github/workflows/deploy.yml`.
