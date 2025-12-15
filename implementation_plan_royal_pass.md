# Implementation Plan - Royal Pass Feature

Goal: Allow users to claim a "Royal Pass" (+200 XP) if they have achieved at least 3 streaks in 3 separate seasons.

## Proposed Changes

### Backend

#### [MODIFY] [user.model.js](file:///c:/Streak/backend/models/user.model.js)
- Add `hasClaimedRoyalPass` (Boolean, default: false) to `UserSchema`.

#### [MODIFY] [auth.controller.js](file:///c:/Streak/backend/controllers/auth.controller.js)
- Create `claimRoyalPass` function:
    - Logic:
        - Check if `hasClaimedRoyalPass` is true -> Return Error.
        - Filter `user.seasonStreaks`: `s.streak >= 3`.
        - If count >= 3:
            - `user.xp += 200`
            - `user.hasClaimedRoyalPass = true`
            - Save & Return success + xpGained.
        - Else -> Return Error "Requirements not met".

#### [MODIFY] [auth.route.js](file:///c:/Streak/backend/routes/auth.route.js)
- Add POST `/claim-royal-pass` route (protected).

### Frontend

#### [MODIFY] [AuthContext.tsx](file:///c:/Streak/frontend/src/context/AuthContext.tsx)
- Update `User` interface to include `hasClaimedRoyalPass`.

#### [MODIFY] [Dashboard.tsx](file:///c:/Streak/frontend/src/pages/Dashboard.tsx)
- Add a new "Royal Pass" Card component/section.
- **UI Logic**:
    - **Locked**: Logic check fails (Calculated on frontend for display, but enforced on backend).
        - Show progress: "Progress: X/3 Seasons".
    - **Available**: Logic passes & `!hasClaimedRoyalPass`.
        - Button: "Claim Royal Pass (+200 XP)".
    - **Claimed**: `hasClaimedRoyalPass` is true.
        - Display "Royal Pass Active/Owned".
- **Interaction**:
    - Clicking Claim calls API.
    - On success: Show `XPPopup` (xp={200}), refresh user.

## Verification
- **Manual**:
    - Modify a user in DB to have 3 season streaks of 3+.
    - Verify "Claim" button appears.
    - Click Claim -> Verify +200 XP popup.
    - Verify button changes to "Owned".
    - Modify user to have only 2 valid streaks -> Verify "Locked".
