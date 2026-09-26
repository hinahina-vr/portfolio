# GitHub Pages deployment

- Repository: https://github.com/hinahina-vr/portfolio
- Site: https://hinahina-vr.github.io/portfolio/
- Application version: 2.3.3
- Publishing branch: main
- Build: Node.js 22, npm ci, npm run build
- Verification gate: npm test against built dist in Chromium
- Published directory: dist
- Revision endpoint: https://hinahina-vr.github.io/portfolio/build.json

The existing hinahina-vr.github.io root site belongs to a separate project. This portfolio uses its own repository and Pages project path.

The first publication preserves the verified v2.3.2 application, imagery and styling. Deployment adds a GitHub Actions workflow and makes the existing browser suite usable on Linux. Research captures, local QA outputs, node_modules and build outputs are not committed.

The workflow follows the official [Vite GitHub Pages guide](https://vite.dev/guide/static-deploy.html#github-pages), with separate build and deployment jobs and pinned official Actions. Pages uses the workflow build type described in [GitHub's API documentation](https://docs.github.com/en/rest/pages/pages#create-a-github-pages-site).

## Initial publication — v2.3.2 / 2026-09-26

- Published application revision: `82282d67261ab917fc327b1d7c6372906e55a631`.
- [Successful build and deployment](https://github.com/hinahina-vr/portfolio/actions/runs/36228224339).
- GitHub Actions performed a clean npm install, built the site and passed all 17 browser checks before publishing. The responsive layout matrix pauses background motion after the dedicated motion tests; it still renders actual frames on scene changes and resizing.
- Public HTTPS URL was opened in real Google Chrome 153.0.8010.53 at 2026-09-26 08:01 UTC. All 5 public-site checks passed: initial Gaia display and actual timed slide, all 7 work images and Japanese descriptions, concept link and retained selection, Index/mobile layout, and deployed revision metadata. No application or public-asset request errors.
- Visually reviewed the actual public desktop page and the mobile Experiments page. Local evidence: `qa/deployment/public-results.json`, `public-desktop.png`, `public-mobile.png`, `public-experiment-mobile.png`, and `github-actions-passed.log`.
- The local rebuilt site's 19 files matched the previously verified v2.3.2 SHA256 record. The publication does not change the site's design or project content.

The first clean install exposed a corrupted detect-libc lock entry. It was restored to the actual installed and registry-verified version 2.1.2, with the original integrity hash. All locally installed package versions then matched the lockfile. An earlier browser run was stopped after 10 passing checks because continuous software rendering made the layout matrix slow; that interrupted run is not counted as a passed suite. Its log and the initial install failure are retained under `qa/deployment/`.

Documentation-only commits record deployments without rebuilding the site. The revision endpoint identifies the deployed application commit. Mobile verification uses Chrome viewport emulation, not physical iPhone/Android devices; Safari and Firefox are untested. External project links were opened, but the other applications' complete internal functionality was not tested.

## Current publication — v2.3.3 / 2026-09-26

Removed the slideshow pause/play button while preserving automatic transitions. Published commit: `fb413c468a65bb67a28a99585d17ba758baf47de`. [Build, all 17 browser checks and deployment passed](https://github.com/hinahina-vr/portfolio/actions/runs/36239069039).

The actual public site passed 5 browser checks, including the absent button, timed autoplay, all project previews and links, mobile layout, and matching build metadata. Desktop and mobile public captures were visually inspected. Evidence: `qa/deployment/public-results.json` and `qa/deployment/public-*.png`; dedicated real-time regressions: `qa/v2.3.3/slideshow-results.json` (5 PASS). The previous public verification is archived in `qa/v2.3.2/deployment/`.
