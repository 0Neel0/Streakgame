# Implementation Plan - Season Streak XP

Goal: Award +30 XP for every 3 days of a season-specific streak.

## Proposed Changes

### Backend

#### [MODIFY] [streak.service.js](file:///c:/Streak/backend/services/streak.service.js)
- inside `checkInUserToSeason` function:
    - After `streak` is incremented/calculated.
    - Logic: `if (streak > 0 && streak % 3 === 0) xpGained = 30;`
    - `user.xp += xpGained;`
    - Return `xpGained` in the result object.

### Frontend

#### [MODIFY] [Dashboard.tsx](file:///c:/Streak/frontend/src/pages/Dashboard.tsx)
- In `handleLoginSubmit`:
    - Capture `xpGained` from `loginRes` (Global).
    - Capture `xpGained` from `checkinRes` (Season).
    - Sum them: `totalXp = (loginRes.data.xpGained || 0) + (checkinRes.data.xpGained || 0)`.
    - If `totalXp > 0`, set state and show popup.

## Verification
- **Manual**:
    - Manually adjust a user's season streak in DB to 2.
    - Check-in to make it 3.
    - Verify +30 XP popup.
    - Check if global streak also triggers (e.g. at 5/10 days), verify sum.
