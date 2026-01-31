import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InitiativeFormDialog } from '../InitiativeFormDialog';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock translations
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            if (key === 'initiativeForm.newTitle') return 'New Initiative';
            if (key === 'initiativeForm.tabs.general') return 'General';
            if (key === 'initiativeForm.tabs.details') return 'Details';
            if (key === 'common.save') return 'Save';
            return key;
        },
    }),
}));

// Mock useLocalData
const mockProductModules = [{ id: 1, name: 'Module A' }];
const mockProductFeatures = [{ id: 101, module_id: 1, name: 'Feature X' }];

vi.mock('@/hooks/useLocalData', () => ({
    useLocalData: () => ({
        data: {
            productModules: mockProductModules,
            productFeatures: mockProductFeatures
        }
    })
}));

describe('InitiativeFormDialog', () => {
    const defaultProps = {
        open: true,
        onClose: vi.fn(),
        onSave: vi.fn(),
        task: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly when open', () => {
        render(<InitiativeFormDialog {...defaultProps} />);
        expect(screen.getByText('New Initiative')).toBeInTheDocument();
        expect(screen.getByText('General')).toBeInTheDocument();
        expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        render(<InitiativeFormDialog {...defaultProps} />);

        const saveButton = screen.getByText('initiativeForm.save');
        fireEvent.click(saveButton);

        await waitFor(() => {
            // Check for validation error messages (keys)
            // Since we mocked t() to return key for unknown keys, we look for keys or generic validation messages if Zod uses defaults?
            // Zod schema uses t('validation.required')
            // So we expect 'validation.required' to appear multiple times
            const errors = screen.getAllByText('validation.required');
            expect(errors.length).toBeGreaterThan(0);
        });

        expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    // TODO: Add more complex interaction tests like filling form and submitting
    // Testing complex forms with Shadcn UI (Radix) select/tabs requires user-event and careful querying
});
