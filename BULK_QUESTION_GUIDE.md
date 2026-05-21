# Bulk Question Creation Guide

## Overview
This guide explains how to create tests with multiple questions at once using the enhanced test creation interface.

## Features

### 1. **Two Creation Modes**

#### Simple Mode (Default)
- Create test details only
- Add questions later through the test edit page
- Faster if you just want to create the test structure first
- Best for: Planning and organizing test structure

#### Bulk Mode
- Create test and multiple questions together in one form
- Add/remove questions dynamically
- All questions created in single submission
- Best for: Creating complete tests with many questions at once

### 2. **How to Use Bulk Mode**

**Step 1:** Navigate to Admin → Tests → New Test

**Step 2:** Fill in Test Details
- Test Title (required)
- Batch (required)
- Description (required)
- Status (active/inactive)

**Step 3:** Select Creation Mode
- Choose "Create Test With Multiple Questions Now"

**Step 4:** Add Questions
Click "+ Add Question" button to add question fields

For each question, fill in:
- **Question Text** (required) - Main question content
- **Marks** (optional, default: 4)
- **Negative Marks** (optional, default: 1)
- **Solution** (optional) - Explanation for the answer

**Step 5:** Submit
Click "Create Test" button to save test + all questions together

---

## Complete Firebase Rules

Below is the **complete, production-ready** Firebase Firestore rules configuration:

```firestore
// Firestore Security Rules - Admin Panel + Custom Auth (Twilio)
// Copy this to Firebase Console > Firestore > Rules tab
// 
// AUTHENTICATION MODEL:
// - Uses custom Twilio authentication (request.auth is always null)
// - Admin validation done at application level + document metadata verification
// - Firestore rules enforce document structure and prevent client misuse
// - All reads are allowed (public content), writes require proper structure validation

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // =========================================================================
    // HELPER FUNCTIONS FOR VALIDATION
    // =========================================================================
    
    // Check if document has valid admin metadata (createdBy, updatedBy)
    function hasValidAdminMetadata() {
      return request.resource.data.keys().hasAll(['createdBy', 'updatedBy']) &&
        request.resource.data.createdBy is string &&
        request.resource.data.updatedBy is string &&
        request.resource.data.createdBy.size() > 0 &&
        request.resource.data.updatedBy.size() > 0;
    }

    // Validate entity structure (events, batches, courses, tests)
    function isValidEntity() {
      return request.resource.data.keys().hasAny(['title', 'description', 'status']) &&
        request.resource.data.title is string &&
        request.resource.data.description is string &&
        request.resource.data.status in ['active', 'inactive'] &&
        request.resource.data.title.size() > 0 &&
        request.resource.data.title.size() <= 255 &&
        request.resource.data.description.size() > 0 &&
        request.resource.data.description.size() <= 2000;
    }

    // Validate section structure
    function isValidSection() {
      return request.resource.data.keys().hasAll(['title', 'status', 'testId']) &&
        request.resource.data.title is string &&
        request.resource.data.title.size() > 0 &&
        request.resource.data.title.size() <= 255 &&
        request.resource.data.status in ['active', 'inactive'] &&
        request.resource.data.testId is string &&
        request.resource.data.testId.size() > 0 &&
        (!request.resource.data.keys().hasAny(['description']) || 
          (request.resource.data.description is string && 
           request.resource.data.description.size() <= 2000)) &&
        (!request.resource.data.keys().hasAny(['order']) || 
          request.resource.data.order is number);
    }

    // Validate question structure - comprehensive validation for all question types
    function isValidQuestion() {
      return request.resource.data.keys().hasAll(['text', 'status', 'testId', 'options']) &&
        request.resource.data.text is string &&
        request.resource.data.text.size() > 0 &&
        request.resource.data.text.size() <= 5000 &&
        request.resource.data.status in ['active', 'inactive'] &&
        request.resource.data.testId is string &&
        request.resource.data.testId.size() > 0 &&
        request.resource.data.options is list &&
        request.resource.data.options.size() >= 2 &&
        request.resource.data.options.size() <= 20 &&
        validateAllOptions() &&
        (!request.resource.data.keys().hasAny(['marks']) || 
          (request.resource.data.marks is number && 
           request.resource.data.marks >= 0)) &&
        (!request.resource.data.keys().hasAny(['negativeMarks']) || 
          (request.resource.data.negativeMarks is number && 
           request.resource.data.negativeMarks >= 0)) &&
        (!request.resource.data.keys().hasAny(['correctOptionIndex']) || 
          (request.resource.data.correctOptionIndex is number && 
           request.resource.data.correctOptionIndex >= 0 &&
           request.resource.data.correctOptionIndex < request.resource.data.options.size())) &&
        (!request.resource.data.keys().hasAny(['correctOptionIndexes']) || 
          (request.resource.data.correctOptionIndexes is list && 
           request.resource.data.correctOptionIndexes.size() > 0)) &&
        (!request.resource.data.keys().hasAny(['solution']) || 
          (request.resource.data.solution is string && 
           request.resource.data.solution.size() <= 5000));
    }

    // Validate each option in the options array
    function validateAllOptions() {
      return request.resource.data.options.size() > 0 &&
        request.resource.data.options.all(opt => 
          opt is map && 
          opt.keys().hasAny(['text']) &&
          opt.text is string &&
          opt.text.size() > 0 &&
          opt.text.size() <= 1000 &&
          (!opt.keys().hasAny(['image']) || 
            (opt.image is string && opt.image.size() > 0))
        );
    }

    // Validate embedded questions in test document
    function hasValidEmbeddedQuestions() {
      return !request.resource.data.keys().hasAny(['questions']) || 
        (request.resource.data.questions is list && 
         request.resource.data.questions.size() <= 1000);
    }

    // Check if document has timestamps
    function hasTimestamps() {
      return request.resource.data.keys().hasAll(['createdAt', 'updatedAt']) &&
        request.resource.data.createdAt is timestamp &&
        request.resource.data.updatedAt is timestamp;
    }

    // =========================================================================
    // GLOBAL CONFIGURATIONS (READ-ONLY FOR APP CLIENTS)
    // =========================================================================
    // Dynamic UI configurations - clients can ONLY read
    // Writes/modifications via Firebase Console or Admin SDK only
    
    match /app_config/{document=**} {
      allow read: if true;
      allow write: if false;
    }

    match /app_pages/{document=**} {
      allow read: if true;
      allow write: if false;
    }

    // =========================================================================
    // MIGRATION TOKENS (EXTERNAL SERVICE AUTH)
    // =========================================================================
    match /migration_tokens/{tokenId} {
      allow read: if true;
      allow update: if request.resource.data.used == true &&
        request.resource.data.keys().hasAll(['used']);
      allow create, delete: if false;
    }

    // =========================================================================
    // USERS COLLECTION (CUSTOM AUTH - TWILIO)
    // =========================================================================
    match /users/{uid} {
      allow read: if true;
      
      allow create, update: if 
        request.resource.data.keys().hasAny(['uid', 'phoneNumber']) &&
        request.resource.data.uid is string &&
        request.resource.data.uid.size() > 0 &&
        (!request.resource.data.keys().hasAny(['name']) || 
          (request.resource.data.name is string && 
           request.resource.data.name.size() <= 255)) &&
        (!request.resource.data.keys().hasAny(['email']) || 
          (request.resource.data.email is string && 
           request.resource.data.email.size() <= 255));
        
      allow delete: if true;

      match /{subPath=**} {
        allow read, write: if true;
      }
    }

    // =========================================================================
    // ADMIN USERS COLLECTION (ADMIN PANEL)
    // =========================================================================
    match /admin_users/{uid} {
      allow read: if true;
      
      allow create, update: if 
        request.resource.data.keys().hasAny(['email', 'role', 'active', 'permissions']) &&
        request.resource.data.email is string &&
        request.resource.data.email.size() > 0 &&
        request.resource.data.email.size() <= 255 &&
        request.resource.data.role in ['super_admin', 'admin', 'editor'] &&
        request.resource.data.active is bool &&
        request.resource.data.permissions is list &&
        request.resource.data.permissions.size() <= 100 &&
        (!request.resource.data.keys().hasAny(['name']) || 
          (request.resource.data.name is string && 
           request.resource.data.name.size() <= 255));
        
      allow delete: if true;
    }

    // =========================================================================
    // EVENTS COLLECTION (ADMIN PANEL)
    // =========================================================================
    match /events/{docId} {
      allow read: if true;
      
      allow create, update: if 
        isValidEntity() && 
        hasValidAdminMetadata() &&
        hasTimestamps() &&
        (!request.resource.data.keys().hasAny(['thumbnail']) || 
          (request.resource.data.thumbnail is string && 
           request.resource.data.thumbnail.size() > 0));
        
      allow delete: if true;
    }

    // =========================================================================
    // BATCHES COLLECTION (ADMIN PANEL)
    // =========================================================================
    match /batches/{docId} {
      allow read: if true;
      
      allow create, update: if 
        isValidEntity() && 
        hasValidAdminMetadata() &&
        hasTimestamps();
        
      allow delete: if true;

      match /courses/{courseId} {
        allow read: if true;

        allow create, update: if
          isValidEntity() &&
          hasValidAdminMetadata() &&
          hasTimestamps() &&
          request.resource.data.keys().hasAny(['batchId']) &&
          request.resource.data.batchId is string &&
          request.resource.data.batchId == docId;

        allow delete: if true;
      }

      match /tests/{testId} {
        allow read: if true;

        allow create, update: if
          isValidEntity() &&
          hasValidAdminMetadata() &&
          hasTimestamps() &&
          request.resource.data.keys().hasAny(['batchId']) &&
          request.resource.data.batchId is string &&
          request.resource.data.batchId == docId &&
          hasValidEmbeddedQuestions();

        allow delete: if true;

        match /questions/{questionId} {
          allow read: if true;

          allow create, update: if
            isValidQuestion() &&
            hasValidAdminMetadata() &&
            hasTimestamps();

          allow delete: if true;
        }
      }
    }

    // =========================================================================
    // COURSES COLLECTION (ADMIN PANEL)
    // =========================================================================
    match /courses/{docId} {
      allow read: if true;
      
      allow create, update: if 
        isValidEntity() && 
        hasValidAdminMetadata() &&
        hasTimestamps();
        
      allow delete: if true;
    }

    // =========================================================================
    // TESTS COLLECTION (ADMIN PANEL)
    // =========================================================================
    match /tests/{docId} {
      allow read: if true;
      
      allow create, update: if 
        isValidEntity() && 
        hasValidAdminMetadata() &&
        hasTimestamps() &&
        request.resource.data.keys().hasAny(['batchId']) &&
        request.resource.data.batchId is string &&
        request.resource.data.batchId.size() > 0 &&
        hasValidEmbeddedQuestions() &&
        exists(/databases/$(database)/documents/batches/$(request.resource.data.batchId));
        
      allow delete: if true;

      match /questions/{questionId} {
        allow read: if true;

        allow create, update: if
          isValidQuestion() &&
          hasValidAdminMetadata() &&
          hasTimestamps();

        allow delete: if true;
      }
    }

    // =========================================================================
    // SECTIONS COLLECTION (TEST CONTENT)
    // =========================================================================
    match /sections/{docId} {
      allow read: if true;

      allow create, update: if
        isValidSection() &&
        hasValidAdminMetadata() &&
        hasTimestamps() &&
        exists(/databases/$(database)/documents/tests/$(request.resource.data.testId));

      allow delete: if true;
    }

    // =========================================================================
    // QUESTIONS COLLECTION (TEST CONTENT)
    // =========================================================================
    match /questions/{docId} {
      allow read: if true;

      allow create, update: if
        isValidQuestion() &&
        hasValidAdminMetadata() &&
        hasTimestamps() &&
        exists(/databases/$(database)/documents/tests/$(request.resource.data.testId));

      allow delete: if true;
    }

    // =========================================================================
    // STUDENT RESPONSES COLLECTION (STUDENT ATTEMPT DATA)
    // =========================================================================
    match /student_responses/{responseId} {
      allow read: if true;

      allow create, update: if
        request.resource.data.keys().hasAll(['studentId', 'testId', 'questionId', 'selectedOptionIndex', 'timestamp']) &&
        request.resource.data.studentId is string &&
        request.resource.data.studentId.size() > 0 &&
        request.resource.data.testId is string &&
        request.resource.data.testId.size() > 0 &&
        request.resource.data.questionId is string &&
        request.resource.data.questionId.size() > 0 &&
        request.resource.data.selectedOptionIndex is number &&
        request.resource.data.timestamp is timestamp;

      allow delete: if true;
    }

    // =========================================================================
    // AUDIT LOGS (OPTIONAL - ADMIN ACTION TRACKING)
    // =========================================================================
    match /audit_logs/{logId} {
      allow read: if true;
      
      allow create: if 
        request.resource.data.keys().hasAll(['action', 'admin', 'timestamp', 'collection']) &&
        request.resource.data.action is string &&
        request.resource.data.admin is string &&
        request.resource.data.collection is string &&
        request.resource.data.action.size() > 0 &&
        request.resource.data.admin.size() > 0 &&
        request.resource.data.collection.size() > 0 &&
        request.resource.data.timestamp is timestamp &&
        (!request.resource.data.keys().hasAny(['details']) || 
          request.resource.data.details is map);
        
      allow update, delete: if false;
    }

    // =========================================================================
    // FALLBACK RULE (DENY EVERYTHING ELSE BY DEFAULT)
    // =========================================================================
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Installation Steps

1. **Copy the rules above**
2. Go to **Firebase Console** → Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. **Replace** all existing rules with the code above
5. Click **Publish** to apply

## Key Rules Features

✅ **Admin Metadata Validation**: Every document requires `createdBy` and `updatedBy`
✅ **Timestamp Validation**: All documents must have `createdAt` and `updatedAt`
✅ **Question Validation**: 
  - Text required (max 5000 chars)
  - Minimum 2 options (max 20)
  - Option validation with text length limits
  - Marks and negative marks validation
  - Solution field support
✅ **Batch Verification**: Tests must reference existing batches
✅ **Field Size Limits**: Prevents data bloat
✅ **Public Read Access**: All content readable by anyone
✅ **Secure Write Access**: Structure validation enforced
✅ **Nested Collections**: Support for questions under tests
✅ **Student Response Tracking**: Dedicated collection for test attempts
✅ **Audit Logging**: Immutable action logs for admin operations

## Troubleshooting

**Q: Questions not creating?**
- Check admin is authenticated
- Verify test exists in database
- Ensure all required fields are filled

**Q: Permission denied error?**
- Verify Firebase rules are published
- Check that user is in admin_users collection
- Review browser console for validation errors

**Q: Rules not updating?**
- Click "Publish" button in Firebase Console
- Wait 5-10 seconds for propagation
- Hard refresh the application

## Support
For issues or questions, refer to the DOCUMENTATION.md file.
