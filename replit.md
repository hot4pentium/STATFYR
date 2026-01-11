# STATFYR v1.1.7 - Sports Stats & Team Management

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
- **PWA Features**: Service worker (v1.1.7) for offline support and update notifications.
- **Splash Screen Failsafe**: 5-second timeout in main.tsx ensures splash removal even if React fails to mount.
- **Auth Persistence**: Explicitly set to browserLocalPersistence to keep users logged in across sessions.
- **Email Notifications**: Resend API with verified domain (noreply@statfyr.com) for HYPE posts, team chat, events, and stat session alerts.
- **Chat Notifications**: Push-first (Firebase Cloud Messaging) with email fallback (Resend) for direct messages. 5-second delay before sending, skipped if recipient is actively viewing conversation. Uses `chatPresence` table with 15-second TTL and 10-second heartbeat. Controlled by `pushOnMessage` and `emailOnMessage` preferences.
- **Unread Message Indicators**: Floating chat button on dashboards with glow effect and badge when unread messages exist. Team Chat card on CoachDashboard has green glow styling when unread count > 0.
- **Stat Session Notifications**: Push-first (Firebase Cloud Messaging) with email fallback (Resend). Uses FCM tokens stored in `fcm_tokens` table. Pre-game reminders (30 min before) via `/api/internal/run-pregame-reminders` endpoint.
- **Push Notification System**: Firebase Cloud Messaging (FCM) for cross-platform push (web, PWA, native iOS/Android via Capacitor). Uses `sendPushNotification()` from firebaseAdmin.ts targeting users by FCM device tokens. Personalized notifications per supporter with their followed athlete names. Requires explicit opt-in via `pushOnEvent` preference (defaults to false).

## In Progress
- **Glowing Team Chat Card**: Styling is in place (ring-2 ring-green-500 animate-pulse) but data fetching for unread count needs debugging. The conversations endpoint returns correct unreadCount but the React Query isn't triggering the glow effect on the dashboard.

### Chat Presence System
- **Table**: `chatPresence` tracks userId, teamId, conversationWithUserId, lastSeenAt
- **API Endpoints**: POST/DELETE `/api/teams/:teamId/presence` for heartbeats
- **Frontend**: ChatPage sends heartbeat every 10 seconds while viewing a DM conversation
- **Notification Logic**: 5-second delay before sending, checks if recipient is active (lastSeenAt within 15s). Push notification sent first if `pushOnMessage` enabled, email fallback if push fails and `emailOnMessage` enabled.

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

### Capacitor Native Features
The app supports native iOS/Android via Capacitor with the following features:
- **Native Share** (`client/src/lib/capacitor.ts`): Uses `@capacitor/share` for native share dialogs on HYPE cards and highlights. Falls back to Web Share API or clipboard on web.
- **Camera Integration** (`client/src/hooks/useNativeCamera.ts`): Uses `@capacitor/camera` for taking photos or picking from gallery. Integrated in AthleteSettings and SupporterSettings for profile photos.
- **Offline Caching** (`client/src/hooks/useOfflineCache.ts`): Uses `@capacitor/preferences` to cache data locally with TTL. Applied to managed athletes via `useManagedAthletesCache` hook.
- **Keep Screen Awake** (`SupporterSessionLive.tsx`, `SupporterGameLive.tsx`): Uses `@capacitor-community/keep-awake` to prevent screen dimming during Game Day Live sessions.
- **Biometric Auth** (`client/src/lib/capacitor.ts`): Uses `@capgo/capacitor-native-biometric` for Face ID/Touch ID/fingerprint authentication. Functions: `checkBiometricAvailability()`, `enableBiometricAuth()`, `authenticateWithBiometric()`.
- **App Badge** (`client/src/hooks/useAppBadge.ts`): Uses `@capawesome/capacitor-badge` to show unread message count on app icon. Debounced updates to avoid API churn.
- **Background Sync** (`client/src/hooks/useBackgroundSync.ts`): Syncs pending stats when app becomes visible or comes online. Only runs on native platforms.
- **Haptic Feedback** (`client/src/lib/capacitor.ts`): Uses `@capacitor/haptics` for tactile feedback on key interactions.

### Other Integrations
- **Firebase Cloud Messaging (FCM)**: Cross-platform push notifications (supports iOS Safari PWA, Android, desktop browsers, native apps via Capacitor). Replaced OneSignal as of v1.1.3.
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

## Subscription System

### Subscription Tiers
- **Coach Pro ($9.99/mo)**: Full StatTracker access, PlayMaker editing, view individual stats, roster promotion tools
- **Athlete Pro ($2.99/mo)**: Upload highlights for athletes
- **Supporter Pro ($5.99/mo)**: StatTracker access for managed athletes, upload highlights, view individual stats, track own stats, follow athletes across teams
- **Free Athlete**: View stats, hype card, profile, hype posts (no subscription needed for basic athlete features)
- **Free Tier**: Basic team access (view roster, schedule, playbook, team chat, Game Day Live)

### Stripe Integration
- **stripeClient.ts**: Manages Stripe API client initialization
- **stripeService.ts**: Product/subscription CRUD, checkout sessions, customer portal
- **webhookHandlers.ts**: Subscription lifecycle events (created, updated, deleted)
- Products synced from Stripe to `stripe` schema via stripe-replit-sync

### Entitlements System
Feature flags computed server-side based on subscription tier + team roles:
- `canUseStatTracker`: Paid coach, staff role, paid supporter
- `canEditPlayMaker`: Paid coach, staff role  
- `canUploadHighlights`: Paid supporter, paid athlete
- `canViewIndividualStats`: Paid coach, staff, paid supporter, all athletes (free)
- `canViewHighlights`: All users (free)
- `canPromoteMembers`: Paid coach only
- `canFollowCrossTeam`: Paid supporter
- `canTrackOwnStats`: Paid supporter

### Feature Gating
- Dashboard cards show lock icons for locked premium features
- Clicking locked features shows upgrade toast with link to subscription page
- StatTrackerPage has full-page upgrade prompt for non-subscribers
- Settings menu includes Upgrade/Subscription link

### Staff Role Permissions
Staff members (promoted by coaches) inherit coach-level permissions without needing a subscription:
- Full StatTracker access
- PlayMaker editing
- View individual stats
- Edit events/roster

### Supporter Athlete Following
Supporters can follow athletes to track their performance:
- **Same-team follows**: Free for all supporters - follow athletes on teams you're already a member of
- **Cross-team follows**: Requires Supporter Pro subscription - follow athletes on teams you're not a member of
- **API endpoints**: 
  - GET `/api/supporter/following` - Get followed athletes
  - POST `/api/supporter/follow/:athleteId` - Follow an athlete (server detects if cross-team based on team memberships)
  - DELETE `/api/supporter/follow/:athleteId` - Unfollow an athlete
  - PATCH `/api/supporter/follow/:athleteId` - Update nickname
  - GET `/api/supporter/search-athletes?q=` - Search athletes to follow
- **UI**: "Following" card on Supporter Dashboard with search dialog
- **Database**: `supporter_athlete_links` table with supporterId, athleteId, teamId (null for cross-team), nickname

### Supporter Fallback Stat Tracking
Paid supporters can track their own stats for followed athletes when the coach uses team-only mode:
- **Entitlement**: Requires Supporter Pro subscription (`canTrackOwnStats` entitlement)
- **API endpoints**:
  - GET `/api/supporter/stats/:athleteId` - Get supporter's tracked stats for an athlete
  - POST `/api/supporter/stats` - Record a stat (athleteId, teamId, statName required)
  - DELETE `/api/supporter/stats/:id` - Delete a stat
  - GET `/api/supporter/stats/:athleteId/aggregate` - Get aggregated stats
- **UI**: `SupporterStatTracker` component on "Following" tab of Supporter Dashboard
- **Database**: `supporter_stats` table with supporterId, athleteId, eventId, teamId, statName, statValue, period, notes