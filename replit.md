# Overview

This is a Telegram Mini App called "دنیای قرعه‌کشی" (World of Raffles) with a role-based access control system supporting three user groups: (1) Bot administrators with the ability to set levels and approve/reject raffles, (2) Regular users who can view and participate in raffles based on their access level and various filters, (3) Channel administrators who can submit raffle information forms.

## Recent Changes (August 13, 2025)

### ✅ **CHANNEL URL NAVIGATION SYSTEM COMPLETED**:
- **Fixed Channel URL Usage**: All channel navigation now uses channelUrl field from database instead of constructing from channelId
- **Enhanced Form Validation**: Added strict URL validation for sponsor channel forms requiring https://t.me/ format
- **Database Cleanup**: Fixed invalid channelUrl entries in existing sponsor channels
- **RaffleCard Integration**: Required channels buttons now properly navigate using stored channelUrl values
- **MembershipCard Consistency**: All membership join buttons use channelUrl for proper navigation
- **Removed Fallbacks**: Eliminated channelId-based URL construction to prevent navigation errors
- **Validation Rules**: channelUrl field now enforces proper Telegram channel URL format with validation

### ✅ **TELEGRAM MEMBERSHIP VERIFICATION SYSTEM COMPLETED**:
- **Complete Database Schema**: userSponsorMemberships table with all required fields implemented
- **TelegramBotService Integration**: Comprehensive bot service for real-time membership checking via Telegram API
- **Automated Scheduler**: 15-minute interval membership verification system with selective channel access checking
- **React Components**: MembershipCard and MembershipPage fully integrated with error handling and point tracking
- **API Endpoints**: Complete REST API for membership checking, point rewards, and user membership management
- **Real-time Updates**: Query invalidation system for immediate UI updates after membership changes
- **Security Features**: Protected endpoints with proper authentication and anti-fraud measures
- **Persian UI**: Fully localized interface with RTL support and Telegram-themed design
- **Error Resolution**: All TypeScript/LSP errors resolved, system ready for production deployment

### Testing Guide Created:
- **MEMBERSHIP_TESTING_GUIDE.md**: Comprehensive 10-step testing protocol for complete system validation
- **Bot Configuration**: Step-by-step guide for proper Telegram bot setup with channel admin access
- **API Testing**: Direct endpoint testing procedures for all membership-related functionality
- **Security Validation**: Testing procedures for authentication and anti-fraud measures
- **Troubleshooting**: Common issues and solutions for bot access and membership verification
- ✅ **Major Architecture Simplification**: Merged channel_admin and regular user roles into single unified user type
- ✅ **User Role Restructure**: Now only 2 main user types:
  - `bot_admin` (Level 1: Full access, Level 2: Limited access to Messages + Profile only)
  - `regular` (All users including raffle submission capabilities)
- ✅ **Database Schema Updates**: Removed channel_admin enum, updated user types
- ✅ **Frontend Consolidation**: Removed separate channel-admin page, integrated all features into UserTabsMainPage
- ✅ **API Simplification**: Unified routing logic, removed channel_admin specific endpoints
- ✅ **Role-Based UI**: Regular users now see all features including raffle submission forms
- ✅ **Database Integrity Enhancement**: Fixed raffle deletion to properly clean up related data:
  - Individual and bulk delete now remove participants and seen records first
  - Prevents orphaned data accumulation in database
  - Maintains referential integrity across all related tables
- ✅ **Admin Hierarchy System**: Implemented 3-tier admin access control:
  - **King 👑 (Level 0)**: Centralized King Admin ID management
  - **Level 1 Admin**: Full access except admin management (cannot create/remove admins)
  - **Level 2 Admin**: Limited access - cannot delete raffles or manage sponsors/admins
- ✅ **CENTRALIZED KING ADMIN MANAGEMENT**: Complete centralization of King Admin configuration:
  - **Central Constant**: `KING_ADMIN_TELEGRAM_ID` in shared/schema.ts for single point of change
  - **Helper Functions**: `isKingAdmin()` and `getKingAdminId()` for consistent usage across codebase
  - **Future-Proof**: All hardcoded IDs (9 instances) replaced with helper function calls
  - **Multi-Layer Security**: Application, Database, and API layers all use helper functions
  - **Database Trigger**: Automatically updates with King Admin changes via helper functions
  - **Documentation**: Complete guides for King Admin management (see King Admin Management section below)
- ✅ **ADMIN MANAGEMENT FULLY FUNCTIONAL**: Complete admin panel functionality implemented:
  - **Admin List Display**: Fixed API endpoint mismatch (/api/admin/users?type=bot_admin)
  - **Admin Creation**: Working POST /api/admins endpoint for adding new administrators
  - **Admin Removal**: Fixed DELETE /api/admins/:telegramId endpoint with direct database bypass
  - **Security Protection**: King Admin cannot be removed, admin removal converts to regular user
  - **Frontend Integration**: Query invalidation and error handling for seamless UX
- ✅ **TAB STATE PRESERVATION**: Fixed mutations to preserve current tab state instead of resetting to default:
  - **Removed Page Reloads**: Eliminated window.location.reload() from all admin panel mutations
  - **Query Invalidation**: All mutations now use queryClient.invalidateQueries() for updates
  - **Tab Persistence**: Tabs remain active after mutations (add admin, sponsor channels, approve/reject raffles)
  - **Default Tab Logic**: Default tabs only apply on initial app entry, not after mutations
- ✅ **SMART RAFFLE ORDERING**: Implemented context-aware sorting for optimal admin workflow:
  - **Pending Tab**: Oldest submissions first (FIFO - fair review queue based on createdAt ASC)
  - **Approved/Rejected Tabs**: Newest admin decisions first (recent activity based on updatedAt DESC)
  - **Backend Logic**: Dynamic ORDER BY clause in getRafflesByStatus() based on status parameter
  - **Admin Efficiency**: Admins see oldest pending work first, latest completed work at top
- ✅ **DRAG-AND-DROP SPONSOR CHANNELS**: Complete sortable sponsor channel system:
  - **Frontend Implementation**: SortableChannelItem with @dnd-kit packages for smooth drag-and-drop
  - **Backend API**: /api/sponsor-channels-reorder endpoint for real-time reordering
  - **Database Integration**: displayOrder field with synchronized ordering for admins and users
  - **Visual Feedback**: Drag handle, visual states, and immediate UI updates
  - **Query Invalidation**: Real-time cache updates after reordering mutations
- ✅ **ADMIN LIST ORDERING**: Newest administrators displayed first in admin management tab:
  - **Database Ordering**: getUsersByType() modified to show bot_admin users by createdAt DESC
  - **User Experience**: Recently added administrators appear at top of admin list
  - **Consistent Ordering**: Admin panel shows most recent additions for better management workflow

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Telegram-themed design tokens and RTL support
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Design System**: Custom Telegram-inspired design with Persian fonts and animations

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API with structured route handlers
- **Storage Layer**: Abstracted storage interface with in-memory implementation (can be extended to database)
- **Validation**: Zod schemas for request/response validation
- **Development**: Hot reloading with Vite integration in development mode

## Data Storage Architecture
- **Database**: PostgreSQL with Drizzle ORM for schema management and migrations
- **Connection**: Neon Database serverless PostgreSQL connection
- **Schema Design**: Normalized relational design with tables for users, raffles, participants, and sponsor channels
- **Session Management**: PostgreSQL session storage using connect-pg-simple

## Authentication & Authorization
- **Multi-Method Authentication**: Supports Telegram Web App SDK and Gmail authentication
- **Role-Based Access Control**: Three distinct user roles with different capabilities:
  - `bot_admin`: Bot administrators with full system access and raffle approval rights
  - `channel_admin`: Channel administrators who can submit raffle forms for approval
  - `regular`: Regular users who view and participate in approved raffles
- **Level-Based Content Access**: Users can only see raffles matching their level or below
- **Session Management**: Server-side sessions with PostgreSQL storage

## Key Features Architecture
- **Role-Based User Experience**: Dynamic UI and navigation based on user roles
- **Level-Based Filtering**: Advanced filtering system for raffles (today, seen, joined, favorites, ended)
- **Admin Workflow**: Complete raffle approval workflow with level assignment
- **Channel Admin Interface**: Dedicated form submission system for channel administrators
- **Multi-language Support**: RTL layout with Persian/Farsi localization
- **Progressive Web App**: Mobile-first design optimized for Telegram's Web App environment
- **Real-time Updates**: Query invalidation for live data updates
- **Responsive Design**: Mobile-optimized UI with bottom navigation

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting for production data storage
- **Drizzle ORM**: Type-safe database ORM with migration support

## Telegram Platform
- **Telegram Web App SDK**: Official Telegram SDK for mini app integration
- **Telegram Bot API**: For potential bot interactions and notifications

## UI/UX Libraries
- **Radix UI**: Headless UI components for accessibility and behavior
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Carousel component for content display

## Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind integration

## Validation & Forms
- **Zod**: Runtime type validation for API requests and forms
- **React Hook Form**: Form state management and validation
- **Drizzle Zod**: Integration between Drizzle schemas and Zod validation

## Fonts & Internationalization
- **Google Fonts**: Inter font family for modern typography
- **Font Awesome**: Icon fonts for additional iconography
- **RTL Support**: Built-in right-to-left layout support for Persian language

# King Admin Management System

## 👑 How to Change King Admin

### Simple Method (One Line Change)
To change the King Admin, modify only this line in `shared/schema.ts`:

```typescript
// Line 10 in shared/schema.ts
export const KING_ADMIN_TELEGRAM_ID = "128787773";  // Current ID

// Change to:
export const KING_ADMIN_TELEGRAM_ID = "NEW_TELEGRAM_ID";
```

### Why This Works
The entire system uses helper functions instead of hardcoded values:
- `isKingAdmin(telegramId)` - Check if user is King Admin
- `getKingAdminId()` - Get current King Admin ID

All 9 previously hardcoded locations now automatically update when the constant changes.

### Automatic Updates Include:
- ✅ All security checks in server/storage.ts
- ✅ Authentication logic in server/routes.ts  
- ✅ Database triggers for data protection
- ✅ Any future code using helper functions

## 📋 Development Guidelines for King Admin

### For Future Code Development

**✅ CORRECT Usage:**
```typescript
import { isKingAdmin, getKingAdminId } from "@shared/schema";

// Check if user is King Admin
if (isKingAdmin(userTelegramId)) {
  // King admin logic
}

// Get King Admin ID
const kingId = getKingAdminId();
```

**❌ WRONG Usage (Never Do This):**
```typescript
// Never hardcode IDs
if (userTelegramId === "128787773") { ... }
if (userTelegramId === KING_ADMIN_TELEGRAM_ID) { ... }
```

### Security Features (Bypass Prevention)
- **Application Layer**: All business logic uses helper functions, environment variables disabled
- **Database Layer**: Multiple PostgreSQL triggers prevent King Admin bypass and duplication
- **API Layer**: Authentication endpoints use centralized functions only
- **Environment Override**: ADMIN_TELEGRAM_IDS environment variable bypassing disabled
- **Database Protection**: Cannot manually create second King Admin (security exception)
- **Future-Proof**: New code using helper functions automatically inherits all protections

### The ONLY Way to Change King Admin
1. Modify `KING_ADMIN_TELEGRAM_ID` constant in `shared/schema.ts`
2. That's it - no other method works (all bypasses are blocked)

## 📚 Detailed Documentation Files

### King Admin Management Guides:
- **`KING_ADMIN_CHANGE_GUIDE.md`**: Complete step-by-step guide for changing King Admin safely
- **`FUTURE_KING_ADMIN_USAGE.md`**: Development rules and best practices for future code

### Key Benefits:
1. **Single Point of Change**: Only `shared/schema.ts` needs modification
2. **Automatic Synchronization**: All system components update automatically
3. **Security Guaranteed**: Multi-layer protection remains intact
4. **Developer Friendly**: Clear guidelines prevent mistakes
5. **Maintainable**: Centralized management reduces complexity