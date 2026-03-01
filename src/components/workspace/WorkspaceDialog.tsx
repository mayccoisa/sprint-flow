import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { useFirestoreData } from "@/hooks/useFirestoreData";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Workspace } from "@/types";
import { toast } from "sonner";

interface WorkspaceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    workspace?: Workspace;
}

export function WorkspaceDialog({ open, onOpenChange, mode, workspace }: WorkspaceDialogProps) {
    const { t } = useTranslation();
    const { addWorkspace, updateWorkspace } = useFirestoreData();
    const { setCurrentWorkspaceId } = useWorkspace();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setName(mode === 'edit' && workspace ? workspace.name : "");
        }
    }, [open, mode, workspace]);

    const handleSave = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            if (mode === 'create') {
                const newWs = await addWorkspace({ name: name.trim(), owner_id: 'current_user' });
                if (newWs && newWs.id) setCurrentWorkspaceId(newWs.id);
                toast.success(t("common.created"));
            } else if (mode === 'edit' && workspace) {
                await updateWorkspace(workspace.id, { name: name.trim() });
                toast.success(t("workspace.renamed"));
            }
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Error saving workspace");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? t("workspace.create") : t("workspace.rename")}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'create'
                            ? "Create a new workspace to manage a different product or area."
                            : "Rename the current workspace."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            {t("workspace.name")}
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t("workspace.namePlaceholder")}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        {t("common.cancel")}
                    </Button>
                    <Button onClick={handleSave} disabled={!name.trim() || loading}>
                        {t("common.save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
