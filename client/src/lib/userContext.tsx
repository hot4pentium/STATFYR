import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User, Team } from "./api";
import { syncFirebaseUser, getUserTeams } from "./api";
import { onFirebaseAuthStateChanged, signOutFirebase } from "./firebase";

interface UserContextType {
  user: User | null;
  currentTeam: Team | null;
  setUser: (user: User | null) => void;
  updateUser: (user: User) => void;
  setCurrentTeam: (team: Team | null) => void;
  logout: () => Promise<void>;
  isImpersonating: boolean;
  setImpersonating: (impersonating: boolean) => void;
  originalAdmin: User | null;
  setOriginalAdmin: (admin: User | null) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUserState] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [currentTeam, setCurrentTeamState] = useState<Team | null>(() => {
    const stored = localStorage.getItem("currentTeam");
    return stored ? JSON.parse(stored) : null;
  });

  const [isImpersonating, setIsImpersonating] = useState<boolean>(() => {
    return localStorage.getItem("isImpersonating") === "true";
  });

  const [originalAdmin, setOriginalAdminState] = useState<User | null>(() => {
    const stored = localStorage.getItem("originalAdmin");
    return stored ? JSON.parse(stored) : null;
  });

  // Check Firebase auth state on app load and restore session if needed
  useEffect(() => {
    let isMounted = true;
    let listenerCalled = false;
    
    const unsubscribe = onFirebaseAuthStateChanged(async (firebaseUser) => {
      listenerCalled = true;
      console.log('[UserContext] Firebase auth state changed:', firebaseUser?.email || 'null');
      if (!isMounted) return;
      
      if (firebaseUser) {
        // Firebase user is logged in - sync with our backend
        try {
          console.log('[UserContext] Syncing Firebase user...');
          const syncResult = await syncFirebaseUser({
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
          
          // Check if this is a new user needing role selection
          if ('needsRoleSelection' in syncResult && syncResult.needsRoleSelection) {
            console.log('[UserContext] New user needs role selection, redirecting to auth...');
            // Don't set user state - they need to complete registration
            // The auth page will handle this
            if (isMounted) {
              setIsLoading(false);
            }
            return;
          }
          
          // syncResult is a User object
          const syncedUser = syncResult as User;
          console.log('[UserContext] Sync complete, user:', syncedUser.email, 'role:', syncedUser.role);
          
          if (isMounted) {
            setUserState(syncedUser);
            localStorage.setItem("user", JSON.stringify(syncedUser));
            
            // Restore team if not set
            const storedTeam = localStorage.getItem("currentTeam");
            if (!storedTeam) {
              try {
                const teams = await getUserTeams(syncedUser.id);
                if (teams.length > 0 && isMounted) {
                  setCurrentTeamState(teams[0]);
                  localStorage.setItem("currentTeam", JSON.stringify(teams[0]));
                }
              } catch (e) {
                console.log("Could not fetch teams");
              }
            }
          }
        } catch (error) {
          console.error("Failed to sync Firebase user:", error);
        }
      }
      
      if (isMounted) {
        setIsLoading(false);
      }
    });
    
    // If Firebase isn't configured, the listener won't fire
    // Set loading to false immediately if no listener callback after short delay
    const quickTimeout = setTimeout(() => {
      if (isMounted && !listenerCalled) {
        // Firebase not configured or slow - use localStorage data and proceed
        setIsLoading(false);
      }
    }, 500);
    
    // Fallback timeout - don't block forever if Firebase is slow
    const timeout = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 3000);
    
    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(quickTimeout);
      clearTimeout(timeout);
    };
  }, []);

  const setImpersonating = (impersonating: boolean) => {
    setIsImpersonating(impersonating);
    if (impersonating) {
      localStorage.setItem("isImpersonating", "true");
    } else {
      localStorage.removeItem("isImpersonating");
    }
  };

  const setOriginalAdmin = (admin: User | null) => {
    setOriginalAdminState(admin);
    if (admin) {
      localStorage.setItem("originalAdmin", JSON.stringify(admin));
    } else {
      localStorage.removeItem("originalAdmin");
    }
  };

  const setUser = (newUser: User | null) => {
    // Always clear currentTeam when setting a user (fresh login clears stale team data)
    setCurrentTeamState(null);
    localStorage.removeItem("currentTeam");
    
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("user");
    }
  };

  // Update user without clearing team (for profile updates)
  const updateUser = (updatedUser: User) => {
    setUserState(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const setCurrentTeam = (team: Team | null) => {
    setCurrentTeamState(team);
    if (team) {
      localStorage.setItem("currentTeam", JSON.stringify(team));
    } else {
      localStorage.removeItem("currentTeam");
    }
  };

  const logout = async () => {
    // Sign out from Firebase if logged in
    try {
      await signOutFirebase();
    } catch (e) {
      console.log("Firebase signout error:", e);
    }
    
    // Clear local state
    setUserState(null);
    setCurrentTeamState(null);
    setIsImpersonating(false);
    setOriginalAdminState(null);
    localStorage.removeItem("user");
    localStorage.removeItem("currentTeam");
    localStorage.removeItem("isImpersonating");
    localStorage.removeItem("originalAdmin");
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      currentTeam, 
      setUser, 
      updateUser, 
      setCurrentTeam, 
      logout, 
      isImpersonating, 
      setImpersonating, 
      originalAdmin, 
      setOriginalAdmin,
      isLoading
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
