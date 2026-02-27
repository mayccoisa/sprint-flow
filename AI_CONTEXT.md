# Sprintflow Wizard - AI Context Guide

## Overview
Sprintflow Wizard is a comprehensive Product & Engineering management tool designed to bridge the gap between product strategy, discovery, and engineering delivery. It acts as a single source of truth for initiatives moving through their entire lifecycle, from an initial idea (Product Strategy) to deployed code (Releases).

## Core Data Models & Lifecycle

### 1. Initiatives (Tasks)
An Initiative (referred to structurally as `Task`) is the core unit of work.
- **Types**: Feature, Bug, TechDebt, Spike.
- **Priority**: High, Medium, Low.
- **Lifecycle (Status)**:
  - **Product Phase**: `Discovery` -> `Refinement` -> `ReadyForEng`
  - **Engineering Phase**: `Backlog` -> `InSprint` -> `Review` -> `Done` -> `Archived`

*Key Attributes:*
- **Product Context**: `product_objective`, `business_goal`, `user_impact`, `has_prototype`, `prototype_link`.
- **Engineering Estimates**: `estimate_frontend`, `estimate_backend`, `estimate_qa`, `estimate_design`.
- **Relationships**: Can be linked to a specific `feature_id` (which belongs to a `module_id`), and an `area_id`.

### 2. Product Architecture
The product being built by the user is structured hierarchically:
- **Product Modules**: High-level components or domains of the product (e.g., "Authentication", "Payment Processing"). Modules have a `health_score`.
- **Product Features**: Specific capabilities within a module (e.g., "Social Login", "Credit Card Checkout"). Features have statuses (`Live`, `Beta`, `Development`, `Concept`, `Deprecated`).
- **Product Services**: Technical services or infrastructure (Internal, External, Database, Queue).
- **Service Dependencies**: Maps which Features depend on which Services (Read, Write, etc.).
- **Module Metrics**: Tracks health like `bug_count`, `nps`, or `usage_rate` per module.

### 3. Organization Structure
- **Squads**: Teams of people (Active/Inactive).
- **Team Members**: Individuals belonging to squads, with specific specialties (Frontend, Backend, QA, Design) and capacity.

### 4. Delivery Mechanics
- **Sprints**: Time-boxed periods for squads to complete engineering work (`Planning`, `Active`, `Completed`, `Cancelled`).
- **Releases**: Grouping of completed tasks into versions deployed to users (`Planned`, `InProgress`, `Released`).

---

## Core Pages & Functionality

### 1. Dashboard (`/`)
- Overview of KPIs: Active Sprint days remaining, Discovery Queue size, Engineering Ready size, and Strategy Health (modules with >80% score).
- Recent activity feed.

### 2. Product Strategy (`/strategy`)
- **KPI Snapshot**: Visualizes module health, bugs, and usage.
- **Pain vs Cure Chart**: Compares bugs reported vs initiatives delivered per module.
- **Architecture View**: Interactive node-based map (React Flow) visualizing how Modules, Features, and Technical Services connect.
- **Strategic Narrative (AI)**: Allows crafting Andy Raskin-style strategic narratives for the product vision.

### 3. Product Backlog (`/product-backlog`)
- Kanban board specifically for the **Product Phase**.
- Columns: `Discovery`, `Refinement`, `Ready for Eng`.
- Drag-and-drop support. Once ready, an initiative can be "Promoted to Engineering" (moves to `Backlog` status).

### 4. All Initiatives (`/initiatives`)
- Master list of all items across both Product and Engineering lifecycles.
- **AI Integration**: Ability to draft a comprehensive Product Requirements Document (PRD) using the `prd-writer` AI skill when creating a new initiative.

### 5. Engineering Views (Sprints & Team)
- **Sprint Planning**: Allocating estimated tasks to squad members based on their available capacity.
- **Active Sprints**: Tracking actual progress (`Todo`, `InProgress`, `Blocked`, `Done`).
- **Squads & Team**: Managing member specialties and capacities to ensure predictable delivery.
- **Releases**: Packaging "Done" tasks into versions and generating release notes.

---

## AI Agent Integration Rules
When creating AI agents or features for Sprintflow Wizard, follow these guidelines:

1. **Terminology**: Use "Initiatives" for high-level product work and "Tasks" or "Stories" when it enters the Engineering phase.
2. **Frameworks**: Default to established product frameworks (e.g., "Jobs to be Done", "Shape Up", "Strategic Narrative", "RICE scoring") when assisting the user with discovery or planning.
3. **Data Integrity**: When generating content for an Initiative, ensure it maps to the structured fields (`product_objective`, `business_goal`, `user_impact`).
4. **Context Awareness**: If the user is in the `ProductStrategy` page, focus on high-level architecture, metrics, and vision. If they are in `ProductBacklog`, focus on scoping, narrowing down acceptance criteria, and making it "Ready for Eng".
