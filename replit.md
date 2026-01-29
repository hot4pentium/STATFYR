# STATFYR - Sports Stats & Team Management

## Overview
STATFYR is a comprehensive platform designed for sports team management, catering to coaches, athletes, and supporters. Its primary purpose is to streamline team administration, enhance player development, and foster community engagement. Key capabilities include managing team rosters, scheduling events, tracking performance statistics, designing playbooks, and facilitating team communication. The platform supports role-based access, offering distinct functionalities for coaches, staff, athletes, and supporters. The long-term vision is to become the leading digital ecosystem for amateur and professional sports teams, offering advanced analytics, interactive fan experiences, and integrated sports education.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Architecture
STATFYR employs a modern web application architecture with a clear separation of frontend and backend concerns. The frontend is built with React 18 and TypeScript, utilizing Wouter for routing, TanStack React Query for server state management, and React Context for local state. Styling is handled by Tailwind CSS with shadcn/ui. The backend is developed using Express.js with TypeScript, interfacing with a PostgreSQL database via Drizzle ORM. Zod is used for schema validation. Authentication is a dual system combining Replit Auth (OAuth2) with a legacy email/password system.

### Key Features
-   **Role-Based Access Control**: Differentiated access levels for Coaches, Staff, Athletes, and Supporters, with varying permissions for dashboard management, content creation, and data viewing.
-   **Video Highlights System**: Allows upload, transcoding (FFmpeg), and storage of team video highlights.
-   **Playbook System**: A canvas-based play designer (PlayMaker) for coaches to create and manage plays. Features split offense/defense half-field views with toggle, portrait-only mode with landscape rotation prompt, and saves both halves together. Sports: Basketball, Football, Soccer, Baseball, Volleyball (alphabetized).
-   **StatTracker System**: Enables live game statistics tracking, offering individual and team modes with sport-specific presets.
-   **Live Engagement Sessions (Game Day Live)**: Facilitates real-time supporter interaction during live events through shoutouts and taps.
-   **Badge & Theme System**: Rewards supporter engagement with badges that unlock custom dashboard themes.
-   **Season Management**: Coaches can start and end seasons for teams, which archives historical data such as team records, top performers, and supporter engagement metrics. A dedicated Season History page allows reviewing past season data. Independent supporters managing athletes (without team codes) can also start/end seasons for their managed athletes, with stats and events archived to a separate supporter_season_archives table. The SupporterSeasonHistoryPage displays archived season data for managed athletes.
-   **Shareable Athlete Profiles**: Publicly accessible profiles showcasing athlete stats, highlights, and recent interactions, with deep-linking capabilities for "HYPE Post Spotlight Modals".
-   **Admin Dashboard & Messaging**: Provides super-admins with tools for managing users, teams, and sending broadcast or direct messages, optionally via push notifications.
-   **Notification System**: Comprehensive push (Firebase Cloud Messaging) and email (Resend API) notification system for chat messages, pre-game reminders, and HYPE posts. Includes unread message indicators.
-   **Subscription System & Entitlements**: A tiered subscription model (Coach Pro, Athlete Pro, Supporter Pro, Free) integrated with Stripe, providing granular feature access based on user role and subscription status. Includes supporter athlete following (free for same-team, paid for cross-team) and supporter-fallback stat tracking.
-   **PWA Features & Native Integrations**: Progressive Web App capabilities for offline support and updates. Capacitor integration for native iOS/Android features like camera, native share, biometric authentication, background sync, haptic feedback, and app badge management.

### UI/UX and Theming
The frontend utilizes shadcn/ui (New York style) with Tailwind CSS for a modern aesthetic. `next-themes` provides dark/light mode functionality. Fonts include Inter and Oswald.

### Data Model
The core data model revolves around Users, Teams, TeamMembers, and HighlightVideos, with extensive relational structures for stats, events, and subscriptions.

## External Dependencies

-   **PostgreSQL**: Primary database for all application data.
-   **Drizzle ORM**: Type-safe ORM for interacting with PostgreSQL.
-   **shadcn/ui**: UI component library based on Radix UI and Tailwind CSS.
-   **Lucide React**: Icon library for the user interface.
-   **Recharts**: Library for data visualization.
-   **Embla Carousel**: Carousel component for UI elements.
-   **Vite**: Frontend build tool.
-   **esbuild**: Backend bundling.
-   **tsx**: TypeScript execution environment.
-   **Firebase Cloud Messaging (FCM)**: For cross-platform push notifications.
-   **FFmpeg**: Used for video transcoding of highlights.
-   **Replit App Storage (GCS-backed)**: Cloud storage solution for video files.
-   **Replit Auth**: OAuth2 provider for user authentication (Google, GitHub, X, Apple, email/password).
-   **Stripe**: Payment gateway for managing subscriptions and payments.
-   **Resend API**: Email notification service.
-   **Capacitor**: Framework for building native mobile applications using web technologies, integrating with various native device features (Camera, Share, Biometrics, Haptics, etc.).