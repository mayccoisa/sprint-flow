import { useState, useEffect } from 'react';
import {
    collection,
    query,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    addDoc,
    updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
    Squad, TeamMember, Task, Sprint, SprintTask,
    TaskAssignment, ModuleMetric, ProductModule,
    ProductService, ProductFeature, ServiceDependency,
    UserProfile, UserRole, FeaturePermission
} from '@/types';
// Reuse existing types, but we handle them in Firestore collections

interface FirestoreData {
    squads: Squad[];
    members: TeamMember[];
    tasks: Task[];
    sprints: Sprint[];
    sprintTasks: SprintTask[];
    taskAssignments: TaskAssignment[];
    productModules: ProductModule[];
    moduleMetrics: ModuleMetric[];
    productServices: ProductService[];
    productFeatures: ProductFeature[];
    serviceDependencies: ServiceDependency[];
    users: UserProfile[];
}

const initialData: FirestoreData = {
    squads: [],
    members: [],
    tasks: [],
    sprints: [],
    sprintTasks: [],
    taskAssignments: [],
    productModules: [],
    moduleMetrics: [],
    productServices: [],
    productFeatures: [],
    serviceDependencies: [],
    users: []
};


export const useFirestoreData = () => {
    const [data, setData] = useState<FirestoreData>(initialData);
    const [loading, setLoading] = useState(true);

    // Generic subscription helper
    const subscribeToCollection = (collectionName: string, stateKey: keyof FirestoreData) => {
        const q = query(collection(db, collectionName));
        return onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: Number(doc.id) || doc.id, ...doc.data() }));
            setData(prev => ({ ...prev, [stateKey]: items }));
        }, (error) => {
            console.error(`Error subscribing to ${collectionName}:`, error);
        });
    };

    useEffect(() => {
        const unsubs = [
            subscribeToCollection('squads', 'squads'),
            subscribeToCollection('members', 'members'),
            subscribeToCollection('tasks', 'tasks'),
            subscribeToCollection('sprints', 'sprints'),
            subscribeToCollection('sprint_tasks', 'sprintTasks'),
            subscribeToCollection('task_assignments', 'taskAssignments'),
            subscribeToCollection('product_modules', 'productModules'),
            subscribeToCollection('module_metrics', 'moduleMetrics'),
            subscribeToCollection('product_services', 'productServices'),
            subscribeToCollection('product_features', 'productFeatures'),
            subscribeToCollection('service_dependencies', 'serviceDependencies'),
            subscribeToCollection('users', 'users'),
        ];

        setLoading(false);

        return () => unsubs.forEach(unsub => unsub());
    }, []);

    // Helper Generic Actions
    const addItem = async (collectionName: string, item: any) => {
        // Use ID if provided, otherwise generic auto-id (converted to string for firestore doc)
        const id = item.id ? String(item.id) : String(Date.now());
        const docRef = doc(db, collectionName, id);
        await setDoc(docRef, { ...item, id: Number(id) }); // Keep ID as number in data if types require it
        return { ...item, id: Number(id) };
    };

    const updateItem = async (collectionName: string, id: number | string, updates: any) => {
        const docRef = doc(db, collectionName, String(id));
        await updateDoc(docRef, updates);
    };

    const deleteItem = async (collectionName: string, id: number | string) => {
        const docRef = doc(db, collectionName, String(id));
        await deleteDoc(docRef);
    };

    // Exposed Actions Matching useLocalData interface
    return {
        data,
        loading,
        // Tasks
        addTask: (task: Omit<Task, 'id' | 'created_at'>) => addItem('tasks', { ...task, created_at: new Date().toISOString() }),
        updateTask: (id: number, updates: Partial<Task>) => updateItem('tasks', id, updates),
        deleteTask: (id: number) => deleteItem('tasks', id),

        // Sprints
        addSprint: (sprint: Omit<Sprint, 'id' | 'created_at'>) => addItem('sprints', { ...sprint, created_at: new Date().toISOString() }),
        updateSprint: (id: number, updates: Partial<Sprint>) => updateItem('sprints', id, updates),
        deleteSprint: (id: number) => deleteItem('sprints', id),

        // Sprint Tasks
        addSprintTask: (st: Omit<SprintTask, 'id' | 'created_at'>) => addItem('sprint_tasks', { ...st, created_at: new Date().toISOString() }),
        removeSprintTask: async (sprintId: number, taskId: number) => {
            // Complex delete: find doc by sprint_id and task_id then delete
            // For now, naive implementation: iterate local data to find ID (optimistic)
            const item = data.sprintTasks.find(st => st.sprint_id === sprintId && st.task_id === taskId);
            if (item) await deleteItem('sprint_tasks', item.id);
        },

        // Squads & Members
        addSquad: (squad: Omit<Squad, 'id' | 'created_at'>) => addItem('squads', { ...squad, created_at: new Date().toISOString() }),
        updateSquad: (id: number, updates: Partial<Squad>) => updateItem('squads', id, updates),
        deleteSquad: (id: number) => deleteItem('squads', id),

        addMember: (member: Omit<TeamMember, 'id' | 'created_at'>) => addItem('members', { ...member, created_at: new Date().toISOString() }),
        updateMember: (id: number, updates: Partial<TeamMember>) => updateItem('members', id, updates),
        deleteMember: (id: number) => deleteItem('members', id),

        // Product Strategy
        addProductModule: (item: Omit<ProductModule, 'id'>) => addItem('product_modules', item),
        deleteProductModule: (id: number) => deleteItem('product_modules', id),

        addProductFeature: (item: Omit<ProductFeature, 'id'>) => addItem('product_features', item),
        deleteProductFeature: (id: number) => deleteItem('product_features', id),

        addProductService: (item: Omit<ProductService, 'id'>) => addItem('product_services', item),
        deleteProductService: (id: number) => deleteItem('product_services', id),

        addServiceDependency: (item: Omit<ServiceDependency, 'id'>) => addItem('service_dependencies', item),
        // Missing deleteDependency in local hook, skipping for now

        // User Management (Admin)
        updateUserRole: (id: string, role: UserRole) => updateItem('users', id, { role }),
        updateUserPermissions: (id: string, permissions: FeaturePermission) => updateItem('users', id, { permissions }),
        inviteUser: async (email: string, role: UserRole, permissions: FeaturePermission) => {
            // Generate a random ID for the pending invite
            const inviteId = `invite_${Date.now()}`;
            const docRef = doc(db, 'users', inviteId);

            const pendingProfile: UserProfile = {
                id: inviteId,
                email: email.toLowerCase(),
                role,
                permissions,
                name: 'Pending Invite', // Placeholder name
                created_at: new Date().toISOString()
            };

            await setDoc(docRef, pendingProfile);
            return pendingProfile;
        },
    };
};
