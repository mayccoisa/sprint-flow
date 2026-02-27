import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';
import type { AppFeature, FeatureAction, UserRole } from '@/types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    feature?: AppFeature;
    action?: FeatureAction;
    requiredRole?: UserRole;
}

export function ProtectedRoute({ children, feature, action = 'view', requiredRole }: ProtectedRouteProps) {
    const { user, userProfile, loading, hasPermission } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    if (!user) {
        // Not logged in, redirect to login page
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role check (e.g., must be Admin)
    if (requiredRole && userProfile?.role !== requiredRole) {
        return <AccessDenied />;
    }

    // Feature Permission check
    if (feature && !hasPermission(feature, action)) {
        return <AccessDenied />;
    }

    return <>{children}</>;
}

function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center h-screen w-full text-center space-y-4 bg-slate-50">
            <ShieldAlert className="h-16 w-16 text-red-500" />
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">You do not have the required permissions to view this page.</p>
        </div>
    );
}
