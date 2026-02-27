import { render, screen } from '@testing-library/react';
import ProductStrategy from '../ProductStrategy';
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

// Mock Recharts to avoid canvas issues in jsdom
vi.mock('recharts', () => {
    const OriginalModule = vi.importActual('recharts');
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        BarChart: () => <div>BarChart</div>,
        Bar: () => null,
        XAxis: () => null,
        YAxis: () => null,
        CartesianGrid: () => null,
        Tooltip: () => null,
        Legend: () => null,
        PieChart: () => <div>PieChart</div>,
        Pie: () => null,
        Cell: () => null,
    };
});


// Mock useLocalData
const mockModules = [
    { id: 1, name: 'Checkout', area_id: 1, health_score: 95 },
    { id: 2, name: 'User Profile', area_id: 2, health_score: 80 }
];

vi.mock('@/hooks/useLocalData', () => ({
    useLocalData: () => ({
        data: {
            productModules: mockModules,
            moduleMetrics: [],
            tasks: []
        },
    })
}));

describe('ProductStrategy', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders strategy map modules', () => {
        render(
            <BrowserRouter>
                <ProductStrategy />
            </BrowserRouter>
        );

        expect(screen.getByText('Checkout')).toBeInTheDocument();
        expect(screen.getByText('User Profile')).toBeInTheDocument();
    });
});
