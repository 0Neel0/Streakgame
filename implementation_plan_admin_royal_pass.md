# Implementation Plan - Admin Royal Pass Display

Goal: Display which users have claimed the Royal Pass in the Admin Panel.

## Proposed Changes

### Backend

#### [MODIFY] [admin.controller.js](file:///c:/Streak/backend/controllers/admin.controller.js)
- Update `getAllUsers` function.
- Ensure the database query explicitly selects or includes the `hasClaimedRoyalPass` field (if `select` is used) or rely on default returns (likely default works if no exclusion).
- *Based on inspection, if I see detailed select, I will update it.*

### Frontend

#### [MODIFY] [Admin.tsx](file:///c:/Streak/frontend/src/pages/Admin.tsx)
- Import `Crown` from `lucide-react`.
- Update `StreakUser` interface to include `hasClaimedRoyalPass?: boolean`.
- In the User List rendering:
    - Add a visual indicator (e.g., small gold Crown icon) next to the username or XP for users with `hasClaimedRoyalPass === true`.

## Verification
- **Manual**:
    - Login as Admin.
    - View "User Streaks" list.
    - Verify that users who have claimed the pass (tested previously) show the Crown icon.
    - Users without the pass should not show the icon.
