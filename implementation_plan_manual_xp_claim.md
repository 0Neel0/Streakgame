# Implementation Plan - Manual XP Claiming

Goal: Prevent automatic XP increase for 5/10 day streaks. Users must manually "Claim" the reward.

## Schema Changes
### [MODIFY] [user.model.js](file:///c:/Streak/backend/models/user.model.js)
- Add `unclaimedRewards` array field:
  ```json
  [
    {
      "xp": 50,
      "reason": "5 Day Streak (Global)",
      "date": "2024-12-15..."
    }
  ]
  ```

## Backend Logic Changes
### [MODIFY] [auth.controller.js](file:///c:/Streak/backend/controllers/auth.controller.js)
- In `login`:
    - Instead of `user.xp += xpGained`, `push` to `user.unclaimedRewards`.
    - Detect 5/10 day milestones for *Overall Streak*.
- Add `claimReward` controller function:
    - Pops a reward (or specific one) from `unclaimedRewards`.
    - Adds XP to `user.xp`.
    - Returns updated user and XP gained.

### [MODIFY] [streak.service.js](file:///c:/Streak/backend/services/streak.service.js)
- In `checkInUserToSeason`:
    - Detect 5/10 day milestones for *Season Streak*.
    - Push to `user.unclaimedRewards` instead of direct XP add.
    - Note: The `checkInUserToSeason` function modifies the user document but might not save it if the caller does? No, it calls `user.save()`.

## API Routes
### [MODIFY] [auth.route.js](file:///c:/Streak/backend/routes/auth.route.js)
- Add `POST /claim-reward`.

## Frontend Changes
### [MODIFY] [Dashboard.tsx](file:///c:/Streak/frontend/src/pages/Dashboard.tsx)
- Check `user.unclaimedRewards`.
- If rewards exist, display a "Claim Reward" card or button (replacing the auto-popup logic).
- On click -> Call `/claim-reward` -> Show XP Level Up animation.

## Verification
- Login on day 5. Verify XP doesn't jump.
- Check explicit "Claim" button appears.
- Click Claim -> XP increases.
