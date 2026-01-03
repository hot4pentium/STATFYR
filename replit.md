# STATFYR v1.0.5 - Sports Stats & Team Management

## Overview
STATFYR is a comprehensive sports team management platform for coaches, athletes, and supporters. It facilitates team roster management, event scheduling, performance statistics tracking, playbook design, and team communication. The platform supports role-based access, where coaches manage teams, and athletes/supporters join using team codes. Key features include video highlights, a playbook system, stat tracking, live engagement sessions, shareable athlete profiles, and an admin dashboard.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query for server state, React Context for user session
- **Styling**: Tailwind CSS v4 with shadcn/ui (New York style)
- **Theming**: next-themes for dark/light mode
- **Build Tool**: Vite

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Validation**: Zod with drizzle-zod
- **API Pattern**: RESTful endpoints (`/api` prefix)
- **Authentication**: Dual auth system:
  - **Replit Auth (OAuth2)**: Login with Google, GitHub, X, Apple, or email/password via Replit's OIDC provider
  - **Legacy Password Auth**: Existing email/password registration and login (`/api/auth/register`, `/api/auth/login`)
  - Session management via PostgreSQL sessions table with 1-week TTL
- **Session Management**: Server-side sessions for OAuth; localStorage for legacy password auth

### Data Model
Core entities include Users, Teams, TeamMembers, and HighlightVideos.

### Role-Based Access
- **Coaches**: Full dashboard access (roster, events, playbook, stats, chat, team settings). Can promote/demote team members to staff role.
- **Staff**: Coach-level access to all features except team settings. Can manage roster, events, playbook, highlights, and stats. Cannot edit coaches or other staff members.
- **Athletes**: Personal profile, team schedule, stats view, team chat. Require jersey number and position assignment.
- **Supporters**: Read-only view of team schedule, roster, updates. Do NOT require jersey number or position. Includes features for managed athletes.

### Core Features
- **Video Highlights System**: Upload, transcoding (FFmpeg to H.264/AAC MP4), and storage (Replit App Storage) of team video highlights.
- **Playbook System**: Canvas-based play designer (PlayMaker) for coaches with categories and status tags, accessible via thumbnails.
- **StatTracker System**: Live game statistics tracking with individual/team modes, sport-specific presets, position-to-stat mapping, and real-time updates.
- **Live Engagement Sessions (Game Day Live)**: Allows supporters to send shoutouts and taps during live events, tied to calendar events.
- **Badge & Theme System**: Awards badges based on supporter engagement (taps), unlocking custom dashboard themes.
- **Shareable Athlete Profiles**: Publicly accessible, read-only profiles displaying athlete stats, highlights, recent cheers, and allowing public likes/comments. Features a HYPE Post Spotlight Modal that opens immediately when arriving from a push notification with `?hypePostId=` parameter, showing the specific post in a full-screen modal with a "View HYPE Card" button.
- **Admin Dashboard**: Centralized view for managing teams and users (security limitations noted).
- **PWA Features**: Service worker for offline support and update notifications.
- **Email Notifications**: Resend API with verified domain (noreply@statfyr.com) for HYPE posts, direct messages, team chat, and events.
- **Smart Email Delivery**: Direct message emails are delayed by 5 seconds and skipped if the recipient is actively viewing the conversation. Uses `chatPresence` table to track active conversations with 15-second TTL and 10-second heartbeat from frontend.
- **Unread Message Indicators**: Floating chat button on dashboards with glow effect and badge when unread messages exist. Team Chat card on CoachDashboard has green glow styling when unread count > 0.

## In Progress
- **Glowing Team Chat Card**: Styling is in place (ring-2 ring-green-500 animate-pulse) but data fetching for unread count needs debugging. The conversations endpoint returns correct unreadCount but the React Query isn't triggering the glow effect on the dashboard.

### Chat Presence System
- **Table**: `chatPresence` tracks userId, teamId, conversationWithUserId, lastSeenAt
- **API Endpoints**: POST/DELETE `/api/teams/:teamId/presence` for heartbeats
- **Frontend**: ChatPage sends heartbeat every 10 seconds while viewing a DM conversation
- **Email Logic**: 5-second delay before sending, checks if recipient is active (lastSeenAt within 15s)

### Design Patterns
- Path aliases (`@/`, `@shared/`) for organized imports.
- Shared schema (`shared/schema.ts`) for frontend/backend consistency.
- Storage abstraction layer for database operations.

## External Dependencies

### Database
- **PostgreSQL**: Primary data store.
- **Drizzle ORM**: Type-safe queries and migrations.

### UI Components & Libraries
- **shadcn/ui**: Radix UI primitives with Tailwind CSS.
- **Lucide React**: Icon library.
- **Recharts**: Data visualization.
- **Embla Carousel**: Carousel components.

### Build & Development Tools
- **Vite**: Frontend bundler.
- **esbuild**: Server bundling.
- **tsx**: TypeScript execution.

### Fonts
- **Inter**: Sans-serif font.
- **Oswald**: Display font.

### Other Integrations
- **OneSignal**: Cross-platform push notifications (supports iOS Safari PWA, Android, desktop browsers).
- **FFmpeg**: Video transcoding for highlights.
- **Replit App Storage (GCS-backed)**: Video file hosting.
- **Replit Auth**: OAuth2 authentication via Replit's OIDC provider, supporting Google, GitHub, Apple, X, and email/password login.

## Authentication Architecture

### Auth Routes
- `/api/login` - OAuth flow via Replit (redirects to Replit OIDC provider)
- `/api/logout` - OAuth logout (redirects to Replit end session endpoint)
- `/api/auth/user` - Get current authenticated OAuth user
- `/api/auth/register` - Legacy email/password registration
- `/api/auth/login` - Legacy email/password login
- `/api/auth/change-password` - Password change for legacy accounts

### User Schema (shared/models/auth.ts)
The users table supports both OAuth and password authentication:
- OAuth users: Have `email`, `firstName`, `lastName`, `profileImageUrl` from Replit claims; `username` and `password` are null
- Password users: Have `username`, `password`, `email`; `profileImageUrl` may be null
- All users: Have `role`, `name`, `position`, `number`, and STATFYR-specific fields

### Session Storage
OAuth sessions stored in `sessions` table with sid/sess/expire columns.
Legacy password auth uses localStorage on the client side.