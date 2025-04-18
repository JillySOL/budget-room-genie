# Project TODO & Suggestions

This file tracks outstanding tasks, bugs, and potential improvements for the BudgetRoomGenie application.

## Outstanding Tasks / Bugs

- [ ] **Firebase Functions (AI Integration) Debugging:**
    - Function `generateRenovationSuggestions` was deployed but not triggered when creating new projects.
    - Investigate why the Cloud Function isn't running - check Firestore triggers, permissions, and logs.
    - Test manually triggering the function or modify to use HTTP triggers for testing.
    - Check Firebase console logs for any errors or permission issues.
- [ ] **Fix UI Image Loading Issues:**
    - While image loading was improved, some users still report issues with the slider and DIY section images.
    - Consider implementing lazy loading or progressive image loading for better performance.
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
    - Review pages/components shown when logged out (e.g., `ProjectsPage`, `HomeTabs`) and ensure they display appropriate content (e.g., login prompts) instead of attempting to load user data or showing empty states meant for logged-in users. *(Partially addressed by protecting `/onboarding`)*.

## Completed / Recently Done

- [x] **Firebase Functions Development:**
    - [x] Deployed Cloud Functions with support for Vertex AI integration.
    - [x] Fixed ESLint and TypeScript configuration issues in Functions.
    - [x] Successfully set up Firebase Functions v2 environment.
    - [x] Created Gemini Pro Vision API integration for analyzing room photos.
- [x] **UI Fixes:**
    - [x] Added error handling and fallbacks for image loading.
    - [x] Improved Before/After slider component with better error states.
    - [x] Fixed image paths and added preloading for better performance.
- [x] **Onboarding & Authentication Flow:**
    - [x] Reordered onboarding steps (Photo Upload last).
    - [x] Removed logic for saving/resuming onboarding progress for unauthenticated users via `localStorage`.
    - [x] Protected the `/onboarding` route, requiring users to log in first.
    - [x] Ensured login page (`/login`) includes the main layout/navigation.
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
    - [ ] Refactor `OnboardingPage.tsx` further (e.g., Step components, `handleSaveProject` simplification).
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
    - [ ] **Onboarding Flow Refinement:** Revisit the login requirement. Consider implementing temporary unauthenticated uploads + Cloud Function for association later (Option 2 from discussion) to improve UX if forcing early login is undesirable long-term.
    - [ ] **Accessibility Audit:**.
- **AI Integration:**
    - [x] Implement Vertex AI integration with Firebase Functions.
    - [ ] Debug and fix Cloud Function triggers for automatic AI processing.
    - [ ] Add real-time status updates during AI processing.
    - [ ] Implement image generation with Imagen.
- **Testing:**
    - [ ] Add unit/integration tests. 