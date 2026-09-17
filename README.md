# Driver Job Max Flow

An interactive, browser-only visualization of driver/job assignment using an Edmonds–Karp maximum-flow algorithm.

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

The app is deployable as a static site. Pushes to `main` are built and published through the GitHub Pages workflow after Pages is enabled for GitHub Actions in the repository settings.
