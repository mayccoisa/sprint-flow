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
import { sendSignInLinkToEmail } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type {
    Workspace, Squad, TeamMember, Task, Sprint, SprintTask,
    TaskAssignment, ModuleMetric, ProductModule,
    ProductService, ProductFeature, ServiceDependency,
    UserProfile, UserRole, FeaturePermission, ProductDocument,
    CustomForm, FormSubmission, JiraSyncLog, JiraConfig, TaskDateChange,
    Release, ReleaseTask, SprintParticipant, Role, TaskAuditLog, TaskAuditChange
} from '@/types';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { jiraService } from '@/services/jiraService';
import { toast } from '@/hooks/use-toast';

interface FirestoreData {
    workspaces: Workspace[];
    squads: Squad[];
    members: TeamMember[];
    tasks: Task[];
    sprints: Sprint[];
    sprintTasks: SprintTask[];
    sprintParticipants: SprintParticipant[];
    taskAssignments: TaskAssignment[];
    productModules: ProductModule[];
    moduleMetrics: ModuleMetric[];
    productServices: ProductService[];
    productFeatures: ProductFeature[];
    serviceDependencies: ServiceDependency[];
    users: UserProfile[];
    roles: Role[];
    documents: ProductDocument[];
    taskAuditLogs: TaskAuditLog[];
    forms: CustomForm[];
    formSubmissions: FormSubmission[];
    jiraSyncLogs: JiraSyncLog[];
    taskDateChanges: TaskDateChange[];
    releases: Release[];
    releaseTasks: ReleaseTask[];
}

const initialData: FirestoreData = {
    workspaces: [],
    squads: [],
    members: [],
    tasks: [],
    sprints: [],
    sprintTasks: [],
    sprintParticipants: [],
    taskAssignments: [],
    productModules: [],
    moduleMetrics: [],
    productServices: [],
    productFeatures: [],
    serviceDependencies: [],
    users: [],
    roles: [],
    documents: [],
    taskAuditLogs: [],
    forms: [],
    formSubmissions: [],
    jiraSyncLogs: [],
    taskDateChanges: [],
    releases: [],
    releaseTasks: []
}

export const useFirestoreData = () => {
    const [data, setData] = useState<FirestoreData>(initialData);
    const [loading, setLoading] = useState(true);
    const { currentWorkspaceId, setCurrentWorkspaceId } = useWorkspace();
    const { userProfile } = useAuth();

    // Fields excluded from audit log (computed/system fields).
    const AUDIT_IGNORED_FIELDS = new Set([
        'id', 'created_at', 'workspace_id', 'order_index', 'jira_key',
    ]);

    const writeTaskAuditLog = async (
        taskId: number,
        action: TaskAuditLog['action'],
        changes: TaskAuditChange[],
        summary?: string | null,
    ) => {
        if (!currentWorkspaceId) return;
        const id = `tal_${taskId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const log: TaskAuditLog = {
            id,
            workspace_id: currentWorkspaceId,
            task_id: taskId,
            action,
            changed_at: new Date().toISOString(),
            changed_by_id: userProfile?.id ?? null,
            changed_by_name: userProfile?.name ?? userProfile?.email ?? null,
            changes,
            summary: summary ?? null,
        };
        try {
            await setDoc(doc(db, 'task_audit_logs', id), log);
        } catch (err) {
            console.error('Failed to write audit log:', err);
        }
    };

    const diffTask = (before: any, after: any): TaskAuditChange[] => {
        const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
        const changes: TaskAuditChange[] = [];
        keys.forEach((k) => {
            if (AUDIT_IGNORED_FIELDS.has(k)) return;
            const a = before?.[k];
            const b = after?.[k];
            const aJson = JSON.stringify(a ?? null);
            const bJson = JSON.stringify(b ?? null);
            if (aJson !== bJson) changes.push({ field: k, old: a ?? null, new: b ?? null });
        });
        return changes;
    };

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
            subscribeToCollection('sprint_participants', 'sprintParticipants', true),
            subscribeToCollection('task_assignments', 'taskAssignments', true),
            subscribeToCollection('product_modules', 'productModules', true),
            subscribeToCollection('module_metrics', 'moduleMetrics', true),
            subscribeToCollection('product_services', 'productServices', true),
            subscribeToCollection('product_features', 'productFeatures', true),
            subscribeToCollection('service_dependencies', 'serviceDependencies', true),
            subscribeToCollection('documents', 'documents', true),
            subscribeToCollection('forms', 'forms', true),
            subscribeToCollection('form_submissions', 'formSubmissions', true),
            subscribeToCollection('jira_sync_logs', 'jiraSyncLogs', true),
            subscribeToCollection('task_date_changes', 'taskDateChanges', true),
            subscribeToCollection('releases', 'releases', true),
            subscribeToCollection('release_tasks', 'releaseTasks', true),
            subscribeToCollection('roles', 'roles', true),
            subscribeToCollection('task_audit_logs', 'taskAuditLogs', true),
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
                    'product_services', 'product_features', 'service_dependencies', 'documents',
                    'forms', 'form_submissions', 'jira_sync_logs', 'task_date_changes'
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

                // Seed system roles ("Admin", "Membro") if absent in this workspace.
                const rolesSnap = await getDocs(query(collection(db, 'roles'), where('workspace_id', '==', defaultWsId)));
                const hasAdmin = rolesSnap.docs.some(d => d.id === `role_admin_${defaultWsId}` || d.data().name === 'Admin');
                const hasMember = rolesSnap.docs.some(d => d.id === `role_member_${defaultWsId}` || d.data().name === 'Membro');
                const allActions = ['view', 'create', 'edit', 'delete'];
                const fullPerms = {
                    squads: allActions, initiatives: allActions, backlog: allActions,
                    strategy: allActions, sprints: allActions, releases: allActions,
                    documents: allActions, users: allActions, forms: allActions,
                };
                const memberPerms = {
                    squads: ['view'], initiatives: ['view'], backlog: ['view'],
                    strategy: ['view'], sprints: ['view'], releases: ['view'], documents: ['view'],
                    forms: [],
                };
                if (!hasAdmin) {
                    const id = `role_admin_${defaultWsId}`;
                    await setDoc(doc(db, 'roles', id), {
                        id, workspace_id: defaultWsId, name: 'Admin',
                        description: 'Acesso total ao workspace.', is_system: true, is_active: true,
                        permissions: fullPerms, created_at: new Date().toISOString(),
                    });
                }
                if (!hasMember) {
                    const id = `role_member_${defaultWsId}`;
                    await setDoc(doc(db, 'roles', id), {
                        id, workspace_id: defaultWsId, name: 'Membro',
                        description: 'Acesso de leitura padrão.', is_system: true, is_active: true,
                        permissions: memberPerms, created_at: new Date().toISOString(),
                    });
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
        updateJiraConfig: (config: JiraConfig) => {
            if (!currentWorkspaceId) return;
            return updateItem('workspaces', currentWorkspaceId, { jira_config: config });
        },

        // Tasks
        addTask: async (task: Omit<Task, 'id' | 'created_at'>) => {
            const workspace = data.workspaces.find(ws => ws.id === currentWorkspaceId);
            let jiraKey = null;

            if (workspace?.jira_config?.isEnabled) {
                try {
                    const jiraIssue = await jiraService.createIssue(task as Task, workspace.jira_config);
                    jiraKey = jiraIssue.key;
                } catch (e) {
                    console.error("Failed to create Jira issue", e);
                }
            }

            const newTask = await addItem('tasks', { 
                ...task, 
                created_at: new Date().toISOString(),
                jira_key: jiraKey 
            });

            if (jiraKey) {
                addItem('jira_sync_logs', {
                    timestamp: new Date().toISOString(),
                    jira_key: jiraKey,
                    task_title: task.title,
                    action: 'Created',
                    details: 'Tarefa criada no Sprintflow e espalhada para o Jira.',
                    status: 'Success'
                });
            }

            // Audit: creation event with the full payload as "new" values.
            const initialChanges = diffTask({}, newTask);
            await writeTaskAuditLog(newTask.id, 'create', initialChanges, `Iniciativa "${task.title}" criada`);

            return newTask;
        },
        updateTask: async (id: number, updates: Partial<Task>) => {
            const task = data.tasks.find(t => t.id === id);
            const workspace = data.workspaces.find(ws => ws.id === currentWorkspaceId);

            await updateItem('tasks', id, updates);

            // Audit: compute diff between previous task state and the patch.
            if (task) {
                const after = { ...task, ...updates };
                const changes = diffTask(task, after);
                if (changes.length > 0) {
                    const isStatusChange = changes.some((c) => c.field === 'status');
                    await writeTaskAuditLog(
                        id,
                        isStatusChange && changes.length === 1 ? 'status_change' : 'update',
                        changes,
                    );
                }
            }

            if (task?.jira_key && workspace?.jira_config?.isEnabled && updates.status) {
                try {
                    await jiraService.updateStatus(task.jira_key, updates.status, workspace.jira_config);
                    addItem('jira_sync_logs', {
                        timestamp: new Date().toISOString(),
                        jira_key: task.jira_key,
                        task_title: task.title,
                        action: 'StatusSync',
                        details: `Status atualizado para ${updates.status} no Jira.`,
                        status: 'Success'
                    });
                } catch (e: any) {
                    addItem('jira_sync_logs', {
                        timestamp: new Date().toISOString(),
                        jira_key: task.jira_key,
                        task_title: task.title,
                        action: 'StatusSync',
                        details: `Falha ao sincronizar status: ${e.message}`,
                        status: 'Error'
                    });
                }
            }
        },
        deleteTask: async (id: number) => {
            const task = data.tasks.find(t => t.id === id);
            await deleteItem('tasks', id);
            await writeTaskAuditLog(id, 'delete', [], task ? `Iniciativa "${task.title}" excluída` : 'Iniciativa excluída');
        },

        // Sprints
        addSprint: (sprint: Omit<Sprint, 'id' | 'created_at'>) => addItem('sprints', { ...sprint, created_at: new Date().toISOString() }),
        updateSprint: (id: number, updates: Partial<Sprint>) => updateItem('sprints', id, updates),
        deleteSprint: (id: number) => deleteItem('sprints', id),

        // Sprint Tasks
        addSprintTask: (st: Omit<SprintTask, 'id' | 'created_at'>) => addItem('sprint_tasks', { ...st, created_at: new Date().toISOString() }),
        updateSprintTask: (id: number | string, updates: Partial<SprintTask>) => updateItem('sprint_tasks', id, updates),
        removeSprintTask: async (sprintId: number, taskId: number) => {
            const item = data.sprintTasks.find(st => st.sprint_id === sprintId && st.task_id === taskId);
            if (item) await deleteItem('sprint_tasks', item.id);
        },

        // Sprint Participants (per-sprint roster + availability)
        upsertSprintParticipant: async (sprintId: number, memberId: number, availabilityPct: number, notes?: string | null) => {
            const id = `sp_${sprintId}_${memberId}`;
            const existing = data.sprintParticipants.find(p => p.id === id);
            if (existing) {
                await updateItem('sprint_participants', id, { availability_pct: availabilityPct, notes: notes ?? null });
                return { ...existing, availability_pct: availabilityPct, notes: notes ?? null };
            }
            return await addItem('sprint_participants', {
                id,
                sprint_id: sprintId,
                member_id: memberId,
                availability_pct: availabilityPct,
                notes: notes ?? null,
                created_at: new Date().toISOString(),
            });
        },
        removeSprintParticipant: async (sprintId: number, memberId: number) => {
            const id = `sp_${sprintId}_${memberId}`;
            await deleteItem('sprint_participants', id);
        },
        seedSprintRoster: async (sprintId: number, memberIds: number[]) => {
            const existing = new Set(
                data.sprintParticipants
                    .filter(p => p.sprint_id === sprintId)
                    .map(p => p.member_id)
            );
            await Promise.all(
                memberIds
                    .filter(id => !existing.has(id))
                    .map(memberId => addItem('sprint_participants', {
                        id: `sp_${sprintId}_${memberId}`,
                        sprint_id: sprintId,
                        member_id: memberId,
                        availability_pct: 100,
                        notes: null,
                        created_at: new Date().toISOString(),
                    }))
            );
        },

        // Releases
        addRelease: (release: Omit<Release, 'id' | 'created_at'>) =>
            addItem('releases', { ...release, created_at: new Date().toISOString() }),
        updateRelease: (id: number | string, updates: Partial<Release>) => updateItem('releases', id, updates),
        deleteRelease: (id: number | string) => deleteItem('releases', id),
        addReleaseTask: (rt: Omit<ReleaseTask, 'id' | 'created_at'>) =>
            addItem('release_tasks', { ...rt, created_at: new Date().toISOString() }),
        deleteReleaseTask: (id: number | string) => deleteItem('release_tasks', id),
        removeReleaseTask: async (releaseId: number, taskId: number) => {
            const item = data.releaseTasks.find(rt => rt.release_id === releaseId && rt.task_id === taskId);
            if (item) await deleteItem('release_tasks', item.id);
        },

        // Squads & Members
        addSquad: (squad: Omit<Squad, 'id' | 'created_at'>) => addItem('squads', { ...squad, created_at: new Date().toISOString() }),
        updateSquad: (id: number, updates: Partial<Squad>) => updateItem('squads', id, updates),
        deleteSquad: (id: number) => deleteItem('squads', id),

        addMember: (member: Omit<TeamMember, 'id' | 'created_at'>) => addItem('members', { ...member, created_at: new Date().toISOString() }),
        addTaskAssignment: (assignment: Omit<TaskAssignment, 'id' | 'created_at'>) =>
            addItem('task_assignments', { ...assignment, created_at: new Date().toISOString() }),
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
        assignRoleToUser: (userId: string, roleId: string | null) =>
            updateItem('users', userId, { role_id: roleId }),

        // Roles (Cargos)
        addRole: async (role: Omit<Role, 'id' | 'created_at' | 'workspace_id'>) => {
            const id = `role_${Date.now()}`;
            const payload: Role = {
                ...role,
                id,
                workspace_id: currentWorkspaceId || '',
                is_active: role.is_active ?? true,
                created_at: new Date().toISOString(),
            };
            await setDoc(doc(db, 'roles', id), payload);
            return payload;
        },
        updateRole: (id: string, updates: Partial<Role>) => updateItem('roles', id, updates),
        deleteRole: async (id: string) => {
            const role = data.roles.find(r => r.id === id);
            if (role?.is_system) {
                throw new Error('Cargos do sistema não podem ser excluídos.');
            }
            const inUse = data.users.filter(u => u.role_id === id);
            if (inUse.length > 0) {
                throw new Error(`Cargo em uso por ${inUse.length} usuário(s). Atribua outro cargo antes de excluir.`);
            }
            await deleteItem('roles', id);
        },
        inviteUser: async (email: string, role: UserRole, permissions: FeaturePermission, name?: string) => {
            const normalizedEmail = email.toLowerCase();
            const inviteId = `invite_${Date.now()}`;
            const docRef = doc(db, 'users', inviteId);

            const pendingProfile: UserProfile = {
                id: inviteId,
                email: normalizedEmail,
                role,
                permissions,
                name: name || 'Pending Invite',
                created_at: new Date().toISOString()
            };

            await setDoc(docRef, pendingProfile);

            // Send Firebase Auth sign-in link (magic link). When the invitee
            // opens it, the AuthContext picks up this pending profile by email
            // and assigns role/permissions to the new auth user.
            const actionCodeSettings = {
                url: `${window.location.origin}/login?invite=1`,
                handleCodeInApp: true,
            };
            try {
                await sendSignInLinkToEmail(auth, normalizedEmail, actionCodeSettings);
            } catch (err) {
                // Roll back the pending invite so the admin can retry cleanly.
                await deleteDoc(docRef).catch(() => undefined);
                throw err;
            }

            return pendingProfile;
        },

        /**
         * Cria um usuário "rascunho" sem email (pré-cadastro).
         * Útil para importar solicitantes em massa: o admin entra depois,
         * preenche o email e dispara o convite via `sendInviteForUser`.
         */
        createDraftUser: async (name: string, roleId: string | null, baseRole: UserRole = 'Member') => {
            const id = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            const profile: UserProfile = {
                id,
                email: '',
                name: name.trim(),
                role: baseRole,
                role_id: roleId,
                permissions: {},
                created_at: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', id), profile);
            return profile;
        },

        /**
         * Envia o magic link para um usuário já cadastrado (rascunho ou
         * inativo). Falha se o email estiver vazio.
         */
        sendInviteForUser: async (userId: string) => {
            const user = data.users.find(u => u.id === userId);
            if (!user) throw new Error('Usuário não encontrado.');
            if (!user.email) throw new Error('Preencha o email antes de enviar o convite.');
            const actionCodeSettings = {
                url: `${window.location.origin}/login?invite=1`,
                handleCodeInApp: true,
            };
            await sendSignInLinkToEmail(auth, user.email.toLowerCase(), actionCodeSettings);
        },

        // Documentation Hub
        addDocument: (docData: Omit<ProductDocument, 'id' | 'created_at' | 'updated_at'>) =>
            addItem('documents', { ...docData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
        updateDocument: (id: number, updates: Partial<ProductDocument>) =>
            updateItem('documents', id, { ...updates, updated_at: new Date().toISOString() }),
        deleteDocument: (id: number) => deleteItem('documents', id),

        // Forms
        addForm: (formData: Omit<CustomForm, 'id' | 'created_at'>) =>
            addItem('forms', { ...formData, id: `form_${Date.now()}`, created_at: new Date().toISOString() }),
        updateForm: (id: string, updates: Partial<CustomForm>) =>
            updateItem('forms', id, updates),
        deleteForm: (id: string) => deleteItem('forms', id),

        addFormSubmission: (submissionData: Omit<FormSubmission, 'id' | 'created_at'>) =>
            addItem('form_submissions', { ...submissionData, id: `sub_${Date.now()}`, created_at: new Date().toISOString() }),

        addJiraSyncLog: (log: Omit<JiraSyncLog, 'id' | 'workspace_id'>) =>
            addItem('jira_sync_logs', { ...log, id: `log_${Date.now()}` }),

        // Jira Management
        updateWorkspaceJiraConfig: async (config: JiraConfig) => {
            const workspace = data.workspaces.find(ws => ws.id === currentWorkspaceId);
            if (workspace) {
                await updateItem('workspaces', workspace.id, { jira_config: config });
            }
        },
        syncWithJira: async () => {
            const workspace = data.workspaces.find(ws => ws.id === currentWorkspaceId);
            if (!workspace?.jira_config?.isEnabled) {
                toast({ title: 'Integração Jira não está habilitada', variant: 'destructive' });
                return;
            }

            try {
                const jiraUpdates = await jiraService.fetchUpdates(workspace.jira_config);
                const jiraIssues = jiraUpdates.issues || [];
                
                let updatedCount = 0;
                let importedCount = 0;

                for (const issue of jiraIssues) {
                    const jiraKey = issue.key;
                    const jiraStatus = issue.fields.status.name;
                    const jiraSummary = issue.fields.summary;
                    const jiraDesc = issue.fields.description?.content?.[0]?.content?.[0]?.text || "";
                    const projectKey = issue.fields.project.key;
                    const issueTypeName = issue.fields.issuetype.name;

                    // 1. Check if task already exists in Sprintflow
                    const existingTask = data.tasks.find(t => t.jira_key === jiraKey);

                    if (existingTask) {
                        // Update status if changed
                        if (jiraStatus !== existingTask.status) {
                            await updateItem('tasks', existingTask.id, { status: jiraStatus });
                            addItem('jira_sync_logs', {
                                timestamp: new Date().toISOString(),
                                jira_key: jiraKey,
                                task_title: existingTask.title,
                                action: 'InboundSync',
                                details: `Status sincronizado de Jira: ${jiraStatus}`,
                                status: 'Success'
                            });
                            updatedCount++;
                        }
                    } else {
                        // 2. Import as new task if not existing
                        // Determine area and initial status
                        const isProduct = projectKey === workspace.jira_config.productProjectKey || 
                                         workspace.jira_config.productIssueTypes.includes(issueTypeName);
                        
                        const area = isProduct ? 'Product' : 'Engineering';
                        const initialStatus = isProduct ? 'Discovery' : 'Backlog';

                        await addItem('tasks', {
                            title: jiraSummary,
                            description: jiraDesc,
                            status: jiraStatus || initialStatus, // Use Jira status if possible, or default
                            area,
                            jira_key: jiraKey,
                            created_at: new Date().toISOString(),
                            priority: 'Medium',
                            impact: 0,
                            confidence: 0,
                            ease: 0,
                            score: 0
                        });

                        addItem('jira_sync_logs', {
                            timestamp: new Date().toISOString(),
                            jira_key: jiraKey,
                            task_title: jiraSummary,
                            action: 'Imported',
                            details: `Nova tarefa importada do Jira (${area}).`,
                            status: 'Success'
                        });
                        importedCount++;
                    }
                }

                toast({ 
                    title: 'Sincronização concluída', 
                    description: `Status atualizados: ${updatedCount}. Novos itens importados: ${importedCount}.` 
                });
            } catch (error: any) {
                toast({ 
                    title: 'Falha na Sincronização', 
                    description: error.message,
                    variant: 'destructive' 
                });
            }
        },

        // Task Date Changes
        addTaskDateChange: (change: Omit<TaskDateChange, 'id' | 'changed_at'>) =>
            addItem('task_date_changes', { ...change, changed_at: new Date().toISOString(), id: `tdc_${Date.now()}` }),
    };
};

