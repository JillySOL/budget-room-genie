# RenoMate - Technical Guide for Junior Engineers

## 1. Project Overview

**Goal:** RenoMate is a web application that allows users to upload a photo of a room, specify desired renovation styles or changes, and receive an AI-generated image visualizing the potential outcome.

**Current Status:**
*   **Frontend:** React application built with Vite, using React Router for navigation, Tailwind CSS and Shadcn UI for styling. Hosted on Vercel.
*   **Authentication:** User authentication is implemented using Clerk. Sign-in, sign-up, and profile management flows are functional.
*   **Core Idea:** The basic concept involves image upload, calling an AI service (like OpenAI's ChatGPT-4o or DALL-E 3), and displaying results.
*   **To Be Implemented:** The core backend logic involving AWS services (S3, Lambda) and the OpenAI API integration, along with the frontend components to manage this workflow.

**Target Users:** Homeowners, DIY enthusiasts, interior designers looking for quick renovation visualizations.

## 2. System Architecture

Here's a high-level overview of the planned architecture:

```mermaid
graph LR
    A[User Browser (React App on Vercel)] -- 1. Selects Image & Inputs --> A;
    A -- 2. Request Pre-signed URL --> B(API Gateway);
    B -- 3. Trigger Lambda A --> C[Lambda A (GeneratePresignedUrl)];
    C -- 4. Generate URL --> B;
    B -- 5. Return Pre-signed URL --> A;
    A -- 6. Upload Image Directly --> D[AWS S3 Bucket (uploads/ prefix)];
    D -- 7. S3 Event (ObjectCreated) --> E[Lambda B (ProcessImage & OpenAI)];
    E -- 8. Call OpenAI API --> F[OpenAI API (GPT-4o/DALL-E)];
    F -- 9. Return Generated Image Data --> E;
    E -- 10. Save Result Image --> G[AWS S3 Bucket (results/ prefix)];
    E -- 11. (Optional) Update Status --> H[(Optional) DynamoDB Table];
    A -- 12. Poll for Status/Result (via API Gateway) --> B;
    B -- 13. Trigger Lambda C --> I[Lambda C (GetStatus/Result)];
    I -- 14. Check S3/DynamoDB --> G;
    I -- 15. Return Result URL/Status --> B;
    B -- 16. Return Result URL/Status --> A;
    A -- 17. Display Generated Image --> A;

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

1.  **Frontend (User Browser):** The React application running on Vercel. Handles UI, user input, authentication (Clerk), and interacts with the backend via API Gateway.
2.  **API Gateway:** Acts as the secure entry point for all backend requests from the frontend. Routes requests to the appropriate Lambda functions.
3.  **Lambda A (GeneratePresignedUrl):** Generates a secure, temporary URL that allows the frontend to upload a file directly to a specific location in the S3 bucket without needing AWS credentials embedded in the browser.
4.  **S3 Bucket:** Stores the original uploaded images (e.g., in an `uploads/` prefix) and the AI-generated results (e.g., in a `results/` prefix). Needs correct CORS configuration.
5.  **Lambda B (ProcessImage & OpenAI):** Triggered automatically when a new image lands in the `uploads/` prefix in S3. This function retrieves the image, potentially gets user inputs associated with it (passed via metadata or fetched separately), calls the OpenAI API, and saves the result back to the S3 `results/` prefix.
6.  **OpenAI API:** External service (GPT-4o Vision / DALL-E 3) that performs the image generation based on the input image and user prompts/instructions.
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
            *   `[ ]` *(Optional)* Add DynamoDB permissions (`dynamodb:PutItem`, `dynamodb:UpdateItem`).
        *   `Lambda C (GetStatus/Result)` Role:
            *   `[x]` Basic Role created (`RenoMate-GetStatusResult-LambdaRole`) with `AWSLambdaBasicExecutionRole` attached.
            *   `[ ]` *(Optional)* Add DynamoDB permission (`dynamodb:GetItem`).
            *   `[ ]` Add S3 permission (`s3:GetObject` or `s3:HeadObject`) for `results/*` if not using DynamoDB, or if providing pre-signed GET URLs.
*   **Security:** Never hardcode credentials. Use IAM roles for Lambda functions. Store sensitive keys like the OpenAI API key in AWS Secrets Manager or Systems Manager Parameter Store (and grant the Lambda role access).

**Task 3: AWS Setup - Lambda Functions** `[IN PROGRESS]`
*   **Goal:** Create the backend logic functions. Choose a runtime (Node.js or Python are good choices).
*   **NOTE:** Lambda function code is primarily managed and deployed directly within the AWS Console/environment, not necessarily checked into this repository.
*   **Steps:**
    *   **Runtime Chosen:** Node.js 20.x
    *   **Lambda A (GeneratePresignedUrl):**
        *   `[x]` Function `RenoMate-GeneratePresignedUrl` created (Node.js 20.x).
        *   `[x]` Role `RenoMate-GeneratePresignedUrl-LambdaRole` assigned.
        *   `[x]` API Gateway trigger configured (verified via endpoint functionality).
        *   `[CHECK DEPLOYMENT]` Implement code logic (Code exists and *appears* correct, but verify deployed version).
    *   **Lambda B (ProcessImage & OpenAI):**
        *   `[x]` Function `RenoMate-ProcessImage` created (Node.js 20.x).
        *   `[x]` Role `RenoMate-ProcessImage-LambdaRole` assigned.
        *   `[x]` S3 trigger added (ObjectCreated:* in `uploads/` prefix).
        *   `[ ]` Add required IAM permissions to Role (S3 Get/Put, Secrets Manager, DynamoDB optional).
        *   `[ ]` Implement code logic.
    *   **Lambda C (GetStatus/Result):**
        *   `[x]` Function `RenoMate-GetStatusResult` created (Node.js 20.x).
        *   `[x]` Role `RenoMate-GetStatusResult-LambdaRole` assigned.
        *   `[ ]` Add API Gateway trigger (in Task 4).
        *   `[ ]` Add required IAM permissions to Role (DynamoDB optional, S3 Get optional).
        *   `[ ]` Implement code logic.

**Task 4: AWS Setup - API Gateway** `[IN PROGRESS]`
*   **Goal:** Create the HTTP interface between the frontend and backend Lambdas.
*   **NOTE:** API Gateway configuration might be managed partially or fully via the AWS Console if not completely defined in the CDK stack.
*   **Steps:**
    *   `[x]` Create HTTP API (`https://jiov4el7d0.execute-api.ap-southeast-2.amazonaws.com`).
    *   `[x]` Define routes:
        *   `[x]` `POST /generate-upload-url` -> `RenoMate-GeneratePresignedUrl`.
        *   `[x]` `GET /my-photos` -> `RenoMate-ListUserPhotos`.
        *   `[x]` `POST /start-generation` -> `RenoMate-ProcessImage` (assuming Lambda B handles API + S3 triggers).
        *   `[x]` `GET /generation-status/{jobId}` -> `RenoMate-GetStatusResult`.
    *   `[ ]` Configure request/response mapping (if needed beyond basic proxy integration).
    *   `[IN PROGRESS]` Configure authorization:
        *   `[x]` Clerk JWT Authorizer Created.
        *   `[x]` Authorizer attached to `GET /my-photos` (Verified working).
        *   `[PENDING]` **Attach Clerk JWT Authorizer to `POST /generate-upload-url` route.** (This is the missing step causing user association issues).
    *   `[x]` Enable CORS for the API Gateway stage.

**Task 5: Frontend - Image Upload Integration** `[IN PROGRESS]`

*   **Current Status (Updated 2024-07-29):**
    *   ✅ API Gateway integration fixed and working
    *   ✅ Lambda function fixed and working
    *   ✅ Images successfully uploading to S3 bucket
    *   🚧 **Frontend Work In Progress:** Implementing user association, photo preview, and "My Photos" feature.

*   **Working Implementation (Backend):**
    *   Lambda A (`RenoMate-GeneratePresignedUrl`) generates pre-signed URLs.
    *   Frontend retrieves pre-signed URL, then uploads directly to S3.
    *   CORS configured correctly for frontend domains.
    *   Error handling implemented in both frontend and backend.

*   **Frontend - Required Changes:**
    1.  **User Association:**
        *   `[COMPLETED]` Frontend sends `userId` in request body (currently unused by backend).
        *   `[COMPLETED]` Frontend sends Authorization header with Clerk JWT.
        *   `[FIX REQUIRED]` **Backend:** Lambda A (`RenoMate-GeneratePresignedUrl`) code correctly reads `userId` from authorizer context (`event.requestContext.authorizer.jwt.claims.sub`), BUT the context is missing because the authorizer is **not attached** to the `POST /generate-upload-url` route in API Gateway. Needs API Gateway configuration update.
    2.  **Upload Flow UI Enhancement (`NewProject.tsx` / `RoomPhotoUpload.tsx`):**
        *   `[ ]` After image capture/selection, display a "Preview Your Photo" step.
        *   `[ ]` This step should show the selected image preview.
        *   `[ ]` Include a "Retake" button (clears the selected image/re-enables capture/selection).
        *   `[ ]` Include a "Continue" button (enabled only after successful upload).
        *   `[ ]` Clicking "Continue" should navigate the user to the next step in the flow (e.g., "What room are you looking to flip?" screen).
        *   `[ ]` Ensure the upload to S3 happens *before* the "Continue" button is enabled or clicked (e.g., trigger upload upon preview confirmation or automatically after selection).
    3.  **"My Photos" Feature:**
        *   `[COMPLETED]` **Backend:** Create a new API endpoint (e.g., `GET /my-photos`) and a corresponding Lambda function (`RenoMate-ListUserPhotos`).
        *   `[COMPLETED]` **Backend Lambda:** The Lambda should authenticate the user (Clerk JWT), list objects in S3 under the `uploads/{userId}/` prefix, and return the list (potentially with pre-signed GET URLs). Requires `s3:ListBucket` and potentially `s3:GetObject` permissions.
        *   `[COMPLETED]` **Frontend (`TabsContent.tsx`):** Fetch user photos from `GET /my-photos` using `useEffect` and `useAuth` for token (using JWT Template).
        *   `[COMPLETED]` **Frontend (`TabsContent.tsx`):** Implement loading, error, and empty states.
        *   `[COMPLETED]` **Frontend (`TabsContent.tsx`):** Display fetched photos in a grid using pre-signed URLs.

*   **Next Steps (Immediate Frontend Focus):**
    1.  `[COMPLETED]` Implement User Association changes in the upload component.
    2.  `[COMPLETED]` Implement the "Preview Your Photo" UI flow with "Retake" and "Continue" navigation.
    3.  `[COMPLETED]` Implement the "My Photos" feature (frontend component fetching and display logic).
    4.  `[PENDING]` Implement the Process Image Lambda function (`Lambda B`) (triggered by S3 upload).
    5.  `[PENDING]` Implement the Status/Results Lambda function (`Lambda C`) and frontend polling.
    6.  `[PENDING]` Complete Frontend Integration (results display, loading states).
    7.  `[PENDING]` Security Hardening (JWT validation, CORS, rate limiting).
        *   `[COMPLETED]` API Gateway JWT validation with Clerk Authorizer configured.
    8.  `[PENDING]` Testing and Quality Assurance.

*   **Goal:** Implement secure image upload flow with camera capture, file selection, preview, and user association.
*   **Components:**
    *   `ImageUpload.tsx` / `RoomPhotoUpload.tsx`: Core upload/preview component.
    *   `NewProject.tsx`: Project creation flow with photo capture/upload UI
    *   `ImageUploader.tsx`: Reusable UI component for file selection

*   **Implementation Steps:**
    1. **Camera Integration:**
        *   Use HTML5 `capture="environment"` attribute for mobile camera access
        *   Handle camera permissions and errors gracefully
        *   Support both front and back cameras where available

    2. **File Selection:**
        *   Support common image formats (JPG, PNG, WEBP)
        *   Implement file size validation (max 5MB)
        *   Show image preview before upload
        *   Allow image removal/cancellation

    3. **Upload Flow:**
        *   When user selects image (via camera or file picker):
            1. Validate file (size, type)
            2. Show preview
            3. Get pre-signed URL from API Gateway
            4. Upload to S3 using pre-signed URL
            5. Trigger AI generation process
            6. Poll for completion
            7. Show result

    4. **Error Handling:**
        *   Camera permission errors
        *   File validation errors
        *   Upload failures
        *   Network issues
        *   Generation failures

*   **Testing Requirements:**
    1. **Unit Tests:**
        ```typescript
        // ImageUpload.test.tsx
        describe('ImageUpload', () => {
          test('validates file size', () => {
            // Test file size validation
          });
          test('validates file type', () => {
            // Test file type validation
          });
          test('handles upload success', () => {
            // Test successful upload flow
          });
          test('handles upload failure', () => {
            // Test error handling
          });
        });
        ```

    2. **Integration Tests:**
        ```typescript
        // NewProject.test.tsx
        describe('NewProject Image Upload', () => {
          test('camera capture flow', () => {
            // Test camera capture and upload
          });
          test('file selection flow', () => {
            // Test file picker and upload
          });
          test('complete project creation flow', () => {
            // Test full flow with image upload
          });
        });
        ```

    3. **E2E Tests:**
        ```typescript
        // upload.spec.ts
        describe('Image Upload Flow', () => {
          test('successful upload with camera', () => {
            // Test complete camera flow
          });
          test('successful upload with file picker', () => {
            // Test complete file picker flow
          });
          test('handles network errors', () => {
            // Test error scenarios
          });
        });
        ```

*   **Environment Variables Required:**
    ```
    VITE_API_ENDPOINT=https://jiov4el7d0.execute-api.ap-southeast-2.amazonaws.com
    VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
    ```

*   **API Endpoints Used:**
    1. `POST /generate-upload-url`
        *   Request:
            ```json
            {
              "fileName": "string",
              "contentType": "string"
            }
            ```
        *   Response:
            ```json
            {
              "uploadUrl": "string",
              "key": "string"
            }
            ```

    2. `POST /start-generation`
        *   Request:
            ```json
            {
              "key": "string"
            }
            ```
        *   Response:
            ```json
            {
              "jobId": "string"
            }
            ```

    3. `GET /generation-status/{jobId}`
        *   Response:
            ```json
            {
              "status": "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED",
              "resultUrl": "string"
            }
            ```

*   **Security Considerations:**
    1. All API requests must include Clerk JWT token
    2. File uploads use pre-signed URLs
    3. No AWS credentials in frontend code
    4. Validate file types and sizes
    5. Handle authentication errors

*   **User Experience Requirements:**
    1. Show loading states during:
        *   File selection
        *   Upload process
        *   Generation process
    2. Provide clear error messages
    3. Allow upload cancellation
    4. Show upload progress
    5. Preview image before upload
    6. Support mobile and desktop

*   **Performance Requirements:**
    1. Image preview should be immediate
    2. Upload should start within 1 second
    3. Status polling every 2 seconds
    4. Maximum upload time of 30 seconds
    5. Maximum generation time of 5 minutes

## 4. Future Enhancements / Refactoring

*   **Upload Component Refactoring:** Review `RoomPhotoUpload.tsx` / `NewProject.tsx` for potential simplification of state management during the multi-step upload process (e.g., using a state machine or breaking into smaller components).
*   **Error Handling Granularity:** Improve specificity of error messages displayed to the user based on different failure points (upload, generation, API errors).
*   **Code Splitting:** Implement code splitting (e.g., route-based) to reduce initial bundle size and improve loading performance.
*   **Testing Coverage:** Increase unit and integration test coverage, particularly for complex UI interactions and API integrations.
*   **Backend Scalability:** Evaluate and implement strategies for handling increased load on Lambda functions and potential bottlenecks (e.g., concurrency limits, database capacity).