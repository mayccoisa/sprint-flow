import { render, screen } from '@testing-library/react';
import Backlog from '../Backlog';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Mocks
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultValue?: string) => {
            if (key === 'engineeringBacklog.columns.backlog') return 'Backlog';
            if (key === 'engineeringBacklog.columns.inSprint') return 'InSprint';
            if (key === 'engineeringBacklog.columns.review') return 'Review';
            if (key === 'engineeringBacklog.columns.done') return 'Done';
            return defaultValue || key;
        },
    }),
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

vi.mock('@/components/Layout', () => ({
    Layout: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}));

vi.mock('@/components/TaskFormDialog', () => ({
    TaskFormDialog: ({ open }: { open: boolean }) => open ? <div>Task Form Dialog</div> : null,
}));

// Mock useLocalData
const mockTasks = [
    {
        id: 1,
        title: 'Eng Task 1',
        status: 'Backlog',
        created_at: '2023-01-02',
        task_type: 'Bug',
        priority: 'Medium',
        product_objective: null
    },
    {
        id: 2,
        title: 'Eng Task 2',
        status: 'InSprint', // Should filter out? Backlog page typically shows Backlog/Todo
        created_at: '2023-01-03',
        task_type: 'TechDebt',
        priority: 'Low',
        product_objective: null
    }
];

vi.mock('@/hooks/useLocalData', () => ({
    useLocalData: () => ({
        data: {
            tasks: mockTasks,
            sprints: [], // Mock empty since Backlog might use sprint data
            taskAssignments: []
        },
        addTask: vi.fn(),
        updateTask: vi.fn(),
        deleteTask: vi.fn()
    })
}));

describe('Backlog (Engineering)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders engineering backlog tasks', () => {
        render(
            <BrowserRouter>
                <Backlog />
            </BrowserRouter>
        );

        // The component uses its own hardcoded INITIAL_TASKS, one of which is "Implement Authentication Flow"
        // in 'InSprint' or "Fix Navigation Bug on Mobile" in 'Backlog'
        expect(screen.getByText('Fix Navigation Bug on Mobile')).toBeInTheDocument();
    });
});
