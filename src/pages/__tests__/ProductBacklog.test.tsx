import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductBacklog from '../ProductBacklog';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Mocks
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultValue?: string) => defaultValue || key,
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

vi.mock('@/components/InitiativeFormDialog', () => ({
    InitiativeFormDialog: ({ open }: { open: boolean }) => open ? <div>Initiative Form Dialog</div> : null,
}));

vi.mock('@/components/TaskFormDialog', () => ({
    TaskFormDialog: ({ open }: { open: boolean }) => open ? <div>Task Form Dialog</div> : null,
}));

// Mock useLocalData
const mockTasks = [
    {
        id: 1,
        title: 'Strategy Initiative 1',
        status: 'Discovery',
        created_at: '2023-01-01',
        task_type: 'Feature',
        priority: 'High',
        product_objective: 'Obj 1'
    },
    {
        id: 2,
        title: 'Eng Task 1',
        status: 'Backlog',
        created_at: '2023-01-02',
        task_type: 'Bug',
        priority: 'Medium',
        product_objective: null
    }
];

const mockAddTask = vi.fn();

vi.mock('@/hooks/useLocalData', () => ({
    useLocalData: () => ({
        data: {
            tasks: mockTasks,
        },
        addTask: mockAddTask,
    })
}));

describe('ProductBacklog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the product backlog tasks (Discovery status)', () => {
        render(
            <BrowserRouter>
                <ProductBacklog />
            </BrowserRouter>
        );

        // Should see "Strategy Initiative 1" (Discovery)
        expect(screen.getByText('Strategy Initiative 1')).toBeInTheDocument();

        // Should NOT see "Eng Task 1" directly in initial view if it filters by Discovery?
        // Checking existing implementation logic: ProductBacklog usually shows tasks in Discovery/Refinement/ReadyForEng
        // Let's verify filtering logic in component or just general render
    });

    it('opens new initiative dialog', () => {
        render(
            <BrowserRouter>
                <ProductBacklog />
            </BrowserRouter>
        );

        const newButton = screen.getByText('New Initiative');
        fireEvent.click(newButton);

        expect(screen.getByText('Initiative Form Dialog')).toBeInTheDocument();
    });
});
