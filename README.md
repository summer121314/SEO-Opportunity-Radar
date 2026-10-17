# SEO Opportunity Radar
Daily, low-cost public-source opportunity discovery. Data comes from Hacker News and GitHub, and is **not proof of Google organic traffic**. The public dashboard includes keyword ideas, category filtering, bookmarks, scores and Google Trends links.

## Setup
Node 20+. Build: `npm run build`. Vercel preset Other; Build Command `npm run build`; Output Directory `dist`.
Run GitHub **Actions → Daily opportunity radar → Run workflow**. Allow **Settings → Actions → General → Workflow permissions → Read and write permissions** if commits are rejected. Cron 02:23 UTC (11:23 Japan), subject to delays. Third-party APIs can fail; no result means no confirmed findings.
