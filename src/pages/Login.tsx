import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, Layers, Loader2, Mail, Lock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
    const { login, loginWithEmail, registerWithEmail, loading } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [mode, setMode] = useState<'login' | 'register'>('login');

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Get the destination to redirect to, defaulting to home '/'
    const from = location.state?.from?.pathname || '/';

    const handleGoogleLogin = async () => {
        setIsLoggingIn(true);
        try {
            await login();
            toast({
                title: t('login.welcome'),
                description: t('login.googleSuccess'),
            });
            navigate(from, { replace: true });
        } catch (error: any) {
            toast({
                title: t('login.authFailed'),
                description: error.message || t('login.authError'),
                variant: "destructive"
            });
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'register' && password !== confirmPassword) {
            toast({
                title: t('login.pwdMismatchTitle'),
                description: t('login.pwdMismatchDesc'),
                variant: "destructive"
            });
            return;
        }

        setIsLoggingIn(true);
        try {
            if (mode === 'login') {
                await loginWithEmail(email, password);
                toast({ title: t('login.welcomeBack'), description: t('login.signedIn') });
            } else {
                await registerWithEmail(name, email, password);
                toast({ title: t('login.accountCreated'), description: t('login.welcomePlatform') });
            }
            navigate(from, { replace: true });
        } catch (error: any) {
            let message = error.message;
            if (error.code === 'auth/email-already-in-use') message = t('login.emailInUse');
            if (error.code === 'auth/wrong-password') message = t('login.invalidCreds');
            if (error.code === 'auth/user-not-found') message = t('login.userNotFound');

            toast({ title: t('login.authFailed'), description: message, variant: "destructive" });
        } finally {
            setIsLoggingIn(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
            {/* Left side: Branding/Hero */}
            <div className="hidden md:flex flex-col bg-violet-600 text-white p-12 justify-between isolate relative overflow-hidden">
                {/* Decorative background blurs */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500 rounded-full blur-3xl -z-10 opacity-50" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-800 rounded-full blur-3xl -z-10 opacity-30" />

                <div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                            <Target className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">{t('login.title')}</span>
                    </div>
                </div>

                <div className="space-y-6 max-w-md">
                    <h1 className="text-4xl font-extrabold tracking-tight">
                        {t('login.heroTitle1')} <br className="hidden lg:inline" />
                        {t('login.heroTitle2')}
                    </h1>
                    <p className="text-violet-200 text-lg">
                        {t('login.heroDesc')}
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-8">
                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                            <Layers className="h-5 w-5 text-violet-300" />
                            <span className="font-medium text-sm">{t('login.strategy')}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                            <Target className="h-5 w-5 text-violet-300" />
                            <span className="font-medium text-sm">{t('login.tracking')}</span>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-violet-300 font-medium">
                    © {new Date().getFullYear()} {t('login.rights')}
                </div>
            </div>

            {/* Right side: Login Form */}
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50">
                <div className="w-full max-w-[400px] space-y-8 relative">

                    {/* Decorative element for mobile */}
                    <div className="md:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="bg-violet-100 p-3 rounded-2xl">
                            <Target className="h-8 w-8 text-violet-600" />
                        </div>
                    </div>

                    <div className="text-center md:text-left space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                            {mode === 'login' ? t('login.titleLogin') : t('login.titleRegister')}
                        </h2>
                        <p className="text-muted-foreground">
                            {mode === 'login'
                                ? t('login.descLogin')
                                : t('login.descRegister')}
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
                        {/* Email/Password Form */}
                        <form onSubmit={handleEmailAuth} className="space-y-4">
                            {mode === 'register' && (
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t('login.fullName')}</Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <Input
                                            id="name"
                                            placeholder={t('login.namePlaceholder')}
                                            className="pl-9"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required={mode === 'register'}
                                            disabled={isLoggingIn}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">{t('login.email')}</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder={t('login.emailPlaceholder')}
                                        className="pl-9"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoggingIn}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">{t('login.password')}</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-9"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isLoggingIn}
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            {mode === 'register' && (
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">{t('login.confirmPassword')}</Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-9"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required={mode === 'register'}
                                            disabled={isLoggingIn}
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
                                disabled={isLoggingIn}
                            >
                                {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {mode === 'login' ? t('login.btnSignIn') : t('login.btnRegister')}
                            </Button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-muted-foreground">{t('login.orContinue')}</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            className="w-full h-11 text-base font-medium rounded-xl flex items-center justify-center gap-3 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                            onClick={handleGoogleLogin}
                            disabled={isLoggingIn}
                        >
                            {isLoggingIn ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                    </svg>
                                    {t('login.continueGoogle')}
                                </>
                            )}
                        </Button>

                        <div className="text-center text-sm pt-4 border-t border-slate-100">
                            {mode === 'login' ? (
                                <p className="text-muted-foreground">
                                    {t('login.noAccount')} {' '}
                                    <button
                                        type="button"
                                        className="text-violet-600 font-semibold hover:underline"
                                        onClick={() => setMode('register')}
                                        disabled={isLoggingIn}
                                    >
                                        {t('login.registerHere')}
                                    </button>
                                </p>
                            ) : (
                                <p className="text-muted-foreground">
                                    {t('login.hasAccount')} {' '}
                                    <button
                                        type="button"
                                        className="text-violet-600 font-semibold hover:underline"
                                        onClick={() => setMode('login')}
                                        disabled={isLoggingIn}
                                    >
                                        {t('login.signInHere')}
                                    </button>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
