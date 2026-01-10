import { useState, useCallback, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import {
  demoGame,
  demoGameRoster,
  demoGameStats,
  demoStatConfigs,
  demoPlays,
  demoPlayers,
  isDemoMode,
  getDemoUrl,
  DEMO_TEAM_ID,
  DEMO_GAME_ID,
} from "./demoData";
import type { Game, GameRoster, GameStat, StatConfig, Play, User } from "./api";

interface DemoModeState {
  isDemo: boolean;
  game: Game;
  roster: GameRoster[];
  stats: GameStat[];
  statConfigs: StatConfig[];
  plays: Play[];
  players: User[];
  teamId: string;
  gameId: string;
}

interface DemoModeActions {
  enterDemoMode: (path: string) => void;
  exitDemoMode: () => void;
  addDemoStat: (stat: Omit<GameStat, "id">) => void;
  updateDemoScore: (team: "home" | "opponent", score: number) => void;
}

export function useDemoMode(): DemoModeState & DemoModeActions {
  const [, setLocation] = useLocation();
  const isDemo = isDemoMode();
  
  const [localStats, setLocalStats] = useState<GameStat[]>([]);
  const [localGame, setLocalGame] = useState<Game>(demoGame);

  useEffect(() => {
    if (isDemo) {
      setLocalStats([...demoGameStats]);
      setLocalGame({ ...demoGame });
    }
  }, [isDemo]);

  const enterDemoMode = useCallback((path: string) => {
    setLocation(getDemoUrl(path));
  }, [setLocation]);

  const exitDemoMode = useCallback(() => {
    const currentPath = window.location.pathname;
    setLocation(currentPath);
  }, [setLocation]);

  const addDemoStat = useCallback((stat: Omit<GameStat, "id">) => {
    const newStat: GameStat = {
      ...stat,
      id: `demo-stat-${Date.now()}`,
    };
    setLocalStats(prev => [...prev, newStat]);
    
    if (stat.pointsValue > 0) {
      setLocalGame(prev => ({
        ...prev,
        teamScore: prev.teamScore + stat.pointsValue,
      }));
    }
  }, []);

  const updateDemoScore = useCallback((team: "home" | "opponent", score: number) => {
    setLocalGame(prev => ({
      ...prev,
      [team === "home" ? "teamScore" : "opponentScore"]: score,
    }));
  }, []);

  return useMemo(() => ({
    isDemo,
    game: localGame,
    roster: demoGameRoster,
    stats: localStats,
    statConfigs: demoStatConfigs,
    plays: demoPlays,
    players: demoPlayers,
    teamId: DEMO_TEAM_ID,
    gameId: DEMO_GAME_ID,
    enterDemoMode,
    exitDemoMode,
    addDemoStat,
    updateDemoScore,
  }), [isDemo, localGame, localStats, enterDemoMode, exitDemoMode, addDemoStat, updateDemoScore]);
}
