# RideBook Backend Deployment Guide (AWS EC2)

This guide outlines step-by-step instructions for deploying your Node.js, Express, and Socket.io backend to an **AWS EC2 (Ubuntu Linux)** instance for free under the 12-Month AWS Free Tier.

---

## Step 1: Sign Up for AWS
1. Go to [aws.amazon.com](https://aws.amazon.com/) and click **Create an AWS Account**.
2. Enter your details and verify your identity using your Debit/Credit card (AWS will perform a small test charge of ₹2 / $1 and refund it).
3. Select the **Basic Support - Free** plan.

---

## Step 2: Launch an EC2 Instance (Virtual Server)
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. In the top search bar, type **EC2** and select **EC2**.
3. Click the orange **Launch Instance** button.
4. Configure the instance settings:
   - **Name**: `ridebook-backend`
   - **Application and OS Image (AMI)**: Select **Ubuntu** (Ubuntu Server 22.04 LTS or 24.04 LTS - *Free tier eligible*).
   - **Instance Type**: Select `t2.micro` (or `t3.micro` depending on region - *Free tier eligible*).
   - **Key Pair (login)**: Click **Create new key pair**, name it `ridebook-key`, select `.pem`, and click **Create key pair**. *(Save the downloaded `.pem` file safely on your computer)*.
   - **Network Settings (Security Group)**:
     - Check **Allow SSH traffic from Anywhere** (0.0.0.0/0).
     - Check **Allow HTTP traffic from the internet**.
     - Check **Allow HTTPS traffic from the internet**.
5. Click **Launch Instance**.

---

## Step 3: Open Port 5000 in Security Group
Your backend listens on port `5000`. You must open port `5000` in AWS firewall:
1. Go to **EC2 Dashboard** -> **Instances** -> Click on `ridebook-backend`.
2. Click the **Security** tab at the bottom -> Click on the **Security Group** link.
3. Click **Edit inbound rules**.
4. Click **Add rule**:
   - **Type**: Custom TCP
   - **Port Range**: `5000`
   - **Source**: Anywhere-IPv4 (`0.0.0.0/0`)
5. Click **Save rules**.

---

## Step 4: Connect to Server & Install Node.js
1. Go back to **Instances** in EC2 Dashboard, select `ridebook-backend`, and click **Connect** at the top.
2. Select **EC2 Instance Connect** and click **Connect**. A terminal window will open directly in your web browser!
3. Run the following commands in the web terminal to update packages and install Node.js:

```bash
# Update Ubuntu package lists
sudo apt update && sudo apt upgrade -y

# Install Node.js (v20 LTS) & Git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git
```

Verify installation:
```bash
node -v
npm -v
```

---

## Step 5: Clone Project & Set Up Backend
1. Clone your GitHub repository on the EC2 server:
```bash
git clone https://github.com/SimranKausal/RideBook.git
cd RideBook/Backend
npm install
```

2. Create the `.env` file inside `Backend`:
```bash
nano .env
```
Paste the following environment variables:
```env
PORT=5000
MONGO_URI=mongodb+srv://kaushalsimran620_db_user:Simran252001@cluster0.a0fxt2w.mongodb.net/?appName=Cluster0
FIREBASE_API_KEY=AIzaSyDfY1gsF3JQRJZxYhiZl2NBxN4qY9nFe58
NODE_ENV=production
```
Press `Ctrl + O`, hit `Enter` to save, then press `Ctrl + X` to exit `nano`.

---

## Step 6: Keep Backend Running 24/7 with PM2
Install **PM2** (Process Manager) so your backend runs 24/7 in the background and restarts automatically if the server reboots:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the server with PM2
pm2 start src/server.js --name "ridebook-backend"

# Enable PM2 to auto-start on EC2 system reboot
pm2 startup
# Copy and run the command printed by PM2 startup, then run:
pm2 save
```

Your server is now live 24/7!

---

## Step 7: Get Your Public AWS Server URL
1. In the EC2 Dashboard -> **Instances**, select your running instance.
2. Look for **Public IPv4 address** (e.g. `13.233.45.67`).
3. Your live API URL is: `http://13.233.45.67:5000` (Replace `13.233.45.67` with your actual EC2 public IP).

---

## Step 8: Update Mobile Apps (`config.js`)
Open `RideApp/src/config.js` and `DriverApp/src/config.js` on your computer:

```javascript
const ACTIVE_PROD_PROVIDER = 'alternative'; 

const AZURE_URL = 'https://ridebook-api.azurewebsites.net';
const ALTERNATIVE_URL = 'http://YOUR_EC2_PUBLIC_IP:5000'; // Replace with your AWS EC2 Public IP
```

Your mobile app will now connect directly to your live AWS server!
