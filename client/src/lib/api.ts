import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  name: string;
  avatar?: string | null;
  position?: string | null;
  number?: number | null;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  sport: string;
  division?: string | null;
  season?: string | null;
  coachId?: string | null;
  createdAt?: string | null;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  joinedAt?: string | null;
  user: User;
}

export interface Event {
  id: string;
  teamId: string;
  title: string;
  type: string;
  date: string;
  endDate?: string | null;
  location?: string | null;
  details?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
}

export async function registerUser(data: {
  username: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  name: string;
}): Promise<User> {
  const res = await apiRequest("POST", "/api/auth/register", data);
  return res.json();
}

export async function loginUser(username: string, password: string): Promise<User> {
  const res = await apiRequest("POST", "/api/auth/login", { username, password });
  return res.json();
}

export async function getUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error("Failed to get user");
  return res.json();
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const res = await apiRequest("PATCH", `/api/users/${id}`, data);
  return res.json();
}

export async function createTeam(data: {
  name: string;
  sport: string;
  division?: string;
  season?: string;
  coachId: string;
}): Promise<Team> {
  const res = await apiRequest("POST", "/api/teams", data);
  return res.json();
}

export async function getTeamByCode(code: string): Promise<Team> {
  const res = await fetch(`/api/teams/code/${code}`);
  if (!res.ok) throw new Error("Team not found");
  return res.json();
}

export async function getTeam(id: string): Promise<Team> {
  const res = await fetch(`/api/teams/${id}`);
  if (!res.ok) throw new Error("Team not found");
  return res.json();
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const res = await fetch(`/api/teams/${teamId}/members`);
  if (!res.ok) throw new Error("Failed to get team members");
  return res.json();
}

export async function joinTeamByCode(code: string, userId: string, role: string): Promise<{ team: Team; member: TeamMember }> {
  const res = await apiRequest("POST", "/api/teams/join-by-code", { code, userId, role });
  return res.json();
}

export async function joinTeam(teamId: string, userId: string, role: string): Promise<TeamMember> {
  const res = await apiRequest("POST", `/api/teams/${teamId}/join`, { userId, role });
  return res.json();
}

export async function getUserTeams(userId: string): Promise<Team[]> {
  const res = await fetch(`/api/users/${userId}/teams`);
  if (!res.ok) throw new Error("Failed to get user teams");
  return res.json();
}

export async function getCoachTeams(coachId: string): Promise<Team[]> {
  const res = await fetch(`/api/coach/${coachId}/teams`);
  if (!res.ok) throw new Error("Failed to get coach teams");
  return res.json();
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  await apiRequest("DELETE", `/api/teams/${teamId}/members/${userId}`, {});
}

export async function getTeamEvents(teamId: string): Promise<Event[]> {
  const res = await fetch(`/api/teams/${teamId}/events`);
  if (!res.ok) throw new Error("Failed to get team events");
  return res.json();
}

export async function createEvent(teamId: string, data: {
  title: string;
  type: string;
  date: string;
  endDate?: string | null;
  location?: string | null;
  details?: string | null;
  createdBy?: string | null;
}): Promise<Event> {
  const res = await apiRequest("POST", `/api/teams/${teamId}/events`, data);
  return res.json();
}

export async function updateEvent(eventId: string, data: Partial<{
  title: string;
  type: string;
  date: string;
  endDate?: string | null;
  location?: string | null;
  details?: string | null;
}>): Promise<Event> {
  const res = await apiRequest("PATCH", `/api/events/${eventId}`, data);
  return res.json();
}

export async function deleteEvent(eventId: string): Promise<void> {
  await apiRequest("DELETE", `/api/events/${eventId}`, {});
}
