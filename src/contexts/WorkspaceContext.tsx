import React, { createContext, useContext, useState, useEffect } from 'react';

interface WorkspaceContextType {
    currentWorkspaceId: string | null;
    setCurrentWorkspaceId: (id: string | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(() => {
        // Try to get from localStorage on initial load
        const saved = localStorage.getItem('sprintflow_workspace_id');
        return saved || null;
    });

    useEffect(() => {
        if (currentWorkspaceId) {
            localStorage.setItem('sprintflow_workspace_id', currentWorkspaceId);
        } else {
            localStorage.removeItem('sprintflow_workspace_id');
        }
    }, [currentWorkspaceId]);

    return (
        <WorkspaceContext.Provider value={{ currentWorkspaceId, setCurrentWorkspaceId }}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
};
