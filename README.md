# Chandril Goswami — Portfolio

Standalone portfolio site built with semantic HTML, CSS, and vanilla JavaScript. This folder is the complete downloadable website; it does not need Node, React, a build step, or a backend.

## Run with VS Code Live Server

1. Open the `site` folder in VS Code.
2. Install the **Live Server** extension if it is not already available.
3. Right-click `index.html` and choose **Open with Live Server**.

You can also serve this folder with any static web server. Opening `index.html` directly works for most sections; GitHub repository loading requires a network-enabled web origin.

## Included

- Responsive portfolio sections, profile rail, and compact navigation
- Original profile photograph and internship offer / completion documents
- Interactive systems map and signal pipeline
- Autonomous Navigation Lab: 15 × 11 maze, BFS shortest route, controls, speed, and telemetry
- Eight planned project concepts with category filters
- Local, deterministic Job Match Analyzer and transparent disclaimer
- NLP, classification, regression, and ML pipeline demonstrations
- Three distinct internship records with organization-specific supporting files
- Safe simulated portfolio terminal
- GitHub repository fetch for `Chandril6290Da`, with filtering, sorting, and loading / error / empty states
- Mailto contact workflow; no contact data is submitted to a server

## Notes

- The robot readings and motor output are simulated; no physical robot is connected.
- The NLP sentiment demo uses a built-in word-based heuristic, not a trained model.
- The Job Match Analyzer compares portfolio language with a job description; it does not predict hiring.
- GitHub repositories are loaded from GitHub's public API at runtime. Network access and API availability are required for repository results.
- Internship date ranges and education timeline reflect the source portfolio. The BCA is not represented as completed.
- The hero does not link to a CV because no CV file or valid CV URL is included in the source.
- Google Fonts, Lucide icons, and optional GSAP scroll support load from CDNs; the core site remains static.

## File layout

- `index.html` — portfolio content and semantic structure
- `css/` — original stylesheets plus `chandril-portfolio.css`
- `js/` — preserved vanilla JavaScript modules
- `assets/` — original profile image
- `COMPLETED INTERNSHIP/`, `OFFER LATTER/` — original PDFs
