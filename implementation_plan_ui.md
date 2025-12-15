# Implementation Plan - XP Popup UI Enhancement

The goal is to elevate the `XPPopup` UI to a premium standard, adding sophisticated animations and refining the aesthetic.

## Proposed Changes

### Frontend

#### [MODIFY] [XPPopup.tsx](file:///c:/Streak/frontend/src/components/XPPopup.tsx)
- **Visual Design**:
    - Change background to a deep, rich gradient (e.g., violet/gold mix) with a glassmorphic overlay.
    - Add a glowing backdrop effect.
- **Animations**:
    - **Entry**: Smooth spring animation with simultaneous opacity and scale.
    - **Idle**: Floating/bobbing icon animation.
    - **Claim (Exit)**:
        - **Particles**: Generate 10-12 small "confetti" particles (divs with motion) that explode outwards from the center.
        - **Text Impact**: Scale the "+XP" text drastically with a "shockwave" ring effect.
- **Typography**: Use more stylized weights and tracking for "Level Up" and XP amount.

## Verification
- **Manual Preview**: 
    - Use the existing "Test XP" button on the Dashboard.
    - Observe the entry animation, idle float, and the claim explosion.
