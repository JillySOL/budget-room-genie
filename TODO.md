# Project TODO & Suggestions

This file tracks outstanding tasks, bugs, and potential improvements for the BudgetRoomGenie application.

## Outstanding Tasks / Bugs

- [ ] **Implement Photo Deletion:** 
    - Decide on deletion strategy (Storage path needed? How to update Firestore? Confirmation needed?).
    - Add delete button functionality to `PhotoGallery.tsx`.
    - Implement Firebase Storage file deletion.
    - Implement Firestore document updates (e.g., clear `uploadedImageURL`).
- [ ] **Project Detail Page - Dynamic Data:**
    - Replace placeholder `+$18,000 Value` with actual calculated or stored value.
    - Replace placeholder `BATHROOM_SUGGESTIONS` with AI-generated or project-specific suggestions.
    - Implement "Save to My Projects" / "Save to Notebook" functionality (Notebook saves to LocalStorage currently).
    - Implement "Download Results" functionality.
- [ ] **Project List Page - Dynamic Data:**
    - Replace placeholder progress (10% or 50%) with actual project progress.
    - Replace placeholder `Value TBD` with actual value.
    - Replace placeholder `Est. DIY Cost` with actual cost.
- [ ] **Homepage "My Rooms" - Dynamic Data:**
    - Replace placeholder `Value TBD`, `ROI TBD`, and progress (10%) in `RoomProject` component with actual data.
- [ ] **Auth State Handling (Logged Out):**
    - Review pages/components shown when logged out (e.g., `ProjectsPage`, `HomeTabs`) and ensure they display appropriate content (e.g., login prompts) instead of attempting to load user data or showing empty states meant for logged-in users.

## Completed / Recently Done

- [x] **Refactoring:**
    - [x] Extract `getUniquePhotoUrls` to `src/lib/utils.ts`.
    - [x] Create `useUserProjects` hook to fetch project/photo data for `TabsContent.tsx`.
    - [x] Extract `PhotoGallery` component from `TabsContent.tsx`.
    - [x] Extract `ExistingPhotoSelector` component from `OnboardingPage.tsx`.
- [x] **UX/Performance:**
    - [x] Add lazy loading (`loading="lazy"`) to images where possible.
    - [x] Add basic fade-in transitions on data load.
- [x] **Legacy Code Removal:**
    - [x] Remove old AWS (`lambda`, `infrastructure`) folders.
    - [x] Remove Clerk/AWS dependencies and scripts from `package.json`.
    - [x] Remove Clerk env vars from `.env`.
    - [x] Remove `ClerkAuth.tsx`, `env.ts`.
    - [x] Remove Clerk/AWS logic/comments from various components (`Projects.tsx`, `RoomPhotoUpload.tsx`, `ProjectCard.tsx`, `App.tsx`, `BottomNav.tsx`, `TabsContent.tsx`).
    - [x] Fix related errors from merge/cleanup.
- [x] **Navigation:**
    - [x] Update Onboarding back button to go to `/`.
    - [x] Update links pointing to `/new-project` to point to `/onboarding`.
- [x] **Project Detail Page Button Formatting:** Fixed button layout.
- [x] **`.gitignore`:** Added rule for Firebase Admin SDK keys.

## Suggestions & Future Improvements

- **Refactoring:**
    - [ ] Refactor `OnboardingPage.tsx` further (Step 1 sub-component, `handleSaveProject` simplification).
    - [ ] Consolidate Firebase interaction logic further (e.g., dedicated service functions for CRUD operations).
- **Performance:**
    - [ ] **Pagination:** Consider for project/photo fetching if lists become long.
    - [ ] **Image Optimization:** Consider on upload (requires backend/Firebase function).
- **Security:**
    - [ ] **Firestore Security Rules:** Review and tighten rules.
    - [ ] **Storage Security Rules:** Review and tighten rules.
    - [ ] **Environment Variables:** Review client-side exposure.
- **User Experience (UX):**
    - [ ] **Photo Deletion Confirmation:** Add dialog.
    - [ ] **Clearer Loading/Error States:** Improve specificity.
    - [ ] **Onboarding Flow:** Potential refinements.
    - [ ] **Accessibility Audit:**.
- **AI Integration:**
    - [ ] Implement actual AI generation.
    - [ ] Generate AI-based DIY suggestions/costs.
- **Testing:**
    - [ ] Add unit/integration tests. 