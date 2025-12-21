import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User, Team } from "./api";

interface UserContextType {
  user: User | null;
  currentTeam: Team | null;
  setUser: (user: User | null) => void;
  setCurrentTeam: (team: Team | null) => void;
  logout: () => void;
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
    localStorage.removeItem("user");
    localStorage.removeItem("currentTeam");
  };

  return (
    <UserContext.Provider value={{ user, currentTeam, setUser, setCurrentTeam, logout }}>
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
