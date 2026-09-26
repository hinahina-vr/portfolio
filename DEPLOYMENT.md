# GitHub Pages deployment

- Repository: https://github.com/hinahina-vr/portfolio
- Site: https://hinahina-vr.github.io/portfolio/
- Application version: 2.3.2
- Publishing branch: main
- Build: Node.js 22, npm ci, npm run build
- Verification gate: npm test against built dist in Chromium
- Published directory: dist
- Revision endpoint: https://hinahina-vr.github.io/portfolio/build.json

The existing hinahina-vr.github.io root site belongs to a separate project. This portfolio uses its own repository and Pages project path.

The first publication preserves the verified v2.3.2 application, imagery and styling. Deployment adds a GitHub Actions workflow and makes the existing browser suite usable on Linux. Research captures, local QA outputs, node_modules and build outputs are not committed.

The workflow follows the official [Vite GitHub Pages guide](https://vite.dev/guide/static-deploy.html#github-pages), with separate build and deployment jobs and pinned official Actions. Pages uses the workflow build type described in [GitHub's API documentation](https://docs.github.com/en/rest/pages/pages#create-a-github-pages-site).

Deployment completion and actual public-site verification will be recorded below after the first run finishes.
