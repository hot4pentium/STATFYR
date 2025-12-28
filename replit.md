# STATFYR - Sports Stats & Team Management

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
- **Session Management**: Stateless (user stored in localStorage on client)

### Data Model
Core entities include Users, Teams, TeamMembers, and HighlightVideos.

### Role-Based Access
- **Coaches**: Full dashboard access (roster, events, playbook, stats, chat).
- **Athletes**: Personal profile, team schedule, stats view, team chat.
- **Supporters**: Read-only view of team schedule, roster, updates. Includes features for managed athletes.

### Core Features
- **Video Highlights System**: Upload, transcoding (FFmpeg to H.264/AAC MP4), and storage (Replit App Storage) of team video highlights.
- **Playbook System**: Canvas-based play designer (PlayMaker) for coaches with categories and status tags, accessible via thumbnails.
- **StatTracker System**: Live game statistics tracking with individual/team modes, sport-specific presets, position-to-stat mapping, and real-time updates.
- **Live Engagement Sessions (Game Day Live)**: Allows supporters to send shoutouts and taps during live events, tied to calendar events.
- **Badge & Theme System**: Awards badges based on supporter engagement (taps), unlocking custom dashboard themes.
- **Shareable Athlete Profiles**: Publicly accessible, read-only profiles displaying athlete stats, highlights, recent cheers, and allowing public likes/comments.
- **Admin Dashboard**: Centralized view for managing teams and users (security limitations noted).
- **PWA Features**: Service worker for offline support and update notifications.
- **Push Notifications**: Firebase Cloud Messaging (FCM) integration for user notifications.

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
- **Firebase Cloud Messaging (FCM)**: Push notifications.
- **FFmpeg**: Video transcoding for highlights.
- **Replit App Storage (GCS-backed)**: Video file hosting.