import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile, FeatureAction, AppFeature, UserRole } from '@/types';

// Default permissions applied to a new user
const defaultPermissions: Record<AppFeature, FeatureAction[]> = {
    squads: ['view'],
    initiatives: ['view'],
    backlog: ['view'],
    strategy: ['view'],
    sprints: ['view'],
    releases: ['view'],
    users: [], // Only admins
};

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    login: () => Promise<void>; // Google Login
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    hasPermission: (feature: AppFeature, action: FeatureAction) => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // Ensure the user exists in Firestore
                const userRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    // Check for pending invite by email
                    const usersRef = collection(db, 'users');
                    const inviteQuery = query(usersRef, where('email', '==', currentUser.email?.toLowerCase()));
                    const inviteSnapshot = await getDocs(inviteQuery);

                    let assignedRole: UserRole = 'Member';
                    let assignedPermissions: Record<string, FeatureAction[]> = defaultPermissions as Record<string, FeatureAction[]>;

                    // If an invite is found, adopt its permissions and clean it up if it was a temporary invite record
                    if (!inviteSnapshot.empty) {
                        const inviteDoc = inviteSnapshot.docs[0];
                        const inviteData = inviteDoc.data() as UserProfile;
                        assignedRole = inviteData.role;
                        assignedPermissions = inviteData.permissions as Record<string, FeatureAction[]>;

                        // Delete the temporary invite record since we are creating the actual user record with their UID
                        if (inviteDoc.id.startsWith('invite_')) {
                            await deleteDoc(doc(db, 'users', inviteDoc.id));
                        }
                    }

                    // Create the actual user profile tied to their UID
                    const newProfile: UserProfile = {
                        id: currentUser.uid,
                        created_at: new Date().toISOString(),
                        email: currentUser.email || '',
                        name: currentUser.displayName || null,
                        role: assignedRole,
                        permissions: assignedPermissions
                    };
                    await setDoc(userRef, newProfile);
                }

                // Subscribe to profile changes
                const unsubscribeProfile = onSnapshot(userRef, (doc) => {
                    if (doc.exists()) {
                        setUserProfile(doc.data() as UserProfile);
                    }
                    setLoading(false);
                });

                return () => unsubscribeProfile();
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    const login = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const loginWithEmail = async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const registerWithEmail = async (name: string, email: string, pass: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(userCredential.user, { displayName: name });
        // The onAuthStateChanged listener will pick up the new user and create the Firestore profile
    };

    const logout = async () => {
        await signOut(auth);
    };

    const hasPermission = (feature: AppFeature, action: FeatureAction) => {
        if (!userProfile) return false;
        if (userProfile.role === 'Admin') return true; // Admins can do anything

        const featurePerms = userProfile.permissions[feature] || [];
        return featurePerms.includes(action);
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, login, loginWithEmail, registerWithEmail, logout, hasPermission }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
