# Setup Guide - Next.js Admin Panel

Complete step-by-step guide to set up the admin panel.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Project Setup](#firebase-project-setup)
3. [Environment Configuration](#environment-configuration)
4. [Local Development](#local-development)
5. [Create Admin User](#create-admin-user)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm or yarn**: Package manager
- **Firebase account**: Free tier works
- **Email account**: For authentication
- **Code editor**: VS Code recommended

### Check Node Version

```bash
node --version  # Should be v18.0.0 or higher
npm --version
```

---

## Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name (e.g., "Admin Panel")
4. Follow the setup wizard
5. Click **"Create project"**

### Step 2: Enable Email/Password Authentication

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **"Get Started"** or **"Sign-in method"**
3. Open the **Email/Password** provider
4. Toggle **"Enable"**
5. Click **"Save"**

### Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database** (left sidebar)
2. Click **"Create database"**
3. Choose **"Production mode"**
4. Select your region (closest to your location)
5. Click **"Create"**

### Step 4: Get Firebase Configuration

1. Go to **Project Settings** (gear icon, top right)
2. Scroll to **"Your apps"** section
3. Click **"Web"** (</> icon) if not already added
4. Copy the Firebase config
5. Save for next step

Example config format:
```javascript
{
  apiKey: "AIzaSyDxxx...",
  authDomain: "project-id.firebaseapp.com",
  projectId: "project-id",
  storageBucket: "project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
}
```

---

## Environment Configuration

### Step 1: Clone/Copy Project

```bash
# Navigate to project directory
cd adminforclass
```

### Step 2: Create Environment File

```bash
# Copy example file
cp .env.example .env.local
```

### Step 3: Fill Environment Variables

Open `.env.local` and add your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDxxx...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef...
```

**⚠️ Important**: 
- Never commit `.env.local` to version control
- Keep these credentials secure
- These variables are prefixed with `NEXT_PUBLIC_` so they're safe for client-side use

---

## Local Development

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- Next.js, React, React-DOM
- Firebase SDK
- Zod, React Hook Form
- Tailwind CSS, Lucide Icons
- And other dependencies

### Step 2: Run Development Server

```bash
npm run dev
```

Expected output:
```
> admin-panel@1.0.0 dev
> next dev

  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.3s
```

### Step 3: Test Application

3. Open [http://localhost:3000](http://localhost:3000)
4. You should see the home page
5. Click **"Sign In"** button
6. Enter your admin email and password on the login page

### Step 4: Deploy Security Rules

Before adding admin users, deploy Firestore security rules:

1. In Firebase Console, go to **Firestore Database**
2. Click **"Rules"** tab
3. Replace existing rules with content from `firestore.rules` file
4. Click **"Publish"**

**Or use Firebase CLI:**

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules from firestore.rules file
firebase deploy --only firestore:rules
```

---

## Create Admin User

### Step 1: Add User to Firebase Auth

1. Open Firebase Console
2. Go to **Authentication** > **Users**
3. Click **"Add user"**
4. Enter the admin email and password
5. Save the user and copy the generated UID

### Step 2: Create Admin Document

1. Click **"+ Add document"**
2. Set Document ID to the UID copied from Firebase Auth
3. Add these fields:

| Field | Type | Value |
|-------|------|-------|
| `email` | String | your-email@example.com |
| `role` | String | `super_admin` |
| `active` | Boolean | `true` |
| `permissions` | Array | `["events.read", "events.write", "batches.read", "batches.write", "courses.read", "courses.write", "tests.read", "tests.write"]` |

5. Click **"Save"**

### Step 3: Test Login

1. Refresh [http://localhost:3000](http://localhost:3000)
2. Click **"Sign In"**
3. Sign in with the email and password you created in Firebase Auth
4. Should redirect to `/admin/dashboard`

---

## Deployment

### Deploy on Vercel

#### Prerequisites
- GitHub account
- Vercel account (free)

#### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial admin panel setup"
git remote add origin https://github.com/yourusername/admin-panel.git
git push -u origin main
```

#### Step 2: Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Select your GitHub repo
4. Vercel auto-detects Next.js configuration

#### Step 3: Add Environment Variables

1. In Vercel project settings, go to **"Environment Variables"**
2. Add all Firebase credentials from `.env.local`

```
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
... (all 6 variables)
```

#### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Get your production URL

#### Step 5: Update Firebase

1. In Firebase Console, go to **Authentication** > **Settings**
2. Scroll to **"Authorized domains"**
3. Click **"Add domain"**
4. Add your Vercel domain: `your-app.vercel.app`
5. Save

---

## Troubleshooting

### Issue: "Access Denied" After Login

**Solution**:
- Verify your account exists in `admin_users` collection
- Check `active` field is `true`
- Verify `email` matches your Firebase Auth account email
- Restart the app after adding admin user

### Issue: Firestore Operations Failing

**Solution**:
- Verify security rules are deployed
- Check collections exist in Firestore
- Open browser DevTools Console for error messages
- Ensure user is in `admin_users` collection

### Issue: Environment Variables Not Loading

**Solution**:
- Verify `.env.local` exists in project root
- Restart dev server after adding variables
- Check variable names start with `NEXT_PUBLIC_`
- Don't forget to add `.env.local` to `.gitignore`

### Issue: Email/Password Sign-In Not Working

**Solution**:
- Verify Email/Password provider enabled in Firebase
- Check authorized domains include `localhost:3000`
- Verify Firebase credentials are correct
- Check browser console for error details

### Issue: Build Errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

### Issue: Firestore Rules Not Deploying

**Solution**:
```bash
# Verify Firebase CLI is installed
firebase --version

# Login again
firebase login --reauth

# Retry deployment
firebase deploy --only firestore:rules
```

---

## Verification Checklist

Before considering setup complete, verify:

- [ ] Firebase project created
- [ ] Email/Password authentication enabled
- [ ] Firestore database created (Production mode)
- [ ] `.env.local` file created with Firebase credentials
- [ ] Dev server runs: `npm run dev`
- [ ] Home page loads at http://localhost:3000
- [ ] Sign-in button works
- [ ] Admin user added to Firestore
- [ ] Can log in and access `/admin/dashboard`
- [ ] Dashboard loads without errors
- [ ] Can create/edit/delete items in modules
- [ ] Search and filter work
- [ ] Pagination works
- [ ] Status toggle works

---

## Next Steps

After successful setup:

1. **Customize**: Modify components to match your brand
2. **Add Fields**: Extend schemas for additional data
3. **Invite Users**: Add more admin accounts
4. **Monitor**: Set up Firebase analytics and logging
5. **Backup**: Enable Firestore automated backups
6. **Scale**: Add more modules as needed

---

## Support Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Zod Validation**: https://zod.dev

---

Last Updated: May 2026
