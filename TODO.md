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
    - Implement "Save to My Projects" / "Save to Notebook" functionality.
- [ ] **Project List Page - Dynamic Data:**
    - Replace placeholder progress (10%) with actual project progress.
    - Replace placeholder `Value TBD` with actual value.
- [ ] **Homepage "My Rooms" - Dynamic Data:**
    - Replace placeholder `Value TBD`, `ROI TBD`, and progress (10%) in `RoomProject` component with actual data.

## Suggestions & Future Improvements

- **Refactoring:**
    - [ ] Extract `getUniquePhotoUrls` from `TabsContent.tsx` into a utility file (e.g., `src/lib/utils.ts`).
    - [ ] Refactor `OnboardingPage.tsx`: 
        - Extract Step 1 (Photo Upload/Selection) into a sub-component.
        - Simplify `handleSaveProject` logic, potentially breaking down steps.
    - [ ] Consolidate Firebase interaction logic (fetching projects, photos, etc.) into dedicated service functions/hooks (e.g., `src/hooks/useProjects.ts`).
- **Performance:**
    - [ ] **Lazy Loading:** Implement lazy loading for images, especially in the `PhotoGallery` and potentially project lists, to improve initial load times.
    - [ ] **Pagination:** If users can have many projects, implement pagination for fetching all projects in `TabsContent.tsx` (for "My Photos") and potentially on the `ProjectsPage.tsx`.
    - [ ] **Image Optimization:** Consider automatically resizing/optimizing images on upload to reduce storage costs and improve loading speed (requires backend/Firebase function).
- **Security:**
    - [ ] **Firestore Security Rules:** Review and tighten Firestore security rules to ensure users can only read/write their own data. Pay close attention to rules for the `projects` collection.
    - [ ] **Storage Security Rules:** Review and tighten Firebase Storage security rules to ensure users can only upload/delete their own photos and that file types/sizes are restricted.
    - [ ] **Environment Variables:** Ensure sensitive keys (like `VITE_CLERK_SECRET_KEY`, `VITE_FIREBASE_API_KEY`) are not exposed client-side if they aren't strictly needed there. Consider moving backend-related keys to a secure backend environment.
- **User Experience (UX):**
    - [ ] **Photo Deletion Confirmation:** Add a confirmation dialog before deleting a photo.
    - [ ] **Clearer Loading/Error States:** Provide more specific feedback during loading or when errors occur.
    - [ ] **Onboarding Flow:** Potentially refine the multi-step onboarding for better clarity.
    - [ ] **Accessibility:** Perform an accessibility audit (keyboard navigation, screen reader support, color contrast).
- **AI Integration:**
    - [ ] Implement actual AI generation for the "after" image based on user input (style, budget, etc.).
    - [ ] Generate AI-based DIY suggestions/cost estimates. 