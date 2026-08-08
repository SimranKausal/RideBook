# RideBook Backend Deployment Guide (Render)

This guide outlines the step-by-step instructions for deploying your Node.js, Express, and Socket.io backend to **Render Web Services**.

---

## Prerequisites
- A GitHub repository containing the `RideBook` project.
- A free account on [Render](https://render.com/).
- An active MongoDB Atlas cluster connection string.

---

## Step 1: Create a Render Web Service
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** at the top right and select **Web Service**.
3. Connect your GitHub account and select your repository containing the `RideBook` codebase.

---

## Step 2: Configure Service Settings
Under the Web Service creation screen, configure the following settings:

- **Name**: `ridebook-backend` (Or any unique name you prefer. This will generate your URL: `https://ridebook-backend.onrender.com`)
- **Region**: Select a region close to your target users (e.g. *Oregon (US West)* or *Frankfurt (EU Central)*)
- **Branch**: `main` (or your active development branch)
- **Runtime**: `Node`
- **Root Directory**: `Backend`  
  > [!IMPORTANT]  
  > Setting the Root Directory to `Backend` is **CRITICAL** because your monorepo contains multiple sub-folders (`Backend`, `RideApp`, `DriverApp`). This tells Render to run all commands and install dependencies relative to the `Backend` folder.
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: `Free` (or any paid tier)

---

## Step 3: Configure Environment Variables
You need to set up environment variables so the server can connect to MongoDB Atlas and authenticate with Firebase.

1. Scroll down to the **Environment Variables** section (or click on the **Environment** tab in your Web Service dashboard after creation).
2. Add the following variables:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Optimizes Express performance for production |
| `MONGO_URI` | `mongodb+srv://kaushalsimran620_db_user:Simran252001@cluster0.a0fxt2w.mongodb.net/?appName=Cluster0` | Connection string for MongoDB Atlas |
| `FIREBASE_API_KEY` | `AIzaSyDfY1gsF3JQRJZxYhiZl2NBxN4qY9nFe58` | Firebase project API key for OTP verification |

3. Click **Create Web Service** (or **Save Changes**).

---

## Step 4: WebSockets & Socket.io
Unlike Azure App Service, **Render supports WebSockets and Socket.io out of the box** without any special configuration. There are no additional ports to open or switches to toggle. It will handle the connection automatically over HTTPS.

---

## Step 5: Connecting the Mobile Apps
Once your Render Web Service deployment is successful:

1. Copy the public URL provided by Render (e.g. `https://ridebook-backend.onrender.com`).
2. Open `RideApp/src/config.js` and `DriverApp/src/config.js` in your editor.
3. Update the `RENDER_URL` variable:
   ```javascript
   const RENDER_URL = 'https://ridebook-backend.onrender.com'; // Replace with your actual Render URL
   ```
4. Set the toggle `ACTIVE_PROD_PROVIDER` to `'render'`:
   ```javascript
   const ACTIVE_PROD_PROVIDER = 'render';
   ```
5. Build and run your mobile apps. The app will communicate with the live Render backend service when running in production (or standard emulator configuration when in `__DEV__`).
