import { useState } from 'react';
import { Building2, Check, ChevronsUpDown, Plus, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useFirestoreData } from '@/hooks/useFirestoreData';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { WorkspaceDialog } from './WorkspaceDialog';

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
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-label={t('workspace.switch', 'Switch Workspace')}
                                className="mb-4 mt-2 h-auto w-full justify-between bg-background/50 px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                        <Building2 className="h-4 w-4" />
                                    </span>
                                    <div className="flex min-w-0 flex-col overflow-hidden">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            {t('workspace.current', 'Workspace')}
                                        </span>
                                        <span className="block w-full truncate text-sm font-medium">
                                            {currentWorkspace?.name || t('workspace.select', 'Select Workspace')}
                                        </span>
                                    </div>
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right">{t('workspace.switch', 'Switch Workspace')}</TooltipContent>
                </Tooltip>
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
