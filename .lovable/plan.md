## Plan: Ocean Academy PRD (PDF)

Generate a professional Product Requirements Document for the Ocean Academy course-selling portal and deliver it as a downloadable PDF.

### Deliverable
- `/mnt/documents/Ocean_Academy_PRD.pdf` — single PDF, ~10–14 pages, with a styled cover page using the brand's dark navy + gold accent, clear section hierarchy, and tables for data models and pages.

### PRD sections
1. Cover page — product name, tagline, version, date
2. Executive summary — what Ocean Academy is and who it serves
3. Goals & non-goals
4. Target users & personas (student, admin/owner)
5. Scope & key features
6. Site map & pages — Home, Catalog, Course Detail, Checkout, Dashboard, Lesson Viewer, Auth, About, Contact, Admin
7. User flows — browse → purchase (card + USDT), enroll → learn, admin confirm payment
8. Featured product spec — Stock Market Investing Foundation Course ($299, beginner, 4 weeks, modules, resources, FAQ, disclaimer)
9. Payments — Card flow and USDT flow (TRC20/ERC20, wallet, tx hash, proof upload, pending/confirmed/rejected)
10. Admin requirements — orders, students, courses CRUD, payment confirmation
11. Data models — Users, Roles, Courses, Modules, Lessons, Orders, Payments, Progress, Support Messages
12. Design system — palette (navy/white/gold), typography, components, responsive/mobile-first
13. Security — auth, RLS-style protected content, admin-only access, USDT proof validation
14. Tech stack & architecture — React + Vite + Tailwind frontend, Lovable Cloud backend (when enabled)
15. Success metrics
16. Roadmap & milestones
17. Risks & open questions

### Implementation
- Use Python + reportlab to build the PDF (Platypus flowables for headings, paragraphs, tables, page breaks).
- Brand styling: dark navy `#0B1B33` cover, gold accent `#C9A24B`, serif display for titles, sans body.
- After generation, render pages to images with `pdftoppm` and visually QA every page for overflow, contrast, and layout issues; fix and re-render until clean.
- Emit a `<presentation-artifact>` tag so the user can preview/download.

No app code will be changed.