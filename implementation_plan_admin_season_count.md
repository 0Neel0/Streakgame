# Implementation Plan - Admin Season User Count

Goal: Show the number of participating users in each season for Admins, instead of a meaningless streak count.

## Proposed Changes

### Backend

#### [MODIFY] [season.controller.js](file:///c:/Streak/backend/controllers/season.controller.js)
- Update `getActiveSeasons` (and optionally `getAllSeasons` if used) to include a `userCount` field.
- Use an aggregation pipeline or `Promise.all` with `User.countDocuments` to count users who have a streak entry for each season.
    - Query: `User.countDocuments({ 'seasonStreaks.seasonId': season._id })`

### Frontend

#### [MODIFY] [Dashboard.tsx](file:///c:/Streak/frontend/src/pages/Dashboard.tsx)
- In the `activeSeasons.map` loop:
    - If `user.role === 'admin'`:
        - Display `season.userCount` (or fetched count).
        - Label: "Users" (instead of "Day Streak").
    - Else (Regular User):
        - Keep existing Streak display.

## Verification
- **Manual**:
    - Login as Admin.
    - Check the "All Seasons (Admin View)" cards.
    - Verify they show a number representing users (e.g., "5 Users") instead of "0 Day Streak".
    - Login as User.
    - Verify they still see their own Streak count.
