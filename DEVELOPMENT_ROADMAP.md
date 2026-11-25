# Case Study Tool — Development Roadmap

Status legend: `Completed`, `Partial`, `Missing`, `Blocked`.

| ID | Feature | Current Status | Required Work | Priority | Dependencies |
|---|---|---|---|---|---|
| AUTH-01 | Access control and user sessions | Completed | Registration, login, logout, authenticated sessions, password hashing, ownership checks, and live smoke verification | P0 | SQLITE, Node crypto |
| DB-01 | Persistent application database | Completed | SQLite schema and health check for users, sessions, projects, and case studies; live registration/project smoke tests passed | P0 | node:sqlite |
| API-01 | Health and API foundation | Completed | Preserve; add dependency checks for database, AI, and optional integrations | P0 | DB-01 |
| ERR-01 | Centralized HTTP errors | Completed | Extend error codes and keep validation consistent across modules | P1 | None |
| DASH-01 | React application entry point | Completed | Preserve and expand into project-focused authenticated dashboard | P1 | AUTH-01, PROJ-01 |
| DASH-02 | Loading, success, error, empty states | Partial | Apply to projects, history, reports, analysis, and downloads | P1 | Frontend API hooks |
| PROJ-01 | Project CRUD | Completed | Create, list, retrieve, ownership-safe delete, and live smoke verification | P0 | DB-01, AUTH-01 |
| PROJ-02 | Website/GitHub submission | Completed | Validated project URLs in project schema | P1 | PROJ-01 |
| CRAWL-01 | Website URL validation | Completed | HTTP/HTTPS parsing, redirects, DNS resolution, and private-address blocking | P0 | None |
| CRAWL-02 | robots.txt compliance | Completed | robots.txt retrieval and wildcard root-disallow enforcement | P1 | CRAWL-01 |
| CRAWL-03 | Multi-page website crawler | Completed | Bounded same-origin crawling with metadata, headings, text, and links | P1 | CRAWL-01, CRAWL-02 |
| CRAWL-04 | Crawler resilience | Completed | Timeout, redirect, status, content-type, size, and warning handling | P1 | CRAWL-01 |
| GITHUB-01 | GitHub URL validation | Completed | Public GitHub owner/repository URL parsing | P1 | None |
| GITHUB-02 | Repository metadata | Completed | Metadata, languages, license, topics, activity, and statistics | P1 | GitHub public API/GITHUB_TOKEN |
| GITHUB-03 | Repository structure | Completed | Recursive bounded repository tree collection | P1 | GITHUB-02 |
| GITHUB-04 | Stack/dependency detection | Completed | Common manifests and framework/dependency pattern detection | P1 | GITHUB-03 |
| GITHUB-05 | Architecture assessment | Completed | README, tests, manifests, tree, and technical indicators | P1 | GITHUB-04 |
| AI-01 | Groq integration | Completed | Optional Groq provider, timeout, JSON response mode, and fallback | P1 | GROQ_API_KEY optional |
| AI-02 | Evidence-based case study synthesis | Partial | Backend merges evidence and 24 report fields; external analysis needs live network and credential verification | P1 | CRAWL-03, GITHUB-05 |
| AI-03 | Competitor research | Blocked | Tavily configuration exists, but credential and external search verification are unavailable | P2 | TAVILY_API_KEY |
| AI-04 | SWOT and profitability | Partial | Structured SWOT and transparent insufficient-data profitability fallback; no invented numbers | P1 | AI-02 |
| CASE-01 | Case study CRUD | Completed | Per-project persisted status and JSON content | P1 | PROJ-01, DB-01 |
| CASE-02 | Report preview | Missing | Frontend API types exist, but no project/report dashboard UI is implemented | P1 | CASE-01 |
| PDF-01 | PDF generator | Completed | pdf-lib PDF generation with 24 report sections and page footers | P1 | CASE-01 |
| PDF-02 | Download endpoint | Completed | Ownership-safe generation and PDF download route | P1 | PDF-01 |
| SEC-01 | SSRF protection | Completed | DNS and private/local/link-local address checks for crawl targets and redirects | P0 | CRAWL-01 |
| SEC-02 | Input and secret safety | Partial | Validate all external inputs and keep API keys server-only | P0 | Environment configuration |
| QA-01 | Automated tests | Missing | Add unit and integration tests for auth, validation, storage, crawler, GitHub, analysis, and PDF | P1 | Core APIs |
| OPS-01 | Environment documentation | Partial | Document database, auth, AI, GitHub, Tavily, storage, and startup variables | P1 | .env.example |

## Verified baseline

- Completed: Express API foundation, centralized response/error handling, SQLite persistence, authenticated sessions, project CRUD, website crawling, GitHub analysis, case-study synthesis, PDF generation/download endpoints, health reporting, React entry point, and build/typecheck setup.
- Partial: frontend project/report workflows, loading/history states, Groq synthesis live verification, and competitor research.
- Missing: fully integrated frontend project management/report preview, automated test suite, and browser-verified external crawling/AI/PDF workflows.

The database implementation is complete for SQLite; external PostgreSQL is not required by the current architecture. Crawler and GitHub features are implemented but require live network verification for each target. AI competitor research is blocked only by unavailable Tavily credentials.
