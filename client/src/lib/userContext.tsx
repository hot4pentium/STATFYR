import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User, Team } from "./api";

interface UserContextType {
  user: User | null;
  currentTeam: Team | null;
  setUser: (user: User | null) => void;
  updateUser: (user: User) => void;
  setCurrentTeam: (team: Team | null) => void;
  logout: () => void;
  isImpersonating: boolean;
  setImpersonating: (impersonating: boolean) => void;
  originalAdmin: User | null;
  setOriginalAdmin: (admin: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
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

  const logout = () => {
    setUser(null);
    setCurrentTeam(null);
    setImpersonating(false);
    setOriginalAdmin(null);
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
      setOriginalAdmin 
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
