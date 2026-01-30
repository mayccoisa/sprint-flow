export const en = {
    translation: {
        common: {
            settings: "Settings",
            language: "Language",
            selectLanguage: "Select your preferred language",
            back: "Back",
            save: "Save",
            cancel: "Cancel",
            saved: "Saved",
            created: "Created",
            archived: "Archived",
        },
        languages: {
            en: "English",
            pt: "Portuguese",
        },
        sidebar: {
            dashboard: "Dashboard",
            initiatives: "Initiatives",
            allInitiatives: "All Initiatives",
            productBacklog: "Product Backlog",
            engineeringBacklog: "Engineering Backlog",
            squads: "Squads",
            team: "Team Members",
            backlog: "Backlog",
            sprints: "Sprints",
            calendar: "Calendar",
            releases: "Releases",
            seedData: "Seed Data",
        },
        settings: {
            title: "Settings",
            general: "General",
            appearance: "Appearance",
            notifications: "Notifications",
        },
        validation: {
            required: "Required",
            maxLength: "Max {{max}} characters",
            atLeastOneEstimate: "At least one estimate is required"
        },
        initiatives: {
            title: "All Initiatives",
            subtitle: "Overview of all items across Product and Engineering lifecycles.",
            listTitle: "Initiatives List",
            filterPlaceholder: "Filter initiatives...",
            table: {
                title: "Title",
                type: "Type",
                priority: "Priority",
                phase: "Lifecycle Phase",
                status: "Current Status",
                empty: "No initiatives found."
            },
            phases: {
                product: "Product",
                engineering: "Engineering",
                archived: "Archived"
            }
        },
        productBacklog: {
            title: "Product Backlog",
            subtitle: "Manage initiatives and discovery.",
            newInitiative: "New Initiative",
            searchPlaceholder: "Search...",
            columns: {
                discovery: "Discovery",
                refinement: "Refinement",
                readyForEng: "Ready for Eng"
            },
            promote: "Promote to Engineering",
            promoteConfirmTitle: "Promote to Engineering Backlog?",
            promoteConfirmDesc: "This item will be moved to the 'Backlog' status and become visible to the engineering team.",
            readyMsg: "Ready items can be promoted"
        },
        engineeringBacklog: {
            title: "Engineering Backlog",
            subtitle: "Manage implementation tasks and sprint flow.",
            newTask: "New Task",
            columns: {
                backlog: "To Do (Backlog)",
                inSprint: "In Sprint",
                review: "Review / QA",
                done: "Done"
            },
            stats: {
                total: "Total Backlog",
                effort: "Effort (Pts)",
                bugs: "Bugs",
                highPriority: "High Priority"
            },
            archive: "Archive",
            edit: "Edit",
            dragDrop: "Drop items here"
        },
        initiativeForm: {
            newTitle: "New Initiative",
            editTitle: "Edit Initiative",
            sections: {
                whatWhy: "What & Why",
                discovery: "Discovery & Validation"
            },
            fields: {
                title: "Title",
                objective: "Objective (Why?)",
                userImpact: "User Impact (Who?)",
                businessGoal: "Business Goal / KPI",
                hasPrototype: "Has Prototype / Mockups?",
                prototypeLink: "Prototype Link",
                type: "Type",
                priority: "Priority"
            },
            placeholders: {
                objective: "Why are we building this? problem statement.",
                userImpact: "Target audience and expected outcome.",
                businessGoal: "e.g. Increase conversion by 5%",
                prototypeLink: "Figma or resource link",
                title: "Initiative name"
            },
            save: "Save Initiative",
            cancel: "Cancel"
        },
        taskForm: {
            newTitle: "New Task",
            editTitle: "Edit Task",
            productContext: {
                title: "Product Context",
                objective: "Objective",
                businessGoal: "Business Goal",
                userImpact: "User Impact",
                prototype: "Prototype",
                viewPrototype: "View Prototype"
            },
            sections: {
                basicInfo: "Basic Information",
                dates: "Dates",
                estimates: "Estimates by Specialty"
            },
            fields: {
                title: "Title",
                description: "Description",
                type: "Type",
                priority: "Priority",
                startDate: "Start Date",
                endDate: "End Date",
                frontend: "Frontend",
                backend: "Backend",
                qa: "QA",
                design: "Design"
            },
            placeholders: {
                title: "Enter task title",
                description: "Enter description (optional)",
                selectDate: "Select a date"
            },
            totalEffort: "Total Effort: {{points}} points"
        }
    }
};
