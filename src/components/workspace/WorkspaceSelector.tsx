import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useFirestoreData } from '@/hooks/useFirestoreData';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { WorkspaceDialog } from './WorkspaceDialog'; // We will create this

export function WorkspaceSelector() {
    const { t } = useTranslation();
    const { currentWorkspaceId, setCurrentWorkspaceId } = useWorkspace();
    const { data } = useFirestoreData();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

    const currentWorkspace = data.workspaces.find((w) => w.id === currentWorkspaceId);

    const handleOpenCreate = () => {
        setDialogMode('create');
        setDialogOpen(true);
    };

    const handleOpenEdit = () => {
        if (!currentWorkspace) return;
        setDialogMode('edit');
        setDialogOpen(true);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between mt-2 mb-4 bg-background/50 border-input hover:bg-accent hover:text-accent-foreground"
                    >
                        <div className="flex flex-col items-start overflow-hidden text-left w-[180px]">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">
                                {t('workspace.current', 'Workspace')}
                            </span>
                            <span className="truncate font-medium text-sm w-full block">
                                {currentWorkspace?.name || t('workspace.select', 'Select Workspace')}
                            </span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[220px]" align="start">
                    <DropdownMenuLabel>{t('workspace.switch', 'Switch Workspace')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {data.workspaces.map((ws) => (
                        <DropdownMenuItem
                            key={ws.id}
                            onClick={() => setCurrentWorkspaceId(ws.id)}
                            className="flex justify-between items-center cursor-pointer"
                        >
                            <span className="truncate">{ws.name}</span>
                            {currentWorkspaceId === ws.id && <Check className="h-4 w-4" />}
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleOpenCreate} className="cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" />
                        <span>{t('workspace.new', 'New Workspace')}</span>
                    </DropdownMenuItem>
                    {currentWorkspace && (
                        <DropdownMenuItem onClick={handleOpenEdit} className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>{t('workspace.rename', 'Rename Workspace')}</span>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <WorkspaceDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                mode={dialogMode}
                workspace={currentWorkspace}
            />
        </>
    );
}
