# Implementation Plan - Interactive XP Claim Animation

The goal is to animate the XP increase when the user clicks "Claim Reward".

## Proposed Changes

### Frontend

#### [MODIFY] [XPPopup.tsx](file:///c:/Streak/frontend/src/components/XPPopup.tsx)
- **State Management**: Add a `isClaiming` or `animationState` to track if the claim animation is playing.
- **Button Action**: Update "Claim Reward" button to set `isClaiming = true` instead of calling `onClose` immediately.
- **Animation Logic**: 
    - When `isClaiming` is true:
        - Animate the reward text (e.g., scale up, bounce).
        - Show extra particle effects (using `Sparkles` or simple divs).
        - Hide or disable the "Claim Reward" button.
    - use `setTimeout` to call `onClose` after the animation completes (approx 1.5s).

## Verification
- **Manual**: 
    - Trigger the popup (by logging in with a streak milestone).
    - Click "Claim Reward".
    - Verify animation plays (visual feedback).
    - Verify popup closes automatically after animation.
