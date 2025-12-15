# Implementation Plan - User Profile Management

The goal is to allow users to update their username, profile picture (via URL), and description.

## Proposed Changes

### Backend

#### [MODIFY] [user.model.js](file:///c:/Streak/backend/models/user.model.js)
- Add `profilePicture` (String, default: '')
- Add `description` (String, default: '')

#### [MODIFY] [auth.controller.js](file:///c:/Streak/backend/controllers/auth.controller.js)
- Create `updateProfile` function.
    - Updates: username, profilePicture, description.
    - Validate uniqueness if checking username change (optional for improved UX).
    - Handle empty fields properly.

#### [MODIFY] [auth.route.js](file:///c:/Streak/backend/routes/auth.route.js)
- Add PUT `/update` (or `/profile`) route shielded by `verifyToken`.

### Frontend

#### [MODIFY] [AuthContext.tsx](file:///c:/Streak/frontend/src/context/AuthContext.tsx)
- Update `User` interface to include `profilePicture` and `description`.
- Ensure `refreshUser` fetches these new fields.

#### [NEW] [ProfileModal.tsx](file:///c:/Streak/frontend/src/components/ProfileModal.tsx)
- Create a reusable modal component for editing profile.
- Fields:
    - Username (Edit text)
    - Profile Picture (Input URL) - *Simplest generic approach*
    - Description (Textarea)
- "Save Changes" button calls the new update endpoint.

#### [MODIFY] [Dashboard.tsx](file:///c:/Streak/frontend/src/pages/Dashboard.tsx)
- Add a "Profile" button (or make the user greeting clickable).
- Render `ProfileModal` when clicked.
- Display `profilePicture` (or generic avatar) in the top nav.

## Verification
- **Manual**:
    - Open Dashboard.
    - Click Profile.
    - Change Username -> Save -> Verify change in UI.
    - Add Description -> Save -> Verify persistence.
    - Add Image URL -> Save -> Verify image displays.
