# Next.js Admin Panel with Firebase

Production-ready admin panel using **Next.js 15+**, **Firebase Auth (Google Sign-In)**, and **Firestore**.

## Features

### 🔐 Authentication & Authorization
- Google Sign-In via Firebase Auth
- Role-based access control (super_admin, admin, editor)
- Protected admin routes
- Automatic admin status verification

### 📊 Dashboard
- Real-time statistics cards
- Quick stats overview
- Admin information display

### 📝 CRUD Modules
Complete management for:
- **Events** - Create, read, update, delete, search, filter, toggle status
- **Batches** - Full CRUD with pagination
- **Courses** - Complete content management
- **Tests** - Assessment management

### 🛠️ Features per Module
- ✅ List with search & filter
- ✅ Create new items
- ✅ Edit existing items
- ✅ Delete with confirmation
- ✅ Status toggle (active/inactive)
- ✅ Pagination support
- ✅ Timestamps (createdAt, updatedAt)
- ✅ Admin metadata (createdBy, updatedBy)

### 🎨 UI/UX
- Responsive admin layout with sidebar + topbar
- Mobile-friendly design
- Loading states
- Empty states
- Toast notifications
- Error boundaries
- Confirmation dialogs

## Tech Stack

### Frontend
- **Next.js 15+** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Sonner** - Toast notifications
- **Lucide React** - Icons

### Backend
- **Firebase Authentication** - Google Sign-In
- **Cloud Firestore** - NoSQL database

## Getting Started

### 1. Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project with Google Auth enabled

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 3. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Enable **Google Authentication**
4. Create **Firestore Database** (Production mode)
5. Copy Firebase configuration

### 4. Configure Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Add your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. Deploy Firestore Security Rules

Copy and deploy these rules in Firebase Console:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null &&
        exists(/databases/$(database)/documents/admin_users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/admin_users/$(request.auth.uid)).data.active == true;
    }

    match /admin_users/{uid} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }

    match /events/{docId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    match /batches/{docId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    match /courses/{docId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    match /tests/{docId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 6. Create Firestore Collections

Create these collections with sample documents:

**admin_users**
```json
{
  "uid": "user-uid",
  "email": "admin@example.com",
  "role": "super_admin",
  "active": true,
  "permissions": ["events.read", "events.write", ...]
}
```

### 7. Add Admin User

1. Sign in with Google at `/login`
2. Add your account to Firestore `admin_users` collection
3. Set `active: true`

## Project Structure

```
src/
├── app/
│   ├── login/page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── events/
│   │   ├── batches/
│   │   ├── courses/
│   │   └── tests/
│   ├── layout.tsx
│   └── page.tsx
├── components/admin/
│   ├── AdminLayout.tsx
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   ├── DataTable.tsx
│   ├── EntityForm.tsx
│   ├── ConfirmDialog.tsx
│   └── ProtectedRoute.tsx
├── lib/
│   ├── firebase.ts
│   ├── auth-context.tsx
│   ├── auth-guards.ts
│   ├── firestore-service.ts
│   └── services/
│       ├── events.ts
│       ├── batches.ts
│       ├── courses.ts
│       └── tests.ts
├── schemas/index.ts
└── types/index.ts
```

## Deployment on Vercel

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy
5. Add Vercel domain to Firebase authorized domains

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Tailwind CSS](https://tailwindcss.com/docs)
