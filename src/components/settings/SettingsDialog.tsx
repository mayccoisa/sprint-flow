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
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const { t, i18n } = useTranslation();

    const changeLanguage = (value: string) => {
        i18n.changeLanguage(value);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
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
                </div>
            </DialogContent>
        </Dialog>
    );
}
