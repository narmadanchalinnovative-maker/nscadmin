# Admin Panel - Complete Documentation

## Overview

This is a production-ready Next.js admin panel with Firebase Authentication and Firestore. It provides a complete content management system for managing events, batches, courses, and tests.

## Architecture

### Frontend Stack
```
Next.js 15+ (App Router)
├── React 18+
├── TypeScript
└── Tailwind CSS
```

### Backend Stack
```
Firebase
├── Authentication (Google Sign-In)
└── Cloud Firestore (NoSQL Database)
```

### Libraries
```
Forms & Validation
├── React Hook Form
└── Zod

UI Components
├── Sonner (Toasts)
├── Lucide React (Icons)
└── TanStack Table (Data Tables)
```

## File Structure

```
src/
├── app/
│   ├── login/
│   │   └── page.tsx                 # Google Sign-In page
│   ├── admin/
│   │   ├── layout.tsx               # Admin layout wrapper
│   │   ├── page.tsx                 # Dashboard with stats
│   │   ├── events/
│   │   │   ├── page.tsx             # List all events
│   │   │   ├── new/page.tsx         # Create event form
│   │   │   └── [id]/edit/page.tsx   # Edit event form
│   │   ├── batches/                 # Similar structure
│   │   ├── courses/                 # Similar structure
│   │   └── tests/                   # Similar structure
│   ├── layout.tsx                   # Root layout with providers
│   └── page.tsx                     # Landing page
│
├── components/admin/
│   ├── AdminLayout.tsx              # Main layout wrapper
│   ├── Sidebar.tsx                  # Navigation sidebar
│   ├── Topbar.tsx                   # Header with user info
│   ├── DataTable.tsx                # Reusable data table component
│   ├── EntityForm.tsx               # Generic form for create/edit
│   ├── ConfirmDialog.tsx            # Confirmation modal
│   └── ProtectedRoute.tsx           # Auth wrapper for routes
│
├── lib/
│   ├── firebase.ts                  # Firebase initialization
│   ├── auth-context.tsx             # Auth context & hooks
│   ├── auth-guards.ts               # Auth utility functions
│   ├── firestore-service.ts         # Generic Firestore CRUD
│   └── services/
│       ├── events.ts                # Events specific operations
│       ├── batches.ts               # Batches specific operations
│       ├── courses.ts               # Courses specific operations
│       └── tests.ts                 # Tests specific operations
│
├── schemas/
│   └── index.ts                     # Zod validation schemas
│
├── types/
│   └── index.ts                     # TypeScript interfaces
│
└── globals.css                      # Global Tailwind styles
```

## Data Models

### User Model (admin_users)
```typescript
interface AdminUser {
  uid: string;                    // Firebase UID
  email: string;                  // User email
  role: "super_admin" | "admin" | "editor";
  active: boolean;                // Can access panel
  permissions: string[];          // Feature permissions
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Base Entity (events, batches, courses, tests)
```typescript
interface BaseEntity {
  id?: string;
  title: string;
  description: string;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;             // Admin UID
  updatedBy?: string;             // Admin UID
}
```

### Event Model (extends BaseEntity)
```typescript
interface Event extends BaseEntity {
  thumbnail?: string;             // Image URL
}
```

## Key Features

### 1. Authentication Flow

```
User visits app
    ↓
AuthProvider checks Firebase auth state
    ↓
If not logged in → show home page with login button
    ↓
Click "Sign In" → redirect to /login
    ↓
Google Sign-In popup
    ↓
Verify user in admin_users collection
    ↓
If active=true → redirect to /admin/dashboard
If active=false → show "Access Denied"
```

### 2. Protected Routes

```
Route: /admin/**
    ↓
Check AuthProvider state
    ↓
If isAdmin=true → render component
If isAdmin=false → show "Access Denied"
If loading → show loading spinner
```

### 3. CRUD Operations

Each module (Events, Batches, Courses, Tests) supports:

- **List** - Display all items with pagination
- **Search** - Find items by title
- **Filter** - Filter by status
- **Create** - Add new item
- **Edit** - Modify existing item
- **Delete** - Remove item (with confirmation)
- **Status Toggle** - Switch active/inactive

### 4. Form Validation

Uses Zod schemas for runtime validation:

```typescript
// Define schema
const schema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  status: z.enum(['active', 'inactive']),
});

// React Hook Form integration
const { register, errors } = useForm({
  resolver: zodResolver(schema),
});
```

## API Reference

### Firebase Service Layer

#### Generic Operations

```typescript
// Create document
createDocument<T>(
  collectionName: string,
  data: Omit<T, 'id'>,
  userId: string
): Promise<string>

// Get document
getDocument<T>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null>

// Update document
updateDocument<T>(
  collectionName: string,
  docId: string,
  data: Partial<T>,
  userId: string
): Promise<void>

// Delete document
deleteDocument(
  collectionName: string,
  docId: string
): Promise<void>

// List with pagination
listDocuments<T>(
  collectionName: string,
  page?: number,
  limit?: number,
  filters?: Record<string, any>,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
): Promise<PaginatedResponse<T & { id: string }>>

// Search documents
searchDocuments<T>(
  collectionName: string,
  searchField: string,
  searchTerm: string,
  page?: number,
  limit?: number
): Promise<PaginatedResponse<T & { id: string }>>

// Toggle status
toggleStatus(
  collectionName: string,
  docId: string,
  currentStatus: 'active' | 'inactive',
  userId: string
): Promise<void>
```

### Event Service

```typescript
eventService.create(data: Omit<Event, 'id'>, userId: string)
eventService.get(id: string)
eventService.update(id: string, data: Partial<Event>, userId: string)
eventService.delete(id: string)
eventService.list(page?, limit?, filters?)
eventService.search(searchTerm: string, page?, limit?)
eventService.toggleStatus(id: string, currentStatus: 'active' | 'inactive', userId: string)
```

### Auth Context Hook

```typescript
const {
  user,              // Firebase User object or null
  adminUser,         // Admin user document or null
  loading,           // Loading state
  isAdmin,           // Boolean: is authenticated admin
  logout,            // Function to logout
} = useAuth();
```

### Auth Guards

```typescript
checkAdminStatus(uid: string): Promise<boolean>
getAdminUser(uid: string): Promise<AdminUser | null>
hasPermission(adminUser: AdminUser | null, permission: string): boolean
canRead(adminUser: AdminUser | null, resource: string): boolean
canWrite(adminUser: AdminUser | null, resource: string): boolean
```

## Component Props

### DataTable
```typescript
interface DataTableProps<T extends BaseEntity> {
  data: PaginatedResponse<T & { id: string }>;
  onEdit: (item: T & { id: string }) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: 'active' | 'inactive') => void;
  onPageChange: (page: number) => void;
  loading?: boolean;
}
```

### EntityForm
```typescript
interface EntityFormProps<T extends ZodSchema> {
  schema: T;
  defaultValues?: Record<string, any>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  title: string;
  fields: FormField[];
  loading?: boolean;
}
```

## Firestore Collections

### admin_users
```
Document ID: Firebase UID
{
  email: string
  role: string
  active: boolean
  permissions: string[]
  createdAt: timestamp
  updatedAt: timestamp
}
```

### events, batches, courses, tests
```
{
  title: string
  description: string
  thumbnail: string (events only)
  status: string
  createdAt: timestamp
  updatedAt: timestamp
  createdBy: string
  updatedBy: string
}
```

## Security

### Firestore Rules
- Admin users verified by checking `admin_users` collection
- Only authenticated admins can write
- Public can read (except admin_users)
- All other collections denied by default

### Environment Variables
- Firebase credentials prefixed with `NEXT_PUBLIC_` are safe for client-side
- Never expose sensitive data without `NEXT_PUBLIC_` prefix
- Always use `.env.local` (never commit)

## Performance Considerations

1. **Pagination**: Max 100 items per page
2. **Search**: Prefix matching on title field
3. **Caching**: Consider adding caching for frequently accessed data
4. **Indexes**: Firestore auto-creates indexes for common queries
5. **Real-time**: Could add real-time listeners for live updates

## Customization Guide

### Add New Module

1. Create service file: `src/lib/services/newmodule.ts`
2. Create type: Add to `src/types/index.ts`
3. Create schema: Add to `src/schemas/index.ts`
4. Create routes: `src/app/admin/newmodule/`
   - `page.tsx` (list)
   - `new/page.tsx` (create)
   - `[id]/edit/page.tsx` (edit)
5. Add menu item to Sidebar.tsx

### Add Custom Fields

1. Update type interface
2. Add Zod schema validation
3. Add form fields to EntityForm
4. Update component to display field

### Customize Theme

Edit `src/globals.css` or Tailwind config to change:
- Colors (blue-600 → your-color)
- Spacing
- Typography
- Breakpoints

## Deployment Checklist

- [ ] All environment variables added
- [ ] Firebase project created
- [ ] Google auth enabled
- [ ] Firestore rules deployed
- [ ] Admin users created
- [ ] Domain added to Firebase authorized domains
- [ ] Build completes without errors
- [ ] Login tested in production
- [ ] CRUD operations tested
- [ ] Mobile responsiveness verified
- [ ] Performance tested
- [ ] Backup strategy planned

## Troubleshooting

### Common Issues

1. **403 Forbidden Firestore errors**
   - Check security rules are deployed
   - Verify user is in admin_users collection
   - Ensure active=true

2. **Auth state persists after logout**
   - Check AuthProvider is at root level
   - Verify logout function is called

3. **Slow search/list queries**
   - Create Firestore index for common queries
   - Reduce pagination limit
   - Add caching

4. **Images not loading**
   - Verify thumbnail URL is valid
   - Check CORS settings

## Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY          # Public API key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN      # Auth domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID       # Project ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET   # Storage bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID  # Sender ID
NEXT_PUBLIC_FIREBASE_APP_ID           # App ID
```

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | May 2026 | Initial release |

## Support

For issues and questions:
- Check Firebase docs: https://firebase.google.com/docs
- Check Next.js docs: https://nextjs.org/docs
- Review code comments in relevant files
- Check console errors in browser DevTools

## License

MIT

---

**Last Updated**: May 2026
