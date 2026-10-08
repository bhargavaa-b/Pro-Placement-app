# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Identity & Ownership Invariant**: Every document in `/users/{userId}`, `/users/{userId}/private/{docId}`, and `/users/{userId}/solvedProblems/{problemId}` MUST have `ownerId == request.auth.uid && userId == request.auth.uid` and require `request.auth.token.email_verified == true`.
2. **Master Gate Relational Sync Invariant**: Subcollections `/users/{userId}/private/{docId}` and `/users/{userId}/solvedProblems/{problemId}` require the parent `/users/{userId}` document to exist and have `get(/databases/$(database)/documents/users/$(userId)).data.ownerId == request.auth.uid`.
3. **PII Isolation Invariant**: Email addresses are strictly isolated in `/users/{userId}/private/{docId}` and readable ONLY by the verified document owner (`userId == request.auth.uid`).
4. **Temporal & Immortal Field Invariant**: `createdAt` and `ownerId` are immutable on update; `createdAt == request.time` on create and `updatedAt == request.time` on update.

## 2. The "Dirty Dozen" Payloads

1. **Unauthenticated Profile Creation**:
   `{ "ownerId": "user_1", "name": "Alice", "university": "IIT", "graduationYear": "2026", "streakDays": 0, "streakShieldActive": false, "highGameScore": 0, "solvedDSACount": 0, "solvedAptitudeCount": 0 }` (No auth token)
2. **Unverified Email Write**:
   `{ "ownerId": "user_1", "name": "Alice" }` with `auth.token.email_verified == false`
3. **Cross-User Identity Spoofing**:
   User `user_2` writing to `/users/user_1` with `{ "ownerId": "user_1", "name": "Spoofed" }`
4. **Shadow / Ghost Field Injection on Create**:
   `{ "ownerId": "user_1", "name": "Alice", "university": "IIT", "graduationYear": "2026", "streakDays": 0, "streakShieldActive": false, "highGameScore": 0, "solvedDSACount": 0, "solvedAptitudeCount": 0, "isAdmin": true }`
5. **Shadow Update / Unauthorized Key Mutation**:
   Updating `/users/user_1` with `{ "role": "superadmin" }`
6. **Immortal Field Tampering (`ownerId` / `createdAt` mutation)**:
   Updating `/users/user_1` with `{ "ownerId": "user_999" }`
7. **Client-Spoofed Timestamp**:
   Creating `/users/user_1` with `createdAt: Timestamp.fromMillis(1000000)` instead of `request.time`
8. **Denial-of-Wallet Oversized String**:
   Creating `/users/user_1` with `name` of length 5,000 characters (`> 100`)
9. **ID Poisoning Attack**:
   Creating `/users/user_1/solvedProblems/invalid$id!@#` with non-alphanumeric characters
10. **Orphaned Subcollection Write**:
    Creating `/users/user_1/solvedProblems/dsa-1` when `/users/user_1` does not exist
11. **PII Cross-Tenant Read**:
    User `user_2` attempting `get` on `/users/user_1/private/info`
12. **Value Poisoning on Update**:
    Updating `streakDays` with a string `"one_hundred"` instead of a bounded non-negative number
