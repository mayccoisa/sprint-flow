import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InitiativesOverview from '../InitiativesOverview';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Mock translations
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultValue?: string) => defaultValue || key,
    }),
}));

// Mock Toaster
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

// Mock Layout to avoid router/context issues if any
vi.mock('@/components/Layout', () => ({
    Layout: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}));

// Mock Components that open dialogs
vi.mock('@/components/InitiativeTypeSelectionDialog', () => ({
    InitiativeTypeSelectionDialog: ({ open }: { open: boolean }) => open ? <div>Type Selection Dialog</div> : null,
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
        title: 'Project Alpha',
        status: 'Discovery',
        created_at: '2023-01-01',
        task_type: 'Feature',
        priority: 'High',
        product_objective: 'Obj 1'
    },
    {
        id: 2,
        title: 'Fix Bug X',
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

describe('InitiativesOverview', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders list of initiatives', () => {
        render(
            <BrowserRouter>
                <InitiativesOverview />
            </BrowserRouter>
        );

        expect(screen.getByText('All Initiatives')).toBeInTheDocument();
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
        expect(screen.getByText('Fix Bug X')).toBeInTheDocument();
    });

    it('filters initiatives by search query', async () => {
        render(
            <BrowserRouter>
                <InitiativesOverview />
            </BrowserRouter>
        );

        const filterInput = screen.getByPlaceholderText('Filter initiatives...');
        fireEvent.change(filterInput, { target: { value: 'Alpha' } });

        await waitFor(() => {
            expect(screen.getByText('Project Alpha')).toBeInTheDocument();
            expect(screen.queryByText('Fix Bug X')).not.toBeInTheDocument();
        });
    });

    it('opens type selection dialog on click new', () => {
        render(
            <BrowserRouter>
                <InitiativesOverview />
            </BrowserRouter>
        );

        const newButton = screen.getByText('New Initiative');
        fireEvent.click(newButton);

        expect(screen.getByText('Type Selection Dialog')).toBeInTheDocument();
    });
});
