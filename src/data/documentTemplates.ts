import { DocumentTemplate } from '@/types';

export const documentTemplates: DocumentTemplate[] = [
    {
        id: 'prd-template',
        type: 'PRD',
        title: 'Product Requirements Document',
        description: 'A comprehensive PRD template covering problem statement, user stories, success metrics, and requirements.',
        icon: 'FileText',
        content: `# Product Requirements Document (PRD)

## 1. Problem Statement
**Current situation:**
*Describe the current state of the product or process.*

**User pain points:**
*List the specific problems users are facing.*

**Business impact:**
*Explain how this problem affects the business (e.g., churn, revenue, efficiency).*

## 2. Proposed Solution
**Overview of the approach:**
*Provide a high-level summary of the proposed solution.*

**User stories:**
* \`As a [type of user], I want [an action] so that [a benefit/value]\`
* \`As a [type of user], I want [an action] so that [a benefit/value]\`

**Success metrics:**
* *Metric 1 (e.g., Increase conversion by X%)*
* *Metric 2 (e.g., Reduce support tickets by Y%)*

## 3. Requirements
### Functional requirements
* *Requirement 1*
* *Requirement 2*

### Technical requirements
* *Requirement 1*
* *Requirement 2*

### Design requirements
* *Requirement 1*

## 4. Implementation
**Dependencies:**
*List any systems, teams, or other projects this depends on.*

**Timeline estimate:**
*Estimated time to complete.*

**Resources needed:**
*List the team members and tools required.*

## 5. Risks and Mitigations
| Risk | Mitigation |
| :--- | :--- |
| *Risk 1* | *Mitigation 1* |
| *Risk 2* | *Mitigation 2* |
`
    },
    {
        id: 'jtbd-template',
        type: 'JTBD',
        title: 'Jobs-to-be-Done (JTBD)',
        description: 'A template focusing on understanding customer motivations and the "jobs" they hire products for.',
        icon: 'Target',
        content: `# Jobs-to-be-Done (JTBD)

## 1. The Core Job
*What is the fundamental progress the customer is trying to make in a given circumstance?*
**Job Statement:** \`When [Situation], I want to [Motivation], so I can [Expected Outcome].\`

## 2. The Circumstance (The "When")
*Describe the context or situation that triggers the need.*
* *Where are they?*
* *When is it happening?*
* *Who are they with?*
* *What else is going on?*

## 3. Forces of Progress
### Push (Struggling Moments)
*What is pushing them away from their current solution?*
* *Current frustration 1*
* *Current frustration 2*

### Pull (The Magnetism of the New)
*What is attracting them to a new solution?*
* *Attraction 1*
* *Attraction 2*

### Anxiety (Worry About the New)
*What makes them hesitate to adopt the new solution?*
* *Anxiety 1*
* *Anxiety 2*

### Habit (Allegiance to the Old)
*What makes them stick to their current behavior?*
* *Habit 1*
* *Habit 2*

## 4. Hiring Criteria
*What specific criteria will the customer use to decide if a product can do the job?*
* *Criteria 1*
* *Criteria 2*

## 5. Competitive Set
*What are the alternative ways (not just direct competitors) the customer could accomplish this job?*
* *Alternative 1*
* *Alternative 2*
`
    },
    {
        id: 'working-backwards-template',
        type: 'WorkingBackwards',
        title: 'Working Backwards (PR/FAQ)',
        description: "Amazon's framework for starting with the customer problem and desired outcome by writing an internal press release and FAQ before building.",
        icon: 'Megaphone',
        content: `# [Product Name]: [Tagline or Short Slogan]

**[City, Date]** – Today, [Company Name] announced [Product Name], a new [product/feature category] that helps [target customer] [core benefit].

## Summary
*A brief summary of the product and the benefit it provides. This should be easily understood by anyone.*

## The Problem
*Describe the problem your target customer is currently facing. Make it relatable and highlight the pain points.*

## The Solution
*Explain how your product elegantly solves the problem described above.*

## Quote from a Leader
*"We know our customers struggle with [Problem], and we built [Product Name] to give them a simple, effective way to [Benefit]," said [Leader Name], [Title] at [Company Name]. "With [Key Feature], they can finally [Outcome]."*

## How It Works
*Describe how a customer uses the product in simple, everyday language.*
1. *Step 1*
2. *Step 2*
3. *Step 3*

## Customer Quote
*"Before [Product Name], I used to spend hours [painful activity]. Now, I can [new capability] in just minutes, freeing me up to focus on [bigger goal]," said [Customer Name], [Customer Role].*

## Call to Action
*[Product Name] is available starting [Date]. To learn more or get started, visit [URL].*

---

# Frequently Asked Questions (FAQ)

## Customer FAQs
**1. How much does it cost?**
*[Answer]*

**2. How does this compare to [Current Alternative]?**
*[Answer]*

**3. What if I already use [Existing Product]?**
*[Answer]*

## Internal FAQs
**1. Why are we building this now?**
*[Answer]*

**2. What are the key technical challenges?**
*[Answer]*

**3. What is the business model?**
*[Answer]*

**4. How will we measure success?**
*[Answer]*
`
    },
    {
        id: 'technical-template',
        type: 'Technical',
        title: 'Technical Specification',
        description: 'Standard template for detailing architecture, APIs, and engineering implementation.',
        icon: 'Code',
        content: `# Technical Specification

## 1. Overview
*Briefly describe what is being built technically and why.*

## 2. Architecture & Design
*Describe the high-level architecture.*
* *Component 1*
* *Component 2*

## 3. Data Model
*Describe any changes to the database schema or data models.*

## 4. API Endpoints
### \`GET /api/endpoint\`
* **Description:** *What it does.*
* **Request:** *Parameters/Body.*
* **Response:** *Payload.*

## 5. Security & Performance
*Detail any specific security considerations or performance requirements.*
`
    },
    {
        id: 'persona-template',
        type: 'Persona',
        title: 'User Persona',
        description: 'Template for defining target users, their goals, frustrations, and behaviors.',
        icon: 'User',
        content: `# Persona: [Name / Role]

## Profile
* **Role:**
* **Demographics:**
* **Tools Used:**

## Goals
*What are they trying to achieve?*
* *Goal 1*
* *Goal 2*

## Frustrations
*What gets in their way?*
* *Frustration 1*
* *Frustration 2*

## Scenario
*Describe a typical day or use-case for this persona.*
`
    },
    {
        id: 'interview-template',
        type: 'Interview',
        title: 'Customer Interview Notes',
        description: 'Template for taking notes during customer discovery interviews.',
        icon: 'MessageSquare',
        content: `# Customer Interview: [Customer Name / Company]

**Date:** [Date]
**Interviewer:** [Your Name]
**Role:** [Customer Role]

## Context & Background
*Brief notes about the customer and their business.*

## Key Insights
*Highlight the most important learnings from the interview.*

## Detailed Notes
* **Topic 1:** *Notes...*
* **Topic 2:** *Notes...*

## Action Items
* [ ] *Follow up action 1*
* [ ] *Follow up action 2*
`
    }
];
