# XP Reward System Implementation

I have implemented an XP reward system where users gain XP for hitting streak milestones.

## Changes

### Backend
- **User Model (`backend/models/user.model.js`)**: Added `xp` field (default 0).
- **Streak Service (`backend/services/streak.service.js`)**: Removed XP calculation logic (moved to Login).
- **Auth Controller (`backend/controllers/auth.controller.js`)**: 
  - Implementation of recurring XP calculation logic.
  - Awards **+50 XP** for every 5 days of overall streak (e.g., 5, 15, 25).
  - Awards **+100 XP** for every 10 days of overall streak (e.g., 10, 20, 30).
  - Returns `xpGained` in the login response.

### Frontend
- **XP Popup Component (`frontend/src/components/XPPopup.tsx`)**: 
  - **Premium UI**: Implemented a dark glassmorphic design with gradient borders and abstract background blobs.
  - **Interactive Animation**: 
    - **Particles**: A confetti explosion effect upon claiming.
    - **Shockwave**: A pulsing ring animation emphasizes the XP gain.
    - **Transitions**: Smooth spring-based entry and exit animations.
- **Profile Management (`frontend/src/components/ProfileModal.tsx`)**: 
  - **Edit Profile**: Modal to update username, description, and profile picture (via URL).
  - **Dashboard Integration**: Profile button displaying user avatar and name.
- **Season Details (`frontend/src/pages/SeasonDetails.tsx`)**: Integrated XP popup to show when a user checks in and receives a reward.
- **Dashboard (`frontend/src/pages/Dashboard.tsx`)**: Integrated XP popup for check-ins performed from the dashboard modal.
- **Admin Dashboard (`frontend/src/pages/Admin.tsx`)**: Added an "XP" column to the user list to allow admins to view total accumulated XP.
- **Auth Context (`frontend/src/context/AuthContext.tsx`)**: Updated `User` interface to include `xp`.
- **Dashboard UI**: Added an XP badge in the top navigation bar to show the user's current XP.

## Verification

### Check-in / Login Flow
1. User clicks "Login to Season" (Check-in).
2. Backend authenticates and updates **Overall Streak**.
3. If Overall Streak hits 5 or 10, `xpGained` is returned in the login response.
4. Frontend detects `xpGained > 0` and displays the `XPPopup`.

### User View (Dashboard)
- Users see their total XP streak in the top right corner (gold badge).

### Admin View
- Admins can now see the total XP for each user in the "User Streaks" section of the Admin Dashboard.

## Royal Pass Implementation

### Concept
A high-tier reward system to encourage engagement across multiple seasons.
- **Requirement**: Achieve a streak of at least **3 days** in **3 different seasons**.
- **Reward**: **+200 XP** one-time bonus.

### Implementation
- **Backend**:
  - `hasClaimedRoyalPass` flag in User model.
  - `/auth/claim-royal-pass` endpoint validates the 3-season/3-streak requirement.
- **Frontend**:
  - **Royal Pass Card** (Dashboard):
    - **Progress State**: Shows "X/3 Seasons" if criteria not met.
    - **Claim State**: Shows "Claim +200 XP" button w/ Crown icon if eligible.
    - **Active State**: Shows "Pass Active" if already claimed.

