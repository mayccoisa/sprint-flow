import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Task } from "@/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TaskDateChangeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: Task | null;
    newEndDate: string | null;
    onConfirm: (reason: string) => Promise<void>;
}

export function TaskDateChangeDialog({ open, onOpenChange, task, newEndDate, onConfirm }: TaskDateChangeDialogProps) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!reason.trim()) {
            toast.error("Por favor, informe o motivo da alteração.");
            return;
        }

        setLoading(true);
        try {
            await onConfirm(reason.trim());
            setReason("");
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar alteração.");
        } finally {
            setLoading(false);
        }
    };

    if (!task) return null;

    const oldDateStr = task.end_date ? format(new Date(task.end_date), "dd/MM/yyyy", { locale: ptBR }) : "Não definida";
    const newDateStr = newEndDate ? format(new Date(newEndDate), "dd/MM/yyyy", { locale: ptBR }) : "Não definida";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Alteração de Prazo</DialogTitle>
                    <DialogDescription>
                        Você está alterando o prazo da tarefa <strong>{task.title}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="text-sm space-y-2">
                        <p><strong>Prazo atual:</strong> {oldDateStr}</p>
                        <p><strong>Novo prazo:</strong> {newDateStr}</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="reason">Motivo da alteração</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Descreva o motivo pelo qual o prazo está sendo alterado..."
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={!reason.trim() || loading}>
                        {loading ? "Salvando..." : "Confirmar Alteração"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
