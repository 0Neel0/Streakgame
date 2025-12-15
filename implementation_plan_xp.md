# Implementation Plan - Display User XP

The goal is to display the user's current XP on the Dashboard.

## Proposed Changes

### Frontend

#### [MODIFY] [AuthContext.tsx](file:///c:/Streak/frontend/src/context/AuthContext.tsx)
- Update `User` interface to include `xp?: number;`.

#### [MODIFY] [Dashboard.tsx](file:///c:/Streak/frontend/src/pages/Dashboard.tsx)
- Add a visual element to display `user.xp` near the user's welcome message or streak stats.
- Style it with a Trophy icon and a gold/yellow color scheme.

## Verification
- **Manual**: Log in, check the dashboard, and verify the XP count matches what is expected (from previous check-ins).
