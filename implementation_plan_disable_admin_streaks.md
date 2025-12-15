# Implementation Plan - Disable Admin Streaks

Goal: Ensure administrators do not have their own streaks or XP gamification elements.

## Proposed Changes

### Backend

#### [MODIFY] [auth.controller.js](file:///c:/Streak/backend/controllers/auth.controller.js)
- In `login` function:
- Add check: `if (user.role === 'admin')` skip all streak calculation logic.
- Ensure `overallStreak` remains unchanged (or 0) for admins.
- Ensure `xpGained` is always 0 for admins.

### Frontend

#### [MODIFY] [Dashboard.tsx](file:///c:/Streak/frontend/src/pages/Dashboard.tsx)
- Hide **XP Badge** in navbar for admins.
- Hide **Royal Pass Card** for admins.
- Hide **Overall Streak Card** for admins.
- *Optionally*: Show a "Welcome Admin" banner instead of the streak card.

## Verification
- **Manual**:
    - Login as Admin.
    - Verify: No XP badge, No Royal Pass card, No Overall Streak card.
    - Verify: Dashboard still shows "All Seasons (Admin View)".
    - Login as User.
    - Verify: All streak elements are visible and functioning.
