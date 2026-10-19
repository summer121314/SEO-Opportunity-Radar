# SEO Opportunity Radar
Daily, low-cost public-source opportunity discovery. Data comes from Hacker News and GitHub, and is **not proof of Google organic traffic**. The public dashboard includes keyword ideas, category filtering, bookmarks, scores and Google Trends links.

## Setup
Node 20+. Build: `npm run build`. Vercel preset Other; Build Command `npm run build`; Output Directory `dist`.
Run GitHub **Actions → Daily opportunity radar → Run workflow**. Allow **Settings → Actions → General → Workflow permissions → Read and write permissions** if commits are rejected. Cron 02:23 UTC (11:23 Japan), subject to delays. Third-party APIs can fail; no result means no confirmed findings.

## Google Trends JP/US discovery

The scheduled workflow also runs `node scripts/collect-trends.mjs` once daily (02:23 UTC / 11:23 JST). It fetches Google Trends **Trending Now RSS** for JP and US, writing `public/trends.json` only when at least one regional feed works; a total feed failure exits nonzero rather than claiming a refresh. The dashboard pages `/trends.html`, `/en/trends.html`, `/ja/trends.html` show approximate *recent* traffic buckets and only rule-based ideas for further research. RSS does not provide reliable percentage growth or keyword difficulty. Google Trends is credited and linked. First scheduled or manual workflow run is required to populate results. GitHub Actions must be allowed to push with Contents write permissions.
