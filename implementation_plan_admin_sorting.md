# Implementation Plan - Admin User Sorting

Goal: Allow admins to sort the user list by Overall Streak and XP.

## Proposed Changes

### Frontend

#### [MODIFY] [Admin.tsx](file:///c:/Streak/frontend/src/pages/Admin.tsx)
- Add state: `sortBy: 'default' | 'streak' | 'xp'` (default is usually ID or username, initially fetched order).
- Add state: `sortOrder: 'desc'` (default descending for high scores).
- Add a utility function `getSortedUsers()`:
    - If `viewRoyalPass` is active, filter first.
    - Sort based on `sortBy` state.
    - If `streak`: sort by `overallStreak`.
    - If `xp`: sort by `xp`.
- Add UI Controls (Dropdown or simple Button Toggle) next to the Royal Pass filter.
    - Button: "Sort: Default", "Sort: Streak", "Sort: XP".

## Verification
- **Manual**:
    - Login as Admin.
    - Click "Sort by Streak" -> Verify users with higher streaks appear first.
    - Click "Sort by XP" -> Verify users with higher XP appear first.
    - Toggle "Royal Pass Only" and verify sorting still works within that filtered list.
