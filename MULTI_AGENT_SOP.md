# 🌐 Multi-Agent Standard Operating Procedure (SOP)
## BrgyConnect Autonomous & Collaborative Engineering Lifecycle

This document defines the exact operational protocol, message handovers, and quality gates across all 5 specialized AI conversations in **BrgyConnect**.

---

## 🏛️ Node Architecture & Identifiers

| Node # | Specialized Agent | Conversation ID | Primary Mandate |
| :---: | :--- | :--- | :--- |
| **1** | **[🎯 Product Strategist](conversation://45ee6b25-d500-4f7a-958a-2c4ba1c88a77)** | `45ee6b25-d500-4f7a-958a-2c4ba1c88a77` | Roadmaps, citizen problem statements, feature scopes, and milestone prioritization. |
| **2** | **[🎨 Lead Product Designer (UI/UX)](conversation://1ee4baed-7b22-40f0-a209-9a6a511bd8f3)** | `1ee4baed-7b22-40f0-a209-9a6a511bd8f3` | Component wireframes, visual hierarchy, mobile drawer ergonomics, touch targets (≥44px), and handoff artifacts. |
| **3** | **[⚡ Engineering Hub](conversation://3544ab40-f53a-4478-938c-4ffadf8dc6b5)** | `3544ab40-f53a-4478-938c-4ffadf8dc6b5` | Technical architecture, parallel builder fan-out, SSR validation, automated E2E browser tests, and release orchestration. |
| **4** | **[🗄️ DBA & Cloud Architect](conversation://b1e2f794-7a77-49d6-ad06-adbd1b04aa1e)** | `b1e2f794-7a77-49d6-ad06-adbd1b04aa1e` | Supabase PostgreSQL migrations, Row-Level Security (RLS), spatial indexing, and `SECURITY DEFINER` auditing. |
| **5** | **[📢 Poster & Community Lead](conversation://1b7a4124-a255-4455-b698-7f87ffdf4d37)** | `1b7a4124-a255-4455-b698-7f87ffdf4d37` | Citizen engagement, Taglish community broadcasts, educational how-to guides, and Facebook launch campaigns. |

---

## 🔄 End-to-End 6-Stage Lifecycle Pipeline

```mermaid
graph TD
    subgraph Stage_1 ["Stage 1: Strategy & Definition"]
        PS[1. 🎯 Product Strategist] -->|Feature Scope & Requirements| UX[2. 🎨 UI/UX Designer]
    end

    subgraph Stage_2 ["Stage 2: Design Specification & Validation"]
        UX -->|Clarify / Iterate if Blocked| PS
        UX -->|Approved Design Spec & Handoff Artifact| ENG[3. ⚡ Engineering Hub]
    end

    subgraph Stage_3 ["Stage 3: Engineering Execution & TDD"]
        ENG -->|Parallel Builders Fan-Out| B[Builder Subagents]
        B -->|Draft Code & Migration Schema| Build[pnpm run build (0 errors)]
        Build -->|Automated Browser E2E Tests| QA[QA Critic & Screenshot Proof]
    end

    subgraph Stage_4 ["Stage 4: Downstream Fan-Out"]
        QA -->|Full Database Audit & Security Review| DBA[4. 🗄️ DBA & Cloud Architect]
        QA -->|Screenshots & Walkthrough Brief| POST[5. 📢 Poster / Community Lead]
    end

    subgraph Stage_5 ["Stage 5: Security Sign-Off & Git Gate"]
        DBA -->|RLS, Indexes & Security Sign-Off| Gate{DBA Audit Passed?}
        Gate -->|YES| UserGate[Prompt User for Git Approval]
        UserGate -->|Explicit User Confirmation| GitPush[Git Commit & Push to Main]
    end

    subgraph Stage_6 ["Stage 6: Public Release & Broadcast"]
        GitPush -->|Release Live Broadcast| POST_Live[Poster Schedules / Publishes Facebook Posts]
    end
```

---

## 📋 Detailed Stage Protocol

### 🎯 Stage 1: Product Strategy -> UI/UX Design
1. **Product Strategist** defines the milestone, user problem statement, functional acceptance criteria, and exports the requirement brief.
2. Sends an inter-agent handoff message to **Lead Product Designer** (`1ee4baed-7b22-40f0-a209-9a6a511bd8f3`).

### 🎨 Stage 2: UI/UX Design Specification & Validation
1. **Lead Product Designer** inspects the product requirements.
2. If ambiguities or UX blockers exist, iterates with **Product Strategist** to clarify.
3. Formulates pixel-perfect component specifications, mobile responsiveness patterns, and color tokens into a structured `phase_X_design_handoff.md`.
4. Sends the verified handoff artifact to **Engineering Hub** (`3544ab40-f53a-4478-938c-4ffadf8dc6b5`).

### ⚡ Stage 3: Engineering Execution & TDD
1. **Engineering Hub** ingests the design handoff and drafts `implementation_plan.md`.
2. Fans out dedicated parallel **Builder Subagents** (`Model: 'flash'`).
3. If new data fields are needed, Engineering drafts the initial SQL migration in `supabase/migrations/`.
4. Executes unified build validation: `npx --yes pnpm run build` (**0 errors mandatory**).
5. Runs automated browser E2E tests (Puppeteer) across desktop (1440px) and mobile (375px) viewports, capturing high-resolution verification screenshots.
6. Updates `walkthrough.md`.

### 🗄️📢 Stage 4: Downstream Notification to DBA and Poster
1. **Engineering Hub** sends a notification to **DBA & Cloud Architect** (`b1e2f794-7a77-49d6-ad06-adbd1b04aa1e`) requesting a full database audit (RLS coverage, spatial indexing, `SECURITY DEFINER` safety).
2. **Engineering Hub** simultaneously notifies **Poster** (`1b7a4124-a255-4455-b698-7f87ffdf4d37`) with the walkthrough brief and screenshot artifacts so Poster can draft launch posts and infographics in parallel.

### 🛡️ Stage 5: DBA Sign-Off & Strict User Git Gate
1. **DBA & Cloud Architect** conducts the security and migration audit.
2. Once DBA gives an official **PASS / Sign-Off**, **Engineering Hub** prepares the Conventional Commit message and prompts the **User** for explicit approval.
3. Upon user confirmation, **Engineering Hub** executes `git commit` and `git push origin main`.

### 🚀 Stage 6: Public Release & Community Broadcast
1. **Engineering Hub** notifies all nodes that the release is live on `main`.
2. **Poster** finalizes and publishes the community Facebook announcements and infographics.
