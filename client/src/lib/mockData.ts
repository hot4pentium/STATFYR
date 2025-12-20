import { 
  Users, 
  Calendar, 
  ClipboardList, 
  Trophy, 
  MessageSquare, 
  Activity,
  Shield,
  User,
  Settings
} from "lucide-react";

export const TEAM_NAME = "Thunderbolts FC";

export const ROLES = {
  COACH: "coach",
  ATHLETE: "athlete",
  SUPPORTER: "supporter"
};

export const MOCK_USER = {
  id: "u1",
  name: "Coach Carter",
  role: ROLES.COACH,
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100"
};

export const ATHLETES = [
  {
    id: "a1",
    name: "Marcus Rashford",
    number: 10,
    position: "Forward",
    status: "Active",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100",
    stats: { goals: 12, assists: 5, games: 15 }
  },
  {
    id: "a2",
    name: "Bruno Fernandes",
    number: 8,
    position: "Midfield",
    status: "Active",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100",
    stats: { goals: 8, assists: 15, games: 15 }
  },
  {
    id: "a3",
    name: "Luke Shaw",
    number: 23,
    position: "Defender",
    status: "Injured",
    avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=100",
    stats: { goals: 1, assists: 3, games: 10 }
  },
  {
    id: "a4",
    name: "David De Gea",
    number: 1,
    position: "Goalkeeper",
    status: "Active",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100",
    stats: { saves: 45, cleanSheets: 6, games: 15 }
  }
];

export const EVENTS = [
  {
    id: "e1",
    title: "Team Practice",
    date: "2024-10-25T17:00:00",
    location: "Training Ground A",
    type: "Practice"
  },
  {
    id: "e2",
    title: "Match vs. Eagles",
    date: "2024-10-28T14:00:00",
    location: "City Stadium",
    type: "Match"
  },
  {
    id: "e3",
    title: "Video Analysis",
    date: "2024-10-29T10:00:00",
    location: "Meeting Room 1",
    type: "Meeting"
  }
];

export const PLAYS = [
  { id: "p1", name: "High Press Alpha", type: "Defense", tags: ["Aggressive", "Full Field"] },
  { id: "p2", name: "Counter Attack Z", type: "Offense", tags: ["Fast Break", "Wing Play"] },
  { id: "p3", name: "Corner Setup 1", type: "Set Piece", tags: ["Near Post"] },
];

export const NAVIGATION = [
  { name: "Dashboard", href: "/dashboard", icon: Activity },
  { name: "Roster", href: "/roster", icon: Users },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Playbook", href: "/playbook", icon: ClipboardList },
  { name: "Stats", href: "/stats", icon: Trophy },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const RECENT_CHATS = [
  { id: "c1", user: "Marcus Rashford", message: "Coach, can we review the tape?", time: "10:30 AM" },
  { id: "c2", user: "Team Group", message: "Practice moved to 5 PM today.", time: "9:15 AM" },
];
