# TeamPulse - Sports Management Platform

## Overview

TeamPulse is a comprehensive sports team management platform designed for coaches, athletes, and supporters. The application enables team roster management, event scheduling, performance statistics tracking, playbook design, and team communication. Built with a React frontend and Express backend, it uses PostgreSQL for data persistence and follows a role-based access pattern where coaches create teams, and athletes/supporters join via team codes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for user session
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Theming**: next-themes for dark/light mode support
- **Build Tool**: Vite with custom plugins for meta images and Replit integration

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Validation**: Zod with drizzle-zod integration
- **API Pattern**: RESTful endpoints under `/api` prefix
- **Session Management**: Stateless (user stored in localStorage on client)

### Data Model
The database schema centers around four main entities:
- **Users**: Store credentials, role (coach/athlete/supporter), and profile info
- **Teams**: Created by coaches with unique 6-character join codes
- **TeamMembers**: Junction table linking users to teams with role assignment
- **HighlightVideos**: Team video highlights with upload/transcoding pipeline

### Role-Based Navigation
- **Coaches**: Full dashboard with roster, events, playbook, stats, and chat management
- **Athletes**: Personal profile, team schedule, stats view, and team chat
- **Supporters**: Read-only view of team schedule, roster, and updates

### Key Design Patterns
- Path aliases configured (`@/` for client src, `@shared/` for shared code)
- Shared schema between frontend and backend via `shared/schema.ts`
- Mock data in `client/src/lib/mockData.ts` for UI development
- Storage abstraction layer (`IStorage` interface) for database operations

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, configured via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries with schema migrations via `drizzle-kit`

### UI Component Libraries
- **shadcn/ui**: Radix UI primitives with Tailwind styling
- **Lucide React**: Icon library
- **Recharts**: Data visualization for stats pages
- **Embla Carousel**: Carousel components

### Build & Development
- **Vite**: Frontend bundler with HMR
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development

### Fonts
- **Inter**: Primary sans-serif font
- **Oswald**: Display font for headings (loaded via Google Fonts)

### Video Highlights System
- **Upload**: Team members can upload videos up to 100MB via presigned URLs
- **Transcoding**: FFmpeg converts uploads to H.264/AAC MP4 format with thumbnail generation
- **Storage**: Replit App Storage (GCS-backed) for video file hosting
- **Cleanup**: Original files deleted after transcoding; all files deleted on video removal
- **Authorization**: Video deletion restricted to owner, coaches, or staff members
- **Known Limitation**: Current auth uses client-side localStorage; production should use session-based auth to prevent userId spoofing

### Playbook System
- **PlayMaker**: Canvas-based play designer for coaches/staff with drawing tools, player icons, and arrows
- **Categories**: Plays categorized as "Offense", "Defense", or "Special" (required at creation)
- **Status Tags**: "Successful", "Not Successful", "Needs Work" (only available when editing saved plays)
- **Thumbnails**: Canvas captures stored as base64 PNG at 50% quality for preview display
- **Playbook View**: Displays saved plays with thumbnail previews, category badges, status dropdowns, and expandable modal for full view
- **Authorization**: Only coaches and staff can create, edit, or delete plays

### Coach Onboarding Flow
- Coaches without teams are automatically redirected to /coach/onboarding to create their first team
- Session management clears stale team data on login to prevent authorization errors

### Managed Athletes System
- **Purpose**: Allows supporters (parents/guardians) to create and manage athlete profiles for young athletes who cannot manage their own accounts
- **Creation**: Supporters add managed athletes via Settings page using team code, first name, and last name
- **No Login**: Managed athletes are created without passwords and cannot log in independently
- **Team Assignment**: Managed athletes are automatically added to the team roster on creation
- **Profile Switcher**: Supporter dashboard includes a dropdown to switch between viewing as self or as a managed athlete
- **Visual Indicator**: "Viewing as" banner appears when viewing as a managed athlete, with hero banner updating to show athlete info

### PWA Update Notifications
- **Service Worker**: `client/public/service-worker.js` caches app assets with network-first strategy
- **Version Tracking**: Cache version `teampulse-v1.0.1` - increment to trigger update notifications
- **PWA Context**: `client/src/lib/pwaContext.tsx` provides `updateAvailable` state and `applyUpdate` function
- **Update Button**: Amber pulsing AlertCircle icon appears in headers when update is available
- **Update Flow**: Service worker detects new version → PWAContext tracks state → Click button to refresh
- **Check Interval**: Every 60 seconds the service worker checks for updates