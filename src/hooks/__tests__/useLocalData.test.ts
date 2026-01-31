import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocalData } from '../useLocalData';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as firestore from 'firebase/firestore';

describe('useLocalData (via Firestore)', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock onSnapshot to return empty data initially or simulate loading
        (firestore.onSnapshot as any).mockImplementation((query: any, callback: any) => {
            // Simulate immediate callback with empty data for all collections
            callback({ docs: [] });
            return vi.fn(); // unsubscribe function
        });
    });

    it('should initialize and subscribe to collections', async () => {
        renderHook(() => useLocalData());

        // Expect onSnapshot to be called for each collection
        expect(firestore.onSnapshot).toHaveBeenCalledTimes(11); // 11 collections in useFirestoreData
    });

    it('should add a task by calling setDoc', async () => {
        const { result } = renderHook(() => useLocalData());

        const newTask = {
            title: 'New Initiative',
            description: 'Description',
            task_type: 'Feature' as const,
            priority: 'High' as const,
            status: 'Discovery' as const,
            order_index: 0,
            estimate_frontend: null,
            estimate_backend: null,
            estimate_qa: null,
            estimate_design: null,
            start_date: null,
            end_date: null,
            product_objective: 'Obj',
            business_goal: 'Goal',
            user_impact: 'Impact',
            has_prototype: false,
            prototype_link: null,
            area_id: null,
            feature_id: 1,
        };

        await act(async () => {
            const task = await result.current.addTask(newTask);
        });

        expect(firestore.setDoc).toHaveBeenCalled();
        // Check if doc was called with correct collection 'tasks'
        // doc(db, 'tasks', ...)
        expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'tasks', expect.any(String));
    });

    it('should delete a task by calling deleteDoc', async () => {
        const { result } = renderHook(() => useLocalData());

        await act(async () => {
            await result.current.deleteTask(123);
        });

        expect(firestore.deleteDoc).toHaveBeenCalled();
        expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'tasks', "123");
    });
});
