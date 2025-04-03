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
            *   Receive image `key` and `projectDetails` (roomType, style, instructions) from API Gateway event body.
            *   Fetch image from S3 using the `key`.
            *   Retrieve OpenAI API Key from Secrets Manager.
            *   Construct prompt/request for OpenAI API using image and `projectDetails`.
            *   Call OpenAI API (e.g., GPT-4o Vision or DALL-E).
            *   Save generated image to `results/{userId}/{jobId}/result.png` in S3.
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
    *   `[ ]` Configure request/response mapping if needed (likely basic proxy integration is sufficient).
    *   `[IN PROGRESS]` Configure authorization:
        *   `[x]` Clerk JWT Authorizer Created.
        *   `[x]` Authorizer attached to `GET /my-photos` (Verified working).
        *   `[PENDING]` **Attach Clerk JWT Authorizer to `POST /generate-upload-url` route.**
        *   `[PENDING]` **Attach Clerk JWT Authorizer to `POST /start-generation` route.**
        *   `[PENDING]` **Attach Clerk JWT Authorizer to `GET /generation-status/{jobId}` route.**
    *   `[x]` Enable CORS for the API Gateway stage.

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

**Task 6: Frontend - Project Creation Flow** `[TODO]`

*   **Goal:** Implement the UI flow *after* an image has been selected/uploaded, allowing the user to specify details for the AI generation.
*   **Depends On:** Task 5 (Image selected/uploaded **or chosen from gallery**, S3 key available).
*   **Leads To:** Triggering AI Generation via `POST /start-generation`.

*   **Components:**
    *   `ProjectDetailsForm.tsx`: A form component to collect project details.
    *   `NewProjectFlow.tsx` (or parent): Manages state (selected image key, form data) and navigation.

*   **Implementation Steps:**
    1.  **Create `ProjectDetailsForm.tsx`:**
        *   Accepts the selected image `key` as a prop (or retrieves from parent state).
        *   Include form fields for:
            *   **Room Type:** (e.g., Dropdown or Radio buttons: Living Room, Kitchen, Bedroom, Bathroom, Office, Other).
            *   **Desired Style:** (e.g., Dropdown or Tag selection: Modern, Minimalist, Industrial, Scandinavian, Bohemian, Farmhouse, Coastal, Custom). Consider allowing text input for "Custom".
            *   **Specific Instructions:** (e.g., Text area: "Make the walls light blue", "Add more plants", "Change the sofa to a leather one"). Add character limits if necessary.
        *   Implement state management for form fields (e.g., using `useState` or a form library like React Hook Form).
        *   Include validation (e.g., room type and style required, instructions optional but maybe limited length).
        *   Provide a "Back" button (to go back to image selection/preview if applicable).
        *   Provide a "Start Generation" or "Submit" button.

    2.  **Integrate into `NewProjectFlow.tsx` (or parent):**
        *   After image selection/upload confirmation (from Task 5), navigate to the view rendering `ProjectDetailsForm.tsx`.
        *   Pass the selected image `key` to the form component (from params when navigating, e.g., `location.state.photoKey`).
        *   Handle form submission:
            *   Gather form data (`roomType`, `style`, `instructions`).
            *   Combine with the image `key`.
            *   Show a loading indicator.
            *   Make the `POST /start-generation` API call using the user's JWT token.
                *   Endpoint: `VITE_API_ENDPOINT/start-generation`
                *   Method: `POST`
                *   Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
                *   Body: `{ key: "...", projectDetails: { roomType: "...", style: "...", instructions: "..." } }`
            *   On success:
                *   Receive the `jobId` from the response.
                *   Navigate to a new page/view responsible for polling and displaying results, passing the `jobId`.
            *   On failure:
                *   Hide loading indicator.
                *   Display an appropriate error message to the user (e.g., "Failed to start generation. Please try again.").

    3.  **Polling/Results Page (Brief Outline - Task 7 Placeholder):**
        *   A new component/page that takes a `jobId`.
        *   Uses `useEffect` to poll `GET /generation-status/{jobId}` every few seconds.
        *   Displays status updates ("Processing...", "Generating image...").
        *   When status is `COMPLETE`, displays the `resultUrl` image.
        *   Handles `FAILED` status.
        *   Requires JWT token for polling requests.

*   **Data Structure (`projectDetails`):**
    ```typescript
    interface ProjectDetails {
      roomType: string;
      style: string;
      instructions: string;
    }
    ```

*   **UI/UX Considerations:**
    *   Use clear labels and potentially helper text for form fields.
    *   Consider using visual selectors (e.g., image cards) for styles if appropriate.
    *   Ensure the form is responsive and works well on mobile.
    *   Provide immediate feedback on validation errors.
    *   Disable the submit button while the generation request is in flight.

*   **Testing:**
    *   Unit tests for `ProjectDetailsForm.tsx` (validation, state changes).
    *   Integration tests for `NewProjectFlow.tsx` covering the transition from image selection to details form and submission.
    *   Mock API calls (`/start-generation`) in tests.

## 4. Future Enhancements / Refactoring

*   **Upload Component Refactoring:** Review `RoomPhotoUpload.tsx` / `NewProject.tsx` for potential simplification of state management during the multi-step upload process (e.g., using a state machine or breaking into smaller components).
*   **Error Handling Granularity:** Improve specificity of error messages displayed to the user based on different failure points (upload, generation, API errors).
*   **Code Splitting:** Implement code splitting (e.g., route-based) to reduce initial bundle size and improve loading performance.
*   **Testing Coverage:** Increase unit and integration test coverage, particularly for complex UI interactions and API integrations.
*   **Backend Scalability:** Evaluate and implement strategies for handling increased load on Lambda functions and potential bottlenecks (e.g., concurrency limits, database capacity).