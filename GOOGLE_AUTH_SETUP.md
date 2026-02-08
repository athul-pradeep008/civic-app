# Google Authentication Setup Guide

To enable "Sign in with Google", you need to create a Google Cloud Project and get a **Client ID**.

## Step 1: Create a Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown (top left) and select **New Project**.
3. Name it `Civic Issue Reporter` and click **Create**.

## Step 2: Configure OAuth Consent Screen
1. In the side menu, go to **APIs & Services > OAuth consent screen**.
2. Select **External** and click **Create**.
3. Fill in:
   - **App Name**: Civic Issue Reporter
   - **User Support Email**: Select your email.
   - **Developer Contact Information**: Enter your email.
4. Click **Save and Continue** until you finish (you don't need to add scopes for basic login).

## Step 3: Create Credentials (Client ID)
1. Go to **APIs & Services > Credentials**.
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
3. **Application Type**: Select **Web application**.
4. **Name**: `Civic Web Client`.
5. **Authorized JavaScript Origins**:
   - Add `http://localhost:5002`
   - Add `https://civic-issue-reporting-system.onrender.com` (or your production URL)
6. **Authorized Redirect URIs**:
   - (Leave blank for this popup-based login, or add the same URLs as above).
7. Click **Create**.

## Step 4: Add to Environment Variables
1. Copy the **Client ID** (it looks like `12345...apps.googleusercontent.com`).
2. Open your `.env` file in the project root.
3. Paste it:
   ```env
   GOOGLE_CLIENT_ID=your_copied_client_id_here
   ```
4. **Restart your server** (`Ctrl+C` then `npm run dev`).

## Step 5: Verify
1. Go to the login page.
2. The "Sign in with Google" button should now appear (the "Demo Mode" button will disappear).
