import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User, Team } from "./api";
import { syncFirebaseUser, getUserTeams } from "./api";
import { onFirebaseAuthStateChanged, signOutFirebase, checkRedirectResult } from "./firebase";

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
  // Flag for OAuth redirect users who need role selection
  redirectNeedsRoleSelection: boolean;
  clearRedirectNeedsRoleSelection: () => void;
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
  
  // Track if an OAuth redirect user needs role selection (for AuthPage to handle)
  const [redirectNeedsRoleSelection, setRedirectNeedsRoleSelection] = useState(false);
  const clearRedirectNeedsRoleSelection = () => setRedirectNeedsRoleSelection(false);

  // Check Firebase auth state on app load and restore session if needed
  useEffect(() => {
    let isMounted = true;
    let listenerCalled = false;
    let redirectChecked = false;
    // Track the UID we handled from redirect to skip only that first sync
    let handledRedirectUid: string | null = null;
    
    // Helper to sync a Firebase user with our backend
    const syncUser = async (firebaseUser: any) => {
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
          console.log('[UserContext] New user needs role selection');
          if (isMounted) {
            setRedirectNeedsRoleSelection(true);
          }
          return null; // Let AuthPage handle role selection
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
        return syncedUser;
      } catch (error) {
        console.error("Failed to sync Firebase user:", error);
        return null;
      }
    };
    
    // Helper to clear all auth state (used on sign-out)
    const clearAuthState = () => {
      if (isMounted) {
        setUserState(null);
        setCurrentTeamState(null);
        setIsImpersonating(false);
        setOriginalAdminState(null);
        localStorage.removeItem("user");
        localStorage.removeItem("currentTeam");
        localStorage.removeItem("isImpersonating");
        localStorage.removeItem("originalAdmin");
      }
    };
    
    // FIRST: Check for redirect result from mobile OAuth (must happen before auth state listener)
    const checkRedirect = async () => {
      try {
        console.log('[UserContext] Checking for OAuth redirect result...');
        const result = await checkRedirectResult();
        redirectChecked = true;
        
        if (result.user && isMounted) {
          console.log('[UserContext] Found redirect user:', result.user.email);
          handledRedirectUid = result.user.uid; // Remember this UID to skip duplicate sync
          await syncUser(result.user);
          if (isMounted) {
            setIsLoading(false);
          }
          return true; // Redirect was handled
        }
      } catch (error) {
        console.error('[UserContext] Redirect check error:', error);
      }
      return false;
    };
    
    let cleanupFn: (() => void) | null = null;
    
    // Start redirect check immediately
    checkRedirect().then(() => {
      if (!isMounted) return;
      
      // ALWAYS set up auth state listener after redirect check completes
      // This ensures future auth events (logout, token refresh, new sign-ins) are handled
      const unsubscribe = onFirebaseAuthStateChanged(async (firebaseUser) => {
        listenerCalled = true;
        console.log('[UserContext] Firebase auth state changed:', firebaseUser?.email || 'null');
        if (!isMounted) return;
        
        if (firebaseUser) {
          // Skip sync only if this is the same user we just handled from redirect
          if (handledRedirectUid && firebaseUser.uid === handledRedirectUid) {
            console.log('[UserContext] Skipping sync for redirect-handled user');
            handledRedirectUid = null; // Clear so future events for same user still sync
          } else {
            await syncUser(firebaseUser);
          }
        } else {
          // User signed out - clear all auth state
          clearAuthState();
        }
        
        if (isMounted) {
          setIsLoading(false);
        }
      });
      
      // Store unsubscribe for cleanup
      cleanupFn = unsubscribe;
    });
    
    // If Firebase isn't configured, the listener won't fire
    // Set loading to false immediately if no listener callback after short delay
    const quickTimeout = setTimeout(() => {
      if (isMounted && !listenerCalled && redirectChecked) {
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
      if (cleanupFn) cleanupFn();
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
      isLoading,
      redirectNeedsRoleSelection,
      clearRedirectNeedsRoleSelection
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
