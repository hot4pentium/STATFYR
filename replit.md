# STATFyR - Sports Stats & Team Management

## Overview

STATFyR is a comprehensive sports team management platform designed for coaches, athletes, and supporters. The application enables team roster management, event scheduling, performance statistics tracking, playbook design, and team communication. Built with a React frontend and Express backend, it uses PostgreSQL for data persistence and follows a role-based access pattern where coaches create teams, and athletes/supporters join via team codes.

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

### Roster Management System
- **Team-Specific Data**: Jersey numbers and positions are stored per team membership in `team_members` table, allowing athletes to have different numbers on different teams
- **Role Management**: Coaches and staff can promote athletes to staff or demote staff back to athlete
- **Member Editing**: Coaches and staff can assign/update jersey numbers and positions for team members
- **Member Removal**: Coaches and staff can remove members from the team (except the head coach)
- **Coach Protection**: The team's head coach cannot be demoted or removed from their own team
- **Staff Permissions**: Staff members can manage athletes but cannot assign the coach role
- **Authorization**: Backend verifies requester is a team member with coach/staff role before allowing changes
- **Known Limitation**: Current auth uses client-side localStorage with requesterId query parameter; production should use session-based auth to prevent userId spoofing

### StatTracker System
- **Purpose**: Live game statistics tracking for coaches and staff during games
- **Tracking Modes**: Individual (stats per player) or Team (team totals only)
- **Setup Flow**: Select event (optional) → Choose tracking mode → Configure periods → Create game
- **Game Roster**: On Bench / In Game sections with easy toggle between states
- **Stats Configuration**: Sport-specific stat presets for Baseball, Basketball, Football, Soccer, Volleyball
- **Settings View**: Accessible via sliders icon on setup page for managing stat-to-position and athlete-to-position assignments
- **Position-to-Stat Mapping**: Coaches/staff can assign which positions can track each stat via checkboxes; stats with no positions are available to all
- **Athlete Position Assignment**: Coaches/staff can assign positions to athletes; positions persist in team_members and apply when new game rosters are created
- **Stat-First UI Flow**: Two-panel layout with stats grid (2 columns) and always-visible player list; tap stat first, then tap player to record
- **Player Filtering**: When a stat is selected, player list filters to show only eligible players based on their positions
- **Responsive Layout**: Desktop shows side-by-side panels; mobile shows stats grid with sticky player bar fixed at bottom of screen
- **Score Override**: Manual score editing available during games
- **Corrections**: Soft delete (undo) for stats with activity log showing recent entries
- **Game Summary**: Final score display with team totals and individual player breakdowns
- **Database Tables**: `games` (linked to events), `stat_configurations` (position-to-stat mappings), `game_stats` (with soft delete), `game_rosters` (bench vs in-game, positions array)
- **Shared Constants**: `client/src/lib/sportConstants.ts` exports SPORT_POSITIONS and SPORT_STATS for reuse across components
- **Authorization**: Only coaches and staff can create/manage games, record stats, and manage game rosters
- **Routes**: `/stattracker` for new game setup, `/stattracker/:gameId` to resume existing game

### PWA Update Notifications
- **Service Worker**: `client/public/service-worker.js` caches app assets with network-first strategy
- **Version Tracking**: Cache version `teampulse-v1.0.1` - increment to trigger update notifications
- **PWA Context**: `client/src/lib/pwaContext.tsx` provides `updateAvailable` state and `applyUpdate` function
- **Update Button**: Amber pulsing AlertCircle icon appears in headers when update is available
- **Update Flow**: Service worker detects new version → PWAContext tracks state → Click button to refresh
- **Check Interval**: Every 60 seconds the service worker checks for updates

### Live Engagement Sessions (Game Day Live)
- **Purpose**: Allow supporters to cheer for athletes during live games through shoutouts and taps, independent from StatTracker
- **Session-Based**: Live engagement is tied to calendar events via `live_engagement_sessions` table, not to StatTracker games
- **Auto-Start**: Sessions auto-start 15 minutes before event start time (checked via `/api/live-sessions/check-lifecycle`)
- **Auto-End**: Sessions auto-end 30 minutes after scheduled end time (or extended end time)
- **Manual Control**: Coaches/staff can manually start/end sessions from event detail pages
- **Extension Flow**: Supporters see "Continue Cheering?" prompt when scheduled end time is reached; extends session by 30 minutes
- **Game Started Confirmation**: Supporters see "Game Started?" confirmation button when joining an active session
- **Session Status**: scheduled, live, ended
- **Shoutouts**: Quick one-button cheers (🔥, 💪, ⭐, ❤️, ⚡, 🏆) that supporters can send to in-game athletes
- **Live Taps**: Large tap button that supporters smash during exciting plays; every 3 client taps = 1 server increment (cost optimization)
- **Rate Limiting**: In-memory rate limiter (5 bursts per 10 seconds) prevents tap abuse
- **Routes**: `/supporter/live/:sessionId` for session-based engagement (new), `/supporter/game/:gameId` for legacy game-based flow
- **Database Tables**: `live_engagement_sessions` (linked to events), `shoutouts` (with sessionId), `live_tap_events` (with sessionId), `live_tap_totals` (season aggregates)
- **Backward Compatibility**: Legacy game-based shoutouts/taps still work via `gameId` columns

### Badge & Theme System
- **Badge Definitions**: Bronze (100 taps), Silver (500 taps), Gold (2000 taps), Legend (10000 taps)
- **Auto-Seeding**: Default badges created on first `/api/badges` request if none exist
- **Badge Checking**: `POST /api/supporters/:supporterId/check-badges` compares tap totals to badge thresholds
- **Theme Unlocks**: Each badge unlocks a corresponding dashboard theme (bronze, silver, gold, legend)
- **Theme Selection**: Supporters can view and activate unlocked themes in the Badges section
- **Database Tables**: `badge_definitions`, `supporter_badges` (earned), `theme_unlocks` (unlocked themes with isActive flag)
- **Badge Display**: Hype Card quadrant shows shoutout count; Badges section shows tap totals, progress bar, earned badges, and theme selector
- **Live Game Banner**: Supporter Dashboard shows pulsing "LIVE GAME NOW!" banner when active games exist