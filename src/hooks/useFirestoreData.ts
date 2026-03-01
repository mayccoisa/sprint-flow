import { useState, useEffect } from 'react';
import {
    collection,
    query,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    addDoc,
    updateDoc,
    where,
    getDocs,
    writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
    Workspace, Squad, TeamMember, Task, Sprint, SprintTask,
    TaskAssignment, ModuleMetric, ProductModule,
    ProductService, ProductFeature, ServiceDependency,
    UserProfile, UserRole, FeaturePermission, ProductDocument
} from '@/types';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface FirestoreData {
    workspaces: Workspace[];
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
    documents: ProductDocument[];
}

const initialData: FirestoreData = {
    workspaces: [],
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
    users: [],
    documents: []
}

export const useFirestoreData = () => {
    const [data, setData] = useState<FirestoreData>(initialData);
    const [loading, setLoading] = useState(true);
    const { currentWorkspaceId, setCurrentWorkspaceId } = useWorkspace();

    // Generic subscription helper
    const subscribeToCollection = (collectionName: string, stateKey: keyof FirestoreData, filterByWorkspace: boolean = true) => {
        let q = query(collection(db, collectionName));

        if (filterByWorkspace && currentWorkspaceId) {
            q = query(collection(db, collectionName), where('workspace_id', '==', currentWorkspaceId));
        } else if (filterByWorkspace && !currentWorkspaceId) {
            // If it should be filtered but no workspace is selected, we don't fetch or we fetch nothing
            // For now, let's fetch where workspace_id is some impossible value to return empty
            q = query(collection(db, collectionName), where('workspace_id', '==', 'NONE'));
        }

        return onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: Number(doc.id) || doc.id, ...doc.data() }));
            setData(prev => ({ ...prev, [stateKey]: items }));
        }, (error) => {
            console.error(`Error subscribing to ${collectionName}:`, error);
        });
    };

    // Migration and fetching logic
    useEffect(() => {
        // First we subscribe to workspaces and users (global)
        const unsubs = [
            subscribeToCollection('workspaces', 'workspaces', false),
            subscribeToCollection('users', 'users', false),
        ];

        return () => unsubs.forEach(unsub => unsub());
    }, []);

    // Subscriptions for workspace-specific data
    useEffect(() => {
        if (!currentWorkspaceId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubs = [
            subscribeToCollection('squads', 'squads', true),
            subscribeToCollection('members', 'members', true),
            subscribeToCollection('tasks', 'tasks', true),
            subscribeToCollection('sprints', 'sprints', true),
            subscribeToCollection('sprint_tasks', 'sprintTasks', true),
            subscribeToCollection('task_assignments', 'taskAssignments', true),
            subscribeToCollection('product_modules', 'productModules', true),
            subscribeToCollection('module_metrics', 'moduleMetrics', true),
            subscribeToCollection('product_services', 'productServices', true),
            subscribeToCollection('product_features', 'productFeatures', true),
            subscribeToCollection('service_dependencies', 'serviceDependencies', true),
            subscribeToCollection('documents', 'documents', true),
        ];

        setLoading(false);
        return () => unsubs.forEach(unsub => unsub());
    }, [currentWorkspaceId]);

    // Migration logic
    useEffect(() => {
        const checkAndMigrate = async () => {
            // Check if workspaces exist at all
            const wsSnap = await getDocs(collection(db, 'workspaces'));
            let defaultWsId = currentWorkspaceId;

            if (wsSnap.empty) {
                // No workspaces exist, create a default one
                defaultWsId = `ws_${Date.now()}`;
                await setDoc(doc(db, 'workspaces', defaultWsId), {
                    id: defaultWsId,
                    name: 'Meu Workspace',
                    created_at: new Date().toISOString(),
                    owner_id: 'system'
                });
                setCurrentWorkspaceId(defaultWsId);
            } else if (!currentWorkspaceId) {
                // If workspaces exist but none selected, select the first one
                setCurrentWorkspaceId(wsSnap.docs[0].id);
                defaultWsId = wsSnap.docs[0].id;
            }

            // Perform migration on old data that lacks workspace_id
            if (defaultWsId) {
                const collectionsToMigrate = [
                    'squads', 'members', 'tasks', 'sprints', 'sprint_tasks',
                    'task_assignments', 'product_modules', 'module_metrics',
                    'product_services', 'product_features', 'service_dependencies', 'documents'
                ];

                for (const colName of collectionsToMigrate) {
                    const snap = await getDocs(collection(db, colName));
                    const batch = writeBatch(db);
                    let migratedCount = 0;

                    snap.docs.forEach(d => {
                        const dat = d.data();
                        if (!dat.workspace_id) {
                            batch.update(d.ref, { workspace_id: defaultWsId });
                            migratedCount++;
                        }
                    });

                    if (migratedCount > 0) {
                        console.log(`Migrated ${migratedCount} items in ${colName}`);
                        await batch.commit();
                    }
                }
            }
        };

        checkAndMigrate();
    }, []); // Run only once on mount

    // Helper Generic Actions
    const addItem = async (collectionName: string, item: any) => {
        const id = item.id ? String(item.id) : String(Date.now());
        const docRef = doc(db, collectionName, id);

        // Inject workspace_id automatically except for users and workspaces
        const payload = { ...item, id: Number(id) || id };
        if (collectionName !== 'users' && collectionName !== 'workspaces') {
            payload.workspace_id = currentWorkspaceId;
        }

        await setDoc(docRef, payload);
        return payload;
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

        // Workspaces
        addWorkspace: (workspace: Omit<Workspace, 'id' | 'created_at'>) => {
            const id = `ws_${Date.now()}`;
            return addItem('workspaces', { ...workspace, id, created_at: new Date().toISOString() });
        },
        updateWorkspace: (id: string, updates: Partial<Workspace>) => updateItem('workspaces', id, updates),
        deleteWorkspace: (id: string) => deleteItem('workspaces', id),

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

        // User Management (Admin)
        updateUser: (id: string, updates: Partial<UserProfile>) => updateItem('users', id, updates),
        deleteUser: (id: string) => deleteItem('users', id),
        updateUserRole: (id: string, role: UserRole) => updateItem('users', id, { role }),
        updateUserPermissions: (id: string, permissions: FeaturePermission) => updateItem('users', id, { permissions }),
        inviteUser: async (email: string, role: UserRole, permissions: FeaturePermission, name?: string) => {
            const inviteId = `invite_${Date.now()}`;
            const docRef = doc(db, 'users', inviteId);

            const pendingProfile: UserProfile = {
                id: inviteId,
                email: email.toLowerCase(),
                role,
                permissions,
                name: name || 'Pending Invite',
                created_at: new Date().toISOString()
            };

            await setDoc(docRef, pendingProfile);
            return pendingProfile;
        },

        // Documentation Hub
        addDocument: (docData: Omit<ProductDocument, 'id' | 'created_at' | 'updated_at'>) =>
            addItem('documents', { ...docData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
        updateDocument: (id: number, updates: Partial<ProductDocument>) =>
            updateItem('documents', id, { ...updates, updated_at: new Date().toISOString() }),
        deleteDocument: (id: number) => deleteItem('documents', id),
    };
};

