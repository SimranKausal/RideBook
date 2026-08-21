# RideBook Backend Deployment Guide (Koyeb)

This guide outlines the step-by-step instructions for deploying your Node.js, Express, and Socket.io backend to **Koyeb**.

---

## Prerequisites
- A GitHub repository containing the `RideBook` project.
- A free account on [Koyeb](https://www.koyeb.com/) (you can sign up with GitHub).
- An active MongoDB Atlas cluster connection string.

---

## Step 1: Create a Koyeb App & Service
1. Log in to your [Koyeb Dashboard](https://app.koyeb.com/).
2. Click **Create App** or **Create Service**.
3. Select **GitHub** as the deployment method.
4. Choose your repository containing the `RideBook` codebase.

---

## Step 2: Configure Service Settings
Under the deployment configuration screen:

- **Service Name**: `ridebook-backend` (This will create your URL: `https://ridebook-backend-<your-username>.koyeb.app`)
- **Instance Type**: Select **Eco (Nano)** (This is the free instance).
- **Region**: Choose a region closest to your users (e.g. *Washington, D.C. (US)* or *Frankfurt (Europe)*).
- **Builder**: Select **Buildpack** (Koyeb will automatically detect Node.js).
- **Work Directory**: Set this to `/Backend` (or `Backend`)  
  > [!IMPORTANT]  
  > Setting the Work Directory to `Backend` is **CRITICAL** because your monorepo contains multiple folders. This tells Koyeb to run all commands and install dependencies relative to the `Backend` folder.

---

## Step 3: Configure Environment Variables
Scroll down to the **Environment Variables** section and add the following keys:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Optimizes Express performance for production |
| `MONGO_URI` | `mongodb+srv://kaushalsimran620_db_user:Simran252001@cluster0.a0fxt2w.mongodb.net/?appName=Cluster0` | Connection string for MongoDB Atlas |
| `FIREBASE_API_KEY` | `AIzaSyDfY1gsF3JQRJZxYhiZl2NBxN4qY9nFe58` | Firebase project API key for OTP verification |

---

## Step 4: Configure App Ports
Koyeb needs to know which port to route web traffic to.
1. Under the **Ports** section, Koyeb defaults to port `8000` with path `/`.
2. Leave the port as `8000`. Koyeb will inject this port automatically into `process.env.PORT`. Since our backend server code listens to `process.env.PORT || 5000`, the server will automatically bind to port `8000` as Koyeb expects.
3. Ensure the protocol is set to **HTTP** (Koyeb handles SSL/HTTPS encryption automatically).

---

## Step 5: Deploy
Click **Deploy** at the bottom of the page. Koyeb will build the app and deploy it.

---

## Step 6: Connecting the Mobile Apps
Once the Koyeb service shows as **Healthy**:

1. Copy the public URL provided by Koyeb (e.g. `https://ridebook-backend-<username>.koyeb.app`).
2. Open `RideApp/src/config.js` and `DriverApp/src/config.js` in your editor.
3. Update the `RENDER_URL` variable (we can reuse this variable name or change it):
   ```javascript
   const RENDER_URL = 'https://ridebook-backend-<username>.koyeb.app'; // Replace with your Koyeb URL
   ```
4. Set the toggle `ACTIVE_PROD_PROVIDER` to `'render'` (or whichever provider matches the active URL):
   ```javascript
   const ACTIVE_PROD_PROVIDER = 'render';
   ```
5. Commit and push the changes to GitHub. The mobile apps will now communicate with your live Koyeb backend.
