# RenoMate - Technical Guide for Junior Engineers

## 1. Project Overview

**Goal:** RenoMate is a web application that allows users to upload a photo of a room, specify desired renovation styles or changes, and receive an AI-generated image visualizing the potential outcome.

**Current Status:**
*   **Frontend:** React application built with Vite, using React Router for navigation, Tailwind CSS and Shadcn UI for styling. Hosted on Vercel.
*   **Authentication:** User authentication is implemented using Clerk. Sign-in, sign-up, and profile management flows are functional.
*   **Core Idea:** The basic concept involves image upload, calling an AI service (like OpenAI's ChatGPT-4o or DALL-E 3), and displaying results.
*   **To Be Implemented:** The core backend logic involving AWS services (S3, Lambda) and the OpenAI API integration, along with the **Project Creation Flow** and result display.

**Target Users:** Homeowners, DIY enthusiasts, interior designers looking for quick renovation visualizations.

## 2. System Architecture

Here's a high-level overview of the planned architecture:

```mermaid
graph LR
    A[User Browser (React App on Vercel)] -- 1. Selects/Uploads Image --> A;
    A -- 2. Request Pre-signed URL (if uploading) --> B(API Gateway);
    B -- 3. Trigger Lambda A --> C[Lambda A (GeneratePresignedUrl)];
    C -- 4. Generate URL --> B;
    B -- 5. Return Pre-signed URL --> A;
    A -- 6. Upload Image Directly (if uploading) --> D[AWS S3 Bucket (uploads/ prefix)];
    A -- 7. Collect Project Details (Room Type, Style, Instructions) --> A;
    A -- 8. Call Start Generation API --> B;
    B -- 9. Trigger Lambda B --> E[Lambda B (ProcessImage & OpenAI)];
    E -- 10. Get Image from S3 --> D;
    E -- 11. Call OpenAI API (with image & project details) --> F[OpenAI API (GPT-4o/DALL-E)];
    F -- 12. Return Generated Image Data --> E;
    E -- 13. Save Result Image --> G[AWS S3 Bucket (results/ prefix)];
    E -- 14. (Optional) Update Status --> H[(Optional) DynamoDB Table];
    A -- 15. Poll for Status/Result (via API Gateway) --> B;
    B -- 16. Trigger Lambda C --> I[Lambda C (GetStatus/Result)];
    I -- 17. Check S3/DynamoDB --> G;
    I -- 18. Return Result URL/Status --> B;
    B -- 19. Return Result URL/Status --> A;
    A -- 20. Display Generated Image --> A;

    subgraph AWS Cloud
        B; C; D; E; G; H; I;
    end

    subgraph External Services
        F;
    end

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#ccf,stroke:#333,stroke-width:2px
    style C fill:#ff9,stroke:#333,stroke-width:1px
    style D fill:#9cf,stroke:#333,stroke-width:1px
    style E fill:#ff9,stroke:#333,stroke-width:1px
    style F fill:#cff,stroke:#333,stroke-width:2px
    style G fill:#9cf,stroke:#333,stroke-width:1px
    style H fill:#c9f,stroke:#333,stroke-width:1px
    style I fill:#ff9,stroke:#333,stroke-width:1px
```

**Explanation:**

1.  **Frontend (User Browser):** The React application. Handles UI, user input (including image selection/upload and **project details**), authentication (Clerk), and interacts with the backend.
2.  **API Gateway:** Acts as the secure entry point for all backend requests from the frontend. Routes requests to the appropriate Lambda functions.
3.  **Lambda A (GeneratePresignedUrl):** Generates a secure, temporary URL that allows the frontend to upload a file directly to a specific location in the S3 bucket without needing AWS credentials embedded in the browser.
4.  **S3 Bucket:** Stores original uploaded images (`uploads/` prefix) and AI-generated results (`results/` prefix).
5.  **Lambda B (ProcessImage & OpenAI):** Triggered by API Gateway (`POST /start-generation`). This function receives the S3 key of the uploaded image and the **project details** (room type, style, instructions) from the request body. It fetches the image from S3, calls the OpenAI API with the image and details, and saves the result back to the S3 `results/` prefix.
6.  **OpenAI API:** External service used for AI image generation based on the input image and **user-provided project details**.
7.  **(Optional) DynamoDB:** A NoSQL database to track the status of generation jobs (e.g., `PENDING`, `PROCESSING`, `COMPLETE`, `FAILED`), associate uploads with users, store result metadata, etc. This is useful for polling.
8.  **Lambda C (GetStatus/Result):** Triggered by API Gateway when the frontend polls for the result. Checks DynamoDB or S3 to see if the generation is complete and returns the status or the URL of the generated image.

## 3. Remaining Tasks

These tasks should be tackled sequentially where dependencies exist. Each task should be developed on a separate feature branch.

**Task 1: AWS Setup - S3 Bucket & CORS** `[COMPLETED]`
*   **Goal:** Create and configure the S3 bucket for image storage.
*   **Steps:**
    *   `[x]` Create an S3 bucket (`renomate-uploads-jp-12` in `ap-southeast-2`).
    *   `[x]` Keep "Block all public access" settings ON.
    *   `[x]` Configure CORS correctly for Vercel and localhost.
    *   `[ ]` *(Optional)* Configure lifecycle rules.
*   **Why CORS?** Web browsers enforce security policies that prevent scripts on your Vercel domain from making requests to other domains (like your S3 bucket's domain) unless that other domain explicitly allows it via CORS headers.

**Task 2: AWS Setup - IAM Roles & User** `[IN PROGRESS]`
*   **Goal:** Set up necessary permissions securely using the principle of least privilege.
*   **Steps:**
    *   `[IN PROGRESS]` **Vercel Deployment User:** Review permissions for the user associated with Vercel environment keys (`VITE_AWS_ACCESS_KEY_ID`, `VITE_AWS_SECRET_ACCESS_KEY`). Aim to restrict permissions later to only `execute-api:Invoke` for specific API Gateway endpoints.
    *   `[IN PROGRESS]` **Lambda Execution Roles:**
        *   `Lambda A (GeneratePresignedUrl)` Role:
            *   `[x]` Basic Role created (`RenoMate-GeneratePresignedUrl-LambdaRole`) with `AWSLambdaBasicExecutionRole` attached.
            *   `[x]` Add specific `s3:PutObject` permission for the `uploads/*` prefix via inline policy (`S3PutObjectUploadsPrefix`).
        *   `Lambda B (ProcessImage & OpenAI)` Role:
            *   `[x]` Basic Role created (`RenoMate-ProcessImage-LambdaRole`) with `AWSLambdaBasicExecutionRole` attached.
            *   `[ ]` Add `s3:GetObject` permission for `uploads/*`.
            *   `[ ]` Add `s3:PutObject` permission for `results/*`.
            *   `[ ]` Add permission to access OpenAI API key (e.g., `secretsmanager:GetSecretValue`).
            *   `[ ]` *(Optional)* Add DynamoDB permissions (`dynamodb:PutItem`, `dynamodb:UpdateItem` if storing job status/details).
        *   `Lambda C (GetStatus/Result)` Role:
            *   `[x]` Basic Role created (`RenoMate-GetStatusResult-LambdaRole`) with `AWSLambdaBasicExecutionRole` attached.
            *   `[ ]` *(Optional)* Add DynamoDB permission (`dynamodb:GetItem`).
            *   `[ ]` Add S3 permission (`s3:GetObject` or `s3:HeadObject`) for `results/*` if not using DynamoDB, or if providing pre-signed GET URLs.
*   **Security:** Never hardcode credentials. Use IAM roles for Lambda functions. Store sensitive keys like the OpenAI API key in AWS Secrets Manager or Systems Manager Parameter Store (and grant the Lambda role access).

**Task 3: AWS Setup - Lambda Functions** `[IN PROGRESS]`
*   **Goal:** Create the backend logic functions. Choose a runtime (Node.js or Python are good choices).
*   **NOTE:** Lambda function code is primarily managed and deployed directly within the AWS Console/environment, not necessarily checked into this repository. **Future:** Consider IaC (like CDK or Terraform) for managing AWS resources including Lambda code deployment.
*   **Steps:**
    *   **Runtime Chosen:** Node.js 20.x
    *   **Lambda A (GeneratePresignedUrl):**
        *   `[x]` Function `RenoMate-GeneratePresignedUrl` created (Node.js 20.x).
        *   `[x]` Role `RenoMate-GeneratePresignedUrl-LambdaRole` assigned.
        *   `[x]` API Gateway trigger configured (`POST /generate-upload-url`).
        *   `[COMPLETED]` Implemented and deployed code logic. Requires Clerk JWT Authorizer attached in API Gateway (See Task 4).
    *   **Lambda B (ProcessImage & OpenAI):**
        *   `[x]` Function `RenoMate-ProcessImage` created (Node.js 20.x).
        *   `[x]` Role `RenoMate-ProcessImage-LambdaRole` assigned.
        *   `[REVISED]` API Gateway trigger added (`POST /start-generation`) (See Task 4). Remove S3 trigger if direct API invocation is preferred.
        *   `[ ]` Add required IAM permissions to Role (S3 Get/Put, Secrets Manager, DynamoDB optional).
        *   `[ ]` Implement code logic to:
            *   Receive image `key` and `projectDetails` (roomType, style, budget, renovationType) from API Gateway event body.
            *   Fetch image from S3 using the `key`.
            *   Retrieve OpenAI API Key from Secrets Manager.
            *   Construct prompt/request for OpenAI API using image and `projectDetails`.
            *   Call OpenAI API (e.g., GPT-4o Vision or DALL-E).
            *   Generate both an "after" image AND DIY improvement suggestions with cost estimates.
            *   Save generated image to `results/{userId}/{jobId}/result.png` in S3.
            *   Save DIY suggestions to DynamoDB along with project metadata.
            *   (Optional) Update job status in DynamoDB.
            *   Return a `jobId` (or relevant identifier) to the frontend.
    *   **Lambda C (GetStatus/Result):**
        *   `[x]` Function `RenoMate-GetStatusResult` created (Node.js 20.x).
        *   `[x]` Role `RenoMate-GetStatusResult-LambdaRole` assigned.
        *   `[ ]` Add API Gateway trigger (`GET /generation-status/{jobId}`) (in Task 4).
        *   `[ ]` Add required IAM permissions to Role (DynamoDB GetItem or S3 GetObject/HeadObject for `results/*`).
        *   `[ ]` Implement code logic to check status (via DynamoDB or S3 object existence) and return status/result URL.

**Task 4: AWS Setup - API Gateway** `[IN PROGRESS]`
*   **Goal:** Create the HTTP interface between the frontend and backend Lambdas.
*   **NOTE:** API Gateway configuration might be managed partially or fully via the AWS Console if not completely defined in the CDK stack. **Future:** Define API Gateway using IaC.
*   **Steps:**
    *   `[x]` Create HTTP API (`https://jiov4el7d0.execute-api.ap-southeast-2.amazonaws.com`).
    *   `[x]` Define routes:
        *   `[x]` `POST /generate-upload-url` -> `RenoMate-GeneratePresignedUrl`.
        *   `[x]` `GET /my-photos` -> `RenoMate-ListUserPhotos`.
        *   `[REVISED]` `POST /start-generation` -> `RenoMate-ProcessImage`. This endpoint now accepts the S3 `key` of the uploaded image and `projectDetails` in the request body.
        *   `[x]` `GET /generation-status/{jobId}` -> `RenoMate-GetStatusResult`.
        *   `[x]` `POST /save-project` -> New Lambda to save complete project details to DynamoDB.
        *   `[x]` `GET /projects` -> New Lambda to retrieve all user projects.
        *   `[x]` `GET /project/{projectId}` -> New Lambda to retrieve a specific project.
        *   `[ ]` `PUT /project/{projectId}` -> New Lambda to update a project (triggers payment check).
    *   `[x]` Configure request/response mapping if needed (likely basic proxy integration is sufficient).
    *   `[IN PROGRESS]` Configure authorization:
        *   `[x]` Clerk JWT Authorizer Created.
        *   `[x]` Authorizer attached to `GET /my-photos` (Verified working).
        *   `[COMPLETED]` **Attach Clerk JWT Authorizer to `POST /generate-upload-url` route.**
        *   `[COMPLETED]` **Attach Clerk JWT Authorizer to `POST /start-generation` route.**
        *   `[COMPLETED]` **Attach Clerk JWT Authorizer to `GET /generation-status/{jobId}` route.**
    *   `[x]` Enable CORS for the API Gateway stage.

**IMPORTANT AUTHENTICATION NOTE:** 
All client requests to protected API endpoints must use the specific Clerk JWT template:
```javascript
const token = await getToken({ template: "RenoMateBackendAPI" });
```

The template is configured with the following audience:
```json
{
	"aud": "https://jiov4el7d0.execute-api.ap-southeast-2.amazonaws.com"
}
```

Omitting the template parameter will result in 401 Unauthorized errors from API Gateway even if the user is logged in.

**Task 5: Frontend - Image Upload Integration** `[COMPLETED - Core Upload]`

*   **Current Status (Updated 2024-07-30):**
    *   ✅ Core image upload (camera/file) to S3 via pre-signed URL is functional.
    *   ✅ "My Photos" gallery display is functional.
    *   ✅ User association via Clerk JWT on relevant backend endpoints (`/my-photos`, `/generate-upload-url`) is implemented (pending final API Gateway authorizer attachment check).
    *   ✅ Basic preview step implemented after selection/capture.
    *   ✅ **"Choose from your photos" option for reusing existing uploads.**
    *   🚧 **Next:** Integrate with the **Project Creation Flow (Task 6)** after image upload/selection is confirmed.

*   **Working Implementation:**
    *   User selects image (camera/file) or **chooses from existing "My Photos"**.
    *   If new image, it's uploaded to `uploads/{userId}/...` via pre-signed URL.
    *   If existing image, its S3 key is reused without re-uploading.
    *   The S3 key (`{userId}/...`) and a preview are stored in frontend state.
    *   User clicks "Continue" or equivalent, proceeding to **Task 6: Project Creation Flow**.

*   **Frontend - Required Changes:**
    1.  **User Association:**
        *   `[COMPLETED]` Clerk JWT sent via Authorization header.
        *   `[COMPLETED]` Backend Lambdas (`GeneratePresignedUrl`, `ListUserPhotos`) configured to use `userId` from JWT context.
        *   `[VERIFY]` Ensure Clerk Authorizer is attached to `POST /generate-upload-url` in API Gateway.
    2.  **Upload Flow UI Enhancement (`NewProject.tsx` / `RoomPhotoUpload.tsx`):**
        *   `[COMPLETED]` Display preview after image capture/selection.
        *   `[COMPLETED]` Include "Retake"/"Change" button.
        *   `[COMPLETED]` "Continue" button navigates to the *next step* in the project creation flow (defined in Task 6), passing the selected image's S3 key.
        *   `[COMPLETED]` **Added "Choose from your photos" option with a gallery view of previously uploaded images.**
    3.  **"My Photos" Feature:**
        *   `[COMPLETED]` Functional display of user's uploaded photos.
        *   `[COMPLETED]` Clicking a photo selects it and proceeds to the *next step* in the project creation flow (defined in Task 6), passing the selected image's S3 key.
        *   `[COMPLETED]` **Photos from gallery are selectable in the New Project flow.**

*   **Implementation Steps (Revised Flow):**
    1.  User starts a new project.
    2.  User is presented with options: "Take Photo", "Upload File", **"Choose from your photos"**.
    3.  **If Take/Upload:**
        *   Use `RoomPhotoUpload.tsx`.
        *   Validate file (size, type).
        *   Show preview with "Retake" option.
        *   On confirmation ("Use this photo" / "Continue"):
            *   Get pre-signed URL (`POST /generate-upload-url`).
            *   Upload to S3. Store the returned `key`.
            *   Navigate to Project Details step (Task 6), passing the `key`.
    4.  **If Choose from your photos:**
        *   **Display gallery of previously uploaded photos in-place.**
        *   **User clicks a photo to select it.**
        *   **Display preview with "Change Photo" option.**
        *   **On confirmation ("Continue"), navigate to Project Details step, passing the selected photo's `key`.**
    5.  **Project Details Step (Task 6):** Collect room type, style, instructions.
    6.  **Submit:** Call `POST /start-generation` with image `key` and project details.
    7.  Navigate to a loading/polling page, using the `jobId` returned from `/start-generation`.
    8.  Poll `GET /generation-status/{jobId}`.
    9.  Display result when status is `COMPLETE`.

*   **Testing Requirements:**
    *   Unit/Integration tests for components (`RoomPhotoUpload`, `MyPhotosGallery`, New project flow state management).
    *   E2E tests covering all three image selection paths leading into the project details form.

*   **Environment Variables Required:**
    ```
    VITE_API_ENDPOINT=https://jiov4el7d0.execute-api.ap-southeast-2.amazonaws.com
    VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
    ```

*   **API Endpoints Used (Updated):**
    1. `POST /generate-upload-url` (No change in body/response)
    2. `GET /my-photos` (No change)
    3. `POST /start-generation`
        *   Request:
            ```json
            {
              "key": "string", // S3 key like "user_id_xyz/image.jpg"
              "projectDetails": {
                "roomType": "string", // e.g., "Living Room", "Kitchen"
                "style": "string", // e.g., "Modern", "Minimalist", "Bohemian"
                "instructions": "string" // e.g., "Make the walls light blue, add a wooden coffee table"
              }
            }
            ```
        *   Response:
            ```json
            {
              "jobId": "string" // Identifier for polling status
            }
            ```
    4. `GET /generation-status/{jobId}` (No change)

*   **Security Considerations:**
    *   All API requests requiring auth must include Clerk JWT and be verified by API Gateway Authorizer.
    *   Validate inputs on both frontend and backend (e.g., length of instructions, allowed room types/styles if predefined).

*   **User Experience Requirements:**
    *   Clear navigation between steps (Image -> Details -> Status).
    *   Loading states for API calls (upload, start generation, polling).
    *   Feedback on successful image selection/upload.

*   **Performance Requirements:** Remain largely the same, focusing on smooth transitions between steps.

**Task 6: Frontend - Project Creation Flow** `[COMPLETED]`

*   **Goal:** Implement the UI flow *after* an image has been selected/uploaded, allowing the user to specify details for the AI generation.
*   **Depends On:** Task 5 (Image selected/uploaded **or chosen from gallery**, S3 key available).
*   **Leads To:** Triggering AI Generation via `POST /start-generation` and ultimately the Project View page.

*   **Implementation Status:**
    *   ✅ Used existing onboarding flow to collect project details (room type, budget, style, renovation type)
    *   ✅ Integrated with photo upload flow to receive image key
    *   ✅ Added API call to start generation with JWT authentication
    *   ✅ Created status polling component
    *   ✅ Navigation between components works correctly
    *   ✅ Error handling implemented

*   **Authentication Notes:**
    *   The Clerk JWT template "RenoMateBackendAPI" must be used for all authenticated API calls
    *   Proper error handling for auth errors has been implemented

*   **Components:**
    *   `ProjectDetailsForm.tsx`: A form component to collect project details.
    *   `NewProjectFlow.tsx` (or parent): Manages state (selected image key, form data) and navigation.

*   **Data Collection Requirements:**
    *   User ID (from Clerk authentication)
    *   Selected photo (S3 key)
    *   Room type (e.g., Kitchen, Bathroom, Living Room)
    *   Budget (numeric value with currency)
    *   Style preference (e.g., Modern, Rustic, Minimalist)
    *   Type of renovation (e.g., Full renovation, Quick refresh, Specific area focus)

*   **Implementation Steps:**
    1.  **Create `ProjectDetailsForm.tsx`:**
        *   Accepts the selected image `key` as a prop (or retrieves from parent state).
        *   Include form fields for:
            *   **Room Type:** (e.g., Dropdown or Radio buttons: Living Room, Kitchen, Bedroom, Bathroom, Office, Other).
            *   **Budget:** Numeric input with currency selector or presets.
            *   **Desired Style:** (e.g., Dropdown or Tag selection: Modern, Minimalist, Industrial, Scandinavian, Bohemian, Farmhouse, Coastal, Custom). Consider allowing text input for "Custom".
            *   **Type of Renovation:** (e.g., Radio buttons: Full renovation, Quick refresh, Specific area focus).
            *   **Specific Instructions:** (e.g., Text area: "Make the walls light blue", "Add more plants", "Change the sofa to a leather one"). Add character limits if necessary.
        *   Implement state management for form fields (e.g., using `useState` or a form library like React Hook Form).
        *   Include validation (all fields required except instructions).
        *   Provide a "Back" button (to go back to image selection/preview if applicable).
        *   Provide a "Save and Finish" button.

    2.  **Integrate into `NewProjectFlow.tsx` (or parent):**
        *   After image selection/upload confirmation (from Task 5), navigate to the view rendering `ProjectDetailsForm.tsx`.
        *   Pass the selected image `key` to the form component (from params when navigating, e.g., `location.state.photoKey`).
        *   Handle form submission:
            *   Gather form data (roomType, budget, style, renovationType, instructions).
            *   Combine with the image `key`.
            *   Show a loading indicator.
            *   Check if user is allowed to create a new project (first project free, subsequent ones require payment).
            *   If payment required, redirect to payment flow (to be implemented separately).
            *   If free or payment completed, make the `POST /start-generation` API call using the user's JWT token.
                *   Endpoint: `VITE_API_ENDPOINT/start-generation`
                *   Method: `POST`
                *   Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
                *   Body: `{ key: "...", projectDetails: { roomType: "...", budget: "...", style: "...", renovationType: "...", instructions: "..." } }`
            *   On success:
                *   Receive the `jobId` from the response.
                *   Navigate to a loading/status page with the `jobId` for polling.
            *   On failure:
                *   Hide loading indicator.
                *   Display an appropriate error message to the user (e.g., "Failed to start generation. Please try again.").

    3.  **Status/Loading Page Component:**
        *   A new component that takes a `jobId`.
        *   Uses `useEffect` to poll `GET /generation-status/{jobId}` every few seconds.
        *   Displays status updates ("Processing...", "Generating image...", "Creating suggestions...").
        *   When status is `COMPLETE`, save project to database and navigate to Project View page.
        *   If `FAILED`, show error message with retry option.
        *   Requires JWT token for polling requests.

*   **Data Structure (`projectDetails`):**
    ```typescript
    interface ProjectDetails {
      roomType: string;
      budget: number;
      style: string;
      renovationType: string;
      instructions?: string;
    }
    ```

*   **UI/UX Considerations:**
    *   Use clear labels and helper text for form fields.
    *   Consider using visual selectors (e.g., image cards) for styles.
    *   Ensure the form is responsive and works well on mobile.
    *   Provide immediate feedback on validation errors.
    *   Disable the submit button while the generation request is in flight.
    *   Show clear loading indicators during API calls.

*   **Testing:**
    *   Unit tests for `ProjectDetailsForm.tsx` (validation, state changes).
    *   Integration tests for `NewProjectFlow.tsx` covering the transition from image selection to details form and submission.
    *   Mock API calls (`/start-generation`) in tests.

**Task 7: Frontend - Project View Page** `[TODO]`

*   **Goal:** Implement the final project view page that displays the complete project with both user inputs and AI-generated results.
*   **Depends On:** Tasks 5 and 6 (Completed project creation flow with AI generation).
*   **Access Path:** Direct navigation to `/project/{projectId}` or automatic redirect after project creation completion.

*   **Components:**
    *   `ProjectView.tsx`: Main component for displaying a complete project.
    *   `BeforeAfterGallery.tsx`: Component to display before/after images side by side or with slider.
    *   `DIYSuggestionsList.tsx`: Component to display the list of suggested improvements with costs.

*   **Data Requirements:**
    *   Project metadata (title, room type, style, budget, creation date, etc.)
    *   Original "before" image (user uploaded)
    *   AI-generated "after" image
    *   List of DIY improvement suggestions with descriptions and costs
    *   Total cost of all suggestions

*   **Implementation Steps:**
    1.  **Create Routes:**
        *   Add route for `/project/:projectId` in the app router.
        *   Ensure proper authentication checks (must be logged in to view).

    2.  **Create `ProjectView.tsx`:**
        *   Retrieve project data using the `projectId` from URL params.
        *   Make API call to `GET /project/{projectId}` to fetch complete project details.
        *   Display project header with title, type and date.
        *   Integrate `BeforeAfterGallery.tsx` to display before/after images.
        *   Integrate `DIYSuggestionsList.tsx` to display improvement recommendations.
        *   Add edit functionality (with payment warning for non-free users).
        *   Add sharing options if desired.
        *   Handle loading and error states appropriately.

    3.  **Create `BeforeAfterGallery.tsx`:**
        *   Accept "before" and "after" image URLs as props.
        *   Implement a visually appealing way to display the comparison:
            *   Side-by-side view for larger screens.
            *   Stacked view for mobile with easy toggle.
            *   Consider a slider option that reveals the "after" image.
        *   Include appropriate loading states for images.
        *   Implement responsive design for different screen sizes.

    4.  **Create `DIYSuggestionsList.tsx`:**
        *   Accept array of suggestion objects as props.
        *   Each suggestion should include:
            *   Title (e.g., "Paint Wall (Soft Neutral)")
            *   Description (e.g., "Painted the upper wall a neutral, modern tone...")
            *   Cost estimate (e.g., "$150")
        *   Display suggestions in an expandable/collapsible format as shown in screenshot.
        *   Calculate and display the total cost of all suggestions.
        *   Implement responsive design for mobile viewing.

    5.  **Update Navigation and "My Rooms" Gallery:**
        *   Ensure newly created projects appear in the "My Rooms" list.
        *   Link each project in the gallery to its corresponding `/project/{projectId}` URL.
        *   Update project cards to show a preview of the after image if available.

*   **Data Structures:**
    ```typescript
    interface Project {
      id: string;
      title: string;
      userId: string;
      roomType: string;
      budget: number;
      style: string;
      renovationType: string;
      instructions?: string;
      beforeImageKey: string;
      afterImageKey?: string;
      diySuggestions: DIYSuggestion[];
      createdAt: string;
      updatedAt: string;
      status: 'PENDING' | 'COMPLETE' | 'FAILED';
      totalCost: number;
    }

    interface DIYSuggestion {
      id: string;
      title: string;
      description: string;
      cost: number;
    }
    ```

*   **API Endpoints Used:**
    *   `GET /project/{projectId}` - Get complete project details including before/after images and suggestions
    *   `PUT /project/{projectId}` - Update project (if editing, triggers payment check)

*   **UI/UX Considerations:**
    *   Match the existing design shown in the provided screenshot/URL.
    *   Ensure the page is fully responsive.
    *   Implement smooth loading transitions.
    *   Clear visual hierarchy with the before/after comparison as the focal point.
    *   Easy-to-read DIY suggestions with clear cost breakdowns.
    *   Accessibility considerations (alt text, keyboard navigation, etc.).

*   **Testing:**
    *   Unit tests for each component.
    *   Integration tests for API data fetching and rendering.
    *   Responsive design tests across device sizes.

**Task 8: Payment Integration** `[TODO]`

*   **Goal:** Implement the payment/subscription system for users who want to create more than one project or edit existing projects.
*   **Logic:**
    *   First project creation is free for each user.
    *   Subsequent project creations require payment or active subscription.
    *   Editing an existing project (triggering a new AI generation) requires payment or active subscription.
    *   Users with an active subscription get unlimited generations for the duration of their subscription.

*   **Implementation Steps:**
    1.  **Add Payment Checks:**
        *   Before starting a new generation (`POST /start-generation`), check if the user is eligible:
            *   If it's their first project, allow without payment.
            *   If they have an active subscription, allow without additional payment.
            *   Otherwise, redirect to payment/subscription flow.
        *   Similar logic applies to project edits.

    2.  **Create Payment UI Components:**
        *   Subscription options display.
        *   Payment form integration.
        *   Confirmation and receipt views.

    3.  **Integrate Payment Provider:**
        *   Research and select appropriate payment provider (Stripe, PayPal, etc.).
        *   Implement server-side payment verification.
        *   Store subscription status in user profile.

*   **Security Considerations:**
    *   Never process payments directly in the frontend.
    *   Use secure, established payment providers.
    *   Implement proper validation of payment status before allowing premium features.

## 4. Implementation Guide for Junior Developers

Follow these steps sequentially to implement the project creation functionality:

1. **Set Up Project Database Schema** `[COMPLETED]`
   - Create a new DynamoDB table for projects with fields matching the `Project` interface.
   - Set up appropriate indexes for userId and other frequent query patterns.
   - Implement and test CRUD operations on the table.

2. **Create Backend Lambda for Project Storage** `[COMPLETED]`
   - Implement `POST /save-project` Lambda function.
   - Include validation for all required fields.
   - Add proper error handling and response formatting.
   - Connect to DynamoDB for storage.

3. **Extend ProcessImage Lambda** `[IN PROGRESS]`
   - Update to accept expanded projectDetails (room type, budget, style, renovation type).
   - ~~Modify OpenAI prompt to request both an after image AND DIY suggestions.~~
   - ~~Parse OpenAI response to extract both image and structured DIY suggestions.~~
   - Store suggestions along with project data.

   **REVISED APPROACH (Pre-AI Implementation):**
   - Create a simplified mock version of the ProcessImage Lambda that:
     - Accepts the same input (image key and project details)
     - Returns a hardcoded "after" image URL (can use the original image temporarily)
     - Generates mock DIY suggestions based on the room type
     - Saves project data to DynamoDB with mock results
     - Returns a jobId and projectId for the frontend to use
   - This allows testing the complete user flow without OpenAI integration

4. **Create Project Details Form Component** `[COMPLETED]`
   - Build form UI with all required fields from the specifications.
   - Implement validation logic.
   - Add state management for form fields.
   - Style according to app design guidelines.

5. **Implement New Project Flow** `[COMPLETED]`
   - Connect image selection step to project details form.
   - Implement navigation between steps.
   - Add loading states and error handling.
   - Implement free/paid logic check before generation.

6. **Create Status/Loading Page** `[COMPLETED]`
   - Build UI for displaying generation status.
   - Implement polling logic with appropriate intervals.
   - Add cancel option if needed.
   - Handle both success and failure cases.

7. **Build Project View Page** `[USING EXISTING IMPLEMENTATION]`
   - Create the main project view layout.
   - Implement before/after image comparison component.
   - Build DIY suggestions list with expandable sections.
   - Style to match the design in the example URL.

8. **Update My Rooms Gallery** `[IN PROGRESS]`
   - Create a Lambda function to retrieve user's projects from DynamoDB:
     ```javascript
     // Create a new Lambda function "RenoMate-ListUserProjects"
     // This function should:
     // 1. Extract userId from the JWT token
     // 2. Query DynamoDB for all projects with that userId
     // 3. Return the list of projects with thumbnails and basic metadata
     ```
   - Add an API Gateway route for `/projects` pointing to this Lambda
   - Update the Projects page in the frontend to fetch and display real projects:
     ```jsx
     // In src/pages/Projects.tsx or similar:
     // 1. Use the useAuth hook to get the token with template
     // 2. Fetch projects from the API
     // 3. Display projects in a grid with thumbnails
     // 4. Add loading states and error handling
     ```
   - Implement project card component that displays:
     - Project thumbnail (before/after image)
     - Project title and type
     - Creation date
     - Total cost of DIY suggestions
   - Add linking to project detail page for each card
   - Ensure responsive design for mobile viewing

9. **Implement Project Detail View with Real Data** `[IN PROGRESS]`
   - Create a Lambda function to get a single project by ID:
     ```javascript
     // Create a new Lambda function "RenoMate-GetProject"
     // This function should:
     // 1. Take a projectId as a path parameter
     // 2. Verify the requesting user is the owner of the project
     // 3. Retrieve the full project details from DynamoDB
     // 4. Return the complete project data including DIY suggestions
     // [COMPLETED] Lambda function created.
     ```
   - Add an API Gateway route for `/project/{projectId}` pointing to this Lambda
   // [COMPLETED] API Gateway route created.
   - Update the existing ProjectDetailPage component:
     ```jsx
     // In src/pages/ProjectDetailPage.tsx:
     // 1. Extract projectId from route params
     // 2. Fetch project data from the API using the JWT token
     // 3. Display project details using existing components
     // 4. Handle loading and error states
     ```
   - Connect the BeforeAfterGallery component to use real image URLs
   - Connect the DIY suggestions accordion to use real data from project
   - Ensure all data is properly formatted and styled

10. **Implement Mock Projects for Testing** `[TODO]`
    - Create a utility Lambda function to populate test projects in DynamoDB
    - Generate a variety of project types with different settings
    - This allows testing the UI without manually creating projects

11. **Implement Error Handling and Edge Cases** `[TODO]`
    - Add error boundaries around key components
    - Implement graceful handling of API failures
    - Add fallback UI for missing images or data
    - Test with slow network conditions
    - Ensure mobile responsiveness

12. **OpenAI Integration (Future Phase)** `[FUTURE]`
    - Replace the mock ProcessImage Lambda with real OpenAI integration
    - Add appropriate error handling for AI service failures
    - Implement retry logic for failed generations
    - Consider adding a queue for handling multiple generation requests

## 5. Immediate Implementation Steps

To show a functioning project flow without AI generation, complete these steps:

1. **Create Mock ProcessImage Lambda Implementation**
   - Modify the existing RenoMate-ProcessImage Lambda to return mock data
   - Code snippet:
   ```javascript
   exports.handler = async (event) => {
     try {
       // Parse request body
       const requestBody = JSON.parse(event.body);
       const imageKey = requestBody.key;
       const projectDetails = requestDetails.projectDetails;
       
       // Get user ID from JWT
       const userId = event.requestContext.authorizer.jwt.claims.sub;
       
       // Generate mock project ID and job ID
       const projectId = generateProjectId(projectDetails.roomType);
       const jobId = crypto.randomUUID();
       
       // Re-use the original image for now as the "after" image
       const afterImageKey = imageKey;
       
       // Generate mock DIY suggestions based on room type
       const diySuggestions = generateMockSuggestions(projectDetails.roomType);
       
       // Calculate total cost
       const totalCost = diySuggestions.reduce((sum, item) => sum + item.cost, 0);
       
       // Store project in DynamoDB
       const projectItem = {
         userId,
         id: projectId,
         title: `${projectDetails.roomType} ${projectDetails.renovationType}`,
         roomType: projectDetails.roomType,
         budget: projectDetails.budget,
         style: projectDetails.style,
         renovationType: projectDetails.renovationType,
         instructions: projectDetails.instructions || '',
         beforeImageKey: imageKey,
         afterImageKey: afterImageKey,
         diySuggestions,
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
         status: 'COMPLETE',
         totalCost
       };
       
       // Save to DynamoDB
       await dynamoClient.put({
         TableName: 'renomate-projects',
         Item: marshall(projectItem)
       }).promise();
       
       return {
         statusCode: 200,
         headers: {
           'Content-Type': 'application/json',
           'Access-Control-Allow-Origin': '*',
           'Access-Control-Allow-Credentials': true
         },
         body: JSON.stringify({
           jobId,
           projectId,
           status: 'COMPLETE'
         })
       };
     } catch (error) {
       console.error('Error:', error);
       return {
         statusCode: 500,
         headers: {
           'Content-Type': 'application/json',
           'Access-Control-Allow-Origin': '*',
           'Access-Control-Allow-Credentials': true
         },
         body: JSON.stringify({
           message: 'Failed to process image and generate results',
           error: error.message
         })
       };
     }
   };
   
   function generateMockSuggestions(roomType) {
     // Return room-specific suggestions based on room type
     switch(roomType.toLowerCase()) {
       case 'bathroom':
         return [
           {
             id: '1',
             title: "Paint Wall (Soft Neutral)",
             description: "Painted the upper wall a neutral, modern tone (light beige or off-white) to freshen the look and make the space feel larger.",
             cost: 150
           },
           {
             id: '2',
             title: "Replace Shower Curtain & Rod",
             description: "Swapped outdated floral curtain with a clean white waffle-style curtain and upgraded to a sleek chrome rod.",
             cost: 80
           },
           // Add more bathroom suggestions
         ];
       case 'kitchen':
         return [
           {
             id: '1',
             title: "Update Cabinet Hardware",
             description: "Replaced outdated knobs with modern matte black handles for a contemporary look.",
             cost: 75
           },
           // Add more kitchen suggestions
         ];
       // Add more room types
       default:
         return [
           {
             id: '1',
             title: "Fresh Paint",
             description: "Applied a new coat of paint in a modern color palette.",
             cost: 100
           },
           {
             id: '2',
             title: "Update Lighting",
             description: "Installed new light fixtures for improved ambiance.",
             cost: 120
           }
         ];
     }
   }
   ```

2. **Create ListUserProjects Lambda**
   - Implement a new Lambda function to list all projects for a user
   - Create API Gateway route `/projects` pointing to this Lambda
   - Sample code:
   ```javascript
   const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
   const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
   
   const client = new DynamoDBClient();
   const docClient = DynamoDBDocumentClient.from(client);
   
   exports.handler = async (event) => {
     try {
       // Get user ID from JWT
       const userId = event.requestContext.authorizer.jwt.claims.sub;
       
       // Query DynamoDB for user's projects
       const command = new QueryCommand({
         TableName: 'renomate-projects',
         KeyConditionExpression: 'userId = :userId',
         ExpressionAttributeValues: {
           ':userId': userId
         }
       });
       
       const response = await docClient.send(command);
       
       return {
         statusCode: 200,
         headers: {
           'Content-Type': 'application/json',
           'Access-Control-Allow-Origin': '*',
           'Access-Control-Allow-Credentials': true
         },
         body: JSON.stringify(response.Items)
       };
     } catch (error) {
       console.error('Error:', error);
       return {
         statusCode: 500,
         headers: {
           'Content-Type': 'application/json',
           'Access-Control-Allow-Origin': '*',
           'Access-Control-Allow-Credentials': true
         },
         body: JSON.stringify({
           message: 'Failed to retrieve user projects',
           error: error.message
         })
       };
     }
   };
   ```

3. **Update Projects Page in Frontend**
   - Modify the Projects page to fetch and display real projects
   - Sample code:
   ```jsx
   import { useState, useEffect } from "react";
   import { useAuth } from "@clerk/clerk-react";
   import PageContainer from "@/components/layout/PageContainer";
   import { ProjectCard } from "@/components/projects/ProjectCard";
   import { LoadingIndicator } from "@/components/ui/loading";
   
   const Projects = () => {
     const [projects, setProjects] = useState([]);
     const [isLoading, setIsLoading] = useState(true);
     const [error, setError] = useState(null);
     const { getToken } = useAuth();
     
     useEffect(() => {
       const fetchProjects = async () => {
         try {
           // Get token with correct template
           const token = await getToken({ template: "RenoMateBackendAPI" });
           
           // Fetch projects from API
           const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/projects`, {
             headers: {
               'Authorization': `Bearer ${token}`
             }
           });
           
           if (!response.ok) {
             throw new Error("Failed to fetch projects");
           }
           
           const data = await response.json();
           setProjects(data);
         } catch (error) {
           console.error("Error fetching projects:", error);
           setError(error.message);
         } finally {
           setIsLoading(false);
         }
       };
       
       fetchProjects();
     }, [getToken]);
     
     if (isLoading) {
       return (
         <PageContainer>
           <LoadingIndicator />
         </PageContainer>
       );
     }
     
     if (error) {
       return (
         <PageContainer>
           <div className="text-red-600">{error}</div>
         </PageContainer>
       );
     }
     
     return (
       <PageContainer>
         <h1 className="text-xl font-semibold mb-6">My Projects</h1>
         
         {projects.length === 0 ? (
           <div className="text-center py-12">
             <p>You don't have any projects yet.</p>
             <button
               className="mt-4 px-4 py-2 bg-budget-accent text-white rounded-md"
               onClick={() => navigate('/new-project')}
             >
               Create Your First Project
             </button>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {projects.map(project => (
               <ProjectCard key={project.id} project={project} />
             ))}
           </div>
         )}
       </PageContainer>
     );
   };
   
   export default Projects;
   ```

4. **Create Project Card Component**
   - Create a reusable component for displaying project cards
   - Sample code:
   ```jsx
   import { Link } from "react-router-dom";
   import { formatDistance } from "date-fns";
   
   export function ProjectCard({ project }) {
     // Calculate time since creation
     const timeAgo = formatDistance(
       new Date(project.createdAt),
       new Date(),
       { addSuffix: true }
     );
     
     // Determine which image to show (prioritize after image if available)
     const imageUrl = project.afterImageKey 
       ? `${import.meta.env.VITE_S3_BASE_URL}/${project.afterImageKey}`
       : `${import.meta.env.VITE_S3_BASE_URL}/${project.beforeImageKey}`;
     
     return (
       <Link to={`/project/${project.id}`} className="block">
         <div className="rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
           <div className="aspect-video relative">
             <img
               src={imageUrl}
               alt={project.title}
               className="w-full h-full object-cover"
             />
             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
               <h3 className="text-white font-semibold truncate">{project.title}</h3>
             </div>
           </div>
           <div className="p-4">
             <div className="flex justify-between items-center mb-2">
               <span className="text-sm text-muted-foreground">{project.roomType}</span>
               <span className="text-sm font-medium text-budget-accent">
                 ${project.totalCost}
               </span>
             </div>
             <div className="text-xs text-muted-foreground">
               Created {timeAgo}
             </div>
           </div>
         </div>
       </Link>
     );
   }
   ```

5. **Update GetProjectStatus Lambda for Mock Implementation**
   - Modify the Lambda to consistently return "COMPLETE" status
   - This simplifies testing by not requiring real processing

6. **Create GetProject Lambda for Project Details**
   - Implement a Lambda to get a single project by ID
   - Create API Gateway route `/project/{projectId}`

After completing these steps, you'll have a fully functional UI flow that:
1. Allows users to upload/select photos
2. Collects project details
3. Creates mock project results
4. Displays projects in the My Rooms/Projects list
5. Shows detailed project information

This approach lets you fully demonstrate the application workflow without implementing the AI generation components, which can be added later as an enhancement.

## 6. Future Enhancements / Refactoring

*   **Upload Component Refactoring:** Review `RoomPhotoUpload.tsx` / `NewProject.tsx` for potential simplification of state management during the multi-step upload process (e.g., using a state machine or breaking into smaller components).
*   **Error Handling Granularity:** Improve specificity of error messages displayed to the user based on different failure points (upload, generation, API errors).
*   **Code Splitting:** Implement code splitting (e.g., route-based) to reduce initial bundle size and improve loading performance.
*   **Testing Coverage:** Increase unit and integration test coverage, particularly for complex UI interactions and API integrations.
*   **Backend Scalability:** Evaluate and implement strategies for handling increased load on Lambda functions and potential bottlenecks (e.g., concurrency limits, database capacity).