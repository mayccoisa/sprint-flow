import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { useTranslation } from "react-i18next";
import { Globe, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const { t, i18n } = useTranslation();
    const { user, setAccountPassword } = useAuth();
    const { toast } = useToast();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [saving, setSaving] = useState(false);

    // Whether the account already has an email/password credential (vs. Google-only).
    const hasPassword = useMemo(
        () => !!user?.providerData.some((p) => p.providerId === "password"),
        [user]
    );

    const changeLanguage = (value: string) => {
        i18n.changeLanguage(value);
    };

    const handleSavePassword = async () => {
        if (password.length < 6) {
            toast({
                title: t("settings.pwdTooShortTitle") || "Senha muito curta",
                description: t("settings.pwdTooShortDesc") || "A senha precisa ter pelo menos 6 caracteres.",
                variant: "destructive",
            });
            return;
        }
        if (password !== confirmPassword) {
            toast({
                title: t("settings.pwdMismatchTitle") || "As senhas não conferem",
                description: t("settings.pwdMismatchDesc") || "Digite a mesma senha nos dois campos.",
                variant: "destructive",
            });
            return;
        }
        setSaving(true);
        try {
            const created = await setAccountPassword(password);
            setPassword("");
            setConfirmPassword("");
            toast({
                title: created
                    ? t("settings.pwdCreatedTitle") || "Senha criada"
                    : t("settings.pwdUpdatedTitle") || "Senha atualizada",
                description:
                    t("settings.pwdSavedDesc") ||
                    "Agora você pode entrar com e-mail e senha em qualquer dispositivo.",
            });
        } catch (error: unknown) {
            const code = (error as { code?: string })?.code;
            let message = (error as { message?: string })?.message || "";
            if (code === "auth/weak-password") message = t("settings.pwdTooShortDesc") || message;
            if (code === "auth/popup-closed-by-user")
                message = t("settings.reauthCancelled") || "Re-autenticação cancelada. Tente novamente.";
            toast({
                title: t("settings.pwdErrorTitle") || "Não foi possível salvar a senha",
                description: message,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle>{t("settings.title")}</DialogTitle>
                    <DialogDescription>
                        {t("common.selectLanguage")}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="language" className="text-right">
                            {t("common.language")}
                        </Label>
                        <Select
                            defaultValue={i18n.language}
                            onValueChange={changeLanguage}
                        >
                            <SelectTrigger className="w-[180px] col-span-3">
                                <Globe className="mr-2 h-4 w-4" />
                                <SelectValue placeholder={t("common.selectLanguage")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">{t("languages.en")}</SelectItem>
                                <SelectItem value="pt">{t("languages.pt")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {user && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                    <h4 className="text-sm font-semibold">
                                        {hasPassword
                                            ? t("settings.changePassword") || "Alterar senha"
                                            : t("settings.setPassword") || "Definir senha"}
                                    </h4>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {hasPassword
                                        ? t("settings.changePasswordDesc") ||
                                          "Defina uma nova senha para sua conta."
                                        : t("settings.setPasswordDesc") ||
                                          "Sua conta entra via Google. Crie uma senha para também poder entrar com e-mail e senha."}
                                </p>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">
                                        {t("settings.email") || "E-mail"}
                                    </Label>
                                    <Input value={user.email || ""} readOnly disabled className="h-9" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password" className="text-xs text-muted-foreground">
                                        {t("settings.newPassword") || "Nova senha"}
                                    </Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={saving}
                                        minLength={6}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-new-password" className="text-xs text-muted-foreground">
                                        {t("settings.confirmPassword") || "Confirmar senha"}
                                    </Label>
                                    <Input
                                        id="confirm-new-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={saving}
                                        minLength={6}
                                        className="h-9"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    className="w-full"
                                    onClick={handleSavePassword}
                                    disabled={saving || !password || !confirmPassword}
                                >
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {hasPassword
                                        ? t("settings.changePassword") || "Alterar senha"
                                        : t("settings.setPassword") || "Definir senha"}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
