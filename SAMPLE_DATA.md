# Sample Firestore Data

This file contains sample data structure for Firestore collections.
You can manually create these documents or use them as reference for your data.

## Collection: admin_users

### Document ID: [YOUR_FIREBASE_UID]

```json
{
  "uid": "user-firebase-uid",
  "email": "admin@example.com",
  "role": "super_admin",
  "active": true,
  "permissions": [
    "events.read",
    "events.write",
    "batches.read",
    "batches.write",
    "courses.read",
    "courses.write",
    "tests.read",
    "tests.write"
  ],
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T10:00:00.000Z"
}
```

---

## Collection: events

### Document 1: Tech Conference 2024

```json
{
  "title": "Tech Conference 2024",
  "description": "Annual technology conference featuring keynotes from industry leaders, workshops, and networking sessions.",
  "thumbnail": "https://images.unsplash.com/photo-1540575467063-178f50002dc4?w=400",
  "status": "active",
  "createdAt": "2024-01-15T09:30:00.000Z",
  "updatedAt": "2024-01-15T09:30:00.000Z",
  "createdBy": "admin-uid",
  "updatedBy": "admin-uid"
}
```

### Document 2: Web Development Workshop

```json
{
  "title": "Web Development Workshop",
  "description": "Hands-on workshop covering modern web development practices including React, Node.js, and deployment strategies.",
  "thumbnail": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400",
  "status": "active",
  "createdAt": "2024-02-20T14:00:00.000Z",
  "updatedAt": "2024-02-20T14:00:00.000Z",
  "createdBy": "admin-uid",
  "updatedBy": "admin-uid"
}
```

---

## Collection: batches

### Document 1: Batch 2024-Q1

```json
{
  "title": "Batch 2024-Q1",
  "description": "First quarter batch of students enrolled for our comprehensive training program starting January 2024.",
  "status": "active",
  "createdAt": "2024-01-05T08:00:00.000Z",
  "updatedAt": "2024-01-05T08:00:00.000Z",
  "createdBy": "admin-uid",
  "updatedBy": "admin-uid"
}
```

### Document 2: Batch 2024-Q2

```json
{
  "title": "Batch 2024-Q2",
  "description": "Second quarter batch starting April 2024 with advanced curriculum and mentorship program.",
  "status": "inactive",
  "createdAt": "2024-03-01T10:30:00.000Z",
  "updatedAt": "2024-03-01T10:30:00.000Z",
  "createdBy": "admin-uid",
  "updatedBy": "admin-uid"
}
```

---

## Collection: courses

### Document 1: React Advanced

```json
{
  "title": "React Advanced",
  "description": "Deep dive into advanced React concepts including hooks, context, performance optimization, and testing strategies for production applications.",
  "status": "active",
  "createdAt": "2024-01-10T11:00:00.000Z",
  "updatedAt": "2024-01-10T11:00:00.000Z",
  "createdBy": "admin-uid",
  "updatedBy": "admin-uid"
}
```

### Document 2: Full Stack Development

```json
{
  "title": "Full Stack Development",
  "description": "Complete course covering frontend with React, backend with Node.js, databases, and deployment on cloud platforms.",
  "status": "active",
  "createdAt": "2024-02-01T13:30:00.000Z",
  "updatedAt": "2024-02-01T13:30:00.000Z",
  "createdBy": "admin-uid",
  "updatedBy": "admin-uid"
}
```

### Document 3: Mobile Development

```json
{
  "title": "Mobile Development",
  "description": "Introduction to mobile app development using React Native for both iOS and Android platforms.",
  "status": "inactive",
  "createdAt": "2024-02-15T09:00:00.000Z",
  "updatedAt": "2024-02-15T09:00:00.000Z",
  "createdBy": "admin-uid",
  "updatedBy": "admin-uid"
}
```

---

## Collection: tests

### Document 1: React Basics Assessment

```json
{
  "title": "React Basics Assessment",
  "description": "Assessment covering React fundamentals including JSX, components, props, state, and lifecycle methods.",
  "status": "active",
  "createdAt": "2024-01-20T10:00:00.000Z",
  "updatedAt": "2024-01-20T10:00:00.000Z",
  "createdBy": "admin-uid",
  "updatedBy": "admin-uid"
}
```

### Document 2: Full Stack Project Evaluation

```json
{
  "title": "Full Stack Project Evaluation",
  "description": "Final project evaluation where students build a complete full-stack application and present to evaluators.",
  "status": "active",
  "createdAt": "2024-03-01T14:00:00.000Z",
  "updatedAt": "2024-03-01T14:00:00.000Z",
  "createdBy": "admin-uid",
  "updatedBy": "admin-uid"
}
```

### Document 3: Advanced JavaScript Test

```json
{
  "title": "Advanced JavaScript Test",
  "description": "Test covering advanced JavaScript concepts like closures, prototypes, async/await, and design patterns.",
  "status": "inactive",
  "createdAt": "2024-02-10T11:30:00.000Z",
  "updatedAt": "2024-02-10T11:30:00.000Z",
  "createdBy": "admin-uid",
  "updatedBy": "admin-uid"
}
```

---

## How to Add This Data

### Method 1: Manual Creation via Firebase Console

1. Go to Firebase Console → Firestore Database
2. For each collection:
   - Click "+ Add collection"
   - Enter collection name
   - Click "Add documents"
3. Copy-paste the JSON data above

### Method 2: Firebase CLI (Advanced)

Create a `seed.js` file and run it with Node:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const data = {
  events: [
    {
      title: "Tech Conference 2024",
      // ... rest of data
    },
  ],
  // ... other collections
};

async function seedDatabase() {
  for (const [collection, documents] of Object.entries(data)) {
    for (const doc of documents) {
      await db.collection(collection).add(doc);
    }
  }
  console.log('Database seeded successfully');
}

seedDatabase().catch(console.error);
```

### Method 3: Firestore Import (Backup/Restore)

1. Export your existing Firestore data (if any)
2. Use Google Cloud Console to import JSON files
3. Follow the Firestore import documentation

---

## Notes

- Replace `admin-uid` with your actual Firebase UID
- Replace `admin@example.com` with your email
- Use `2024-01-01T10:00:00.000Z` format for timestamps
- `createdBy` and `updatedBy` should be set to your Firebase UID
- Thumbnail URLs should be valid and publicly accessible
- `status` should be either `"active"` or `"inactive"`
- `role` for admin users should be `"super_admin"`, `"admin"`, or `"editor"`

---

## Timestamp Format

All timestamps use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

Or use Firestore server timestamp:
```javascript
createdAt: admin.firestore.FieldValue.serverTimestamp()
```

---

Last Updated: May 2026
