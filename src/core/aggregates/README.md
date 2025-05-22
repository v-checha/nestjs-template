# Domain Aggregates

This document defines the aggregate boundaries for our domain model. Aggregates are consistency boundaries that ensure data integrity and encapsulate business rules.

## Aggregate Definitions

### 1. User Aggregate

**Aggregate Root**: `User`  
**Entities**: `User`  
**Value Objects**: `UserId`, `Email`, `FirstName`, `LastName`

**Boundaries**:
- The User aggregate manages user identity, authentication status, and profile information
- User roles are referenced by ID but managed by the Role aggregate
- The aggregate ensures consistency for user state changes (activation, deactivation, profile updates)

**Invariants**:
- A user must have a valid email address
- A user must have at least one role (enforced at the application layer)
- Admin users should have 2FA enabled (business rule)
- User email must be unique across the system

**Operations**:
- Create user account
- Update profile information
- Activate/deactivate account
- Enable/disable two-factor authentication
- Change password
- Assign/remove roles (coordination with Role aggregate)

### 2. Role Aggregate

**Aggregate Root**: `Role`  
**Entities**: `Role`  
**Value Objects**: `RoleId`

**Boundaries**:
- The Role aggregate manages role definitions and permission assignments
- Permissions are referenced by ID but can be managed independently
- The aggregate ensures consistency for role permission assignments

**Invariants**:
- Role names must be unique
- Default roles cannot be deleted
- Admin roles require specific permissions
- Roles must have at least one permission (except default role)

**Operations**:
- Create role
- Update role details
- Assign/remove permissions
- Set/unset as default role
- Delete role (if eligible)

### 3. Permission Aggregate

**Aggregate Root**: `Permission`  
**Entities**: `Permission`  
**Value Objects**: `PermissionId`, `PermissionName`, `ResourceAction`

**Boundaries**:
- The Permission aggregate manages permission definitions
- Permissions are atomic and immutable once created
- Resource and action combinations must be unique

**Invariants**:
- Permission names must be unique
- Resource-action combinations must be valid
- System permissions cannot be deleted

**Operations**:
- Create permission
- Update permission description
- Delete permission (if not system-critical)

### 4. File Aggregate

**Aggregate Root**: `File`  
**Entities**: `File`  
**Value Objects**: `FileId`

**Boundaries**:
- The File aggregate manages file metadata and access control
- File ownership and access permissions are managed within this aggregate
- Physical file storage is handled by infrastructure services

**Invariants**:
- Files must have an owner (User)
- File access levels must be valid
- File paths must be unique

**Operations**:
- Upload file
- Update file access permissions
- Delete file
- Transfer ownership

## Aggregate Relationships

### User ↔ Role Relationship
- **Type**: Many-to-Many
- **Management**: User aggregate holds role references, Role aggregate is independent
- **Consistency**: Eventual consistency - role changes propagate via domain events
- **Coordination**: Application services coordinate role assignments

### Role ↔ Permission Relationship
- **Type**: Many-to-Many
- **Management**: Role aggregate manages permission assignments
- **Consistency**: Strong consistency within Role aggregate
- **Coordination**: Permission existence validated at application layer

### User ↔ File Relationship
- **Type**: One-to-Many (ownership)
- **Management**: File aggregate holds user reference
- **Consistency**: Eventual consistency - user changes propagate via domain events
- **Coordination**: Application services coordinate file operations

## Aggregate Design Principles

1. **Single Responsibility**: Each aggregate has a clear, focused responsibility
2. **Consistency Boundaries**: Aggregates maintain strong consistency internally
3. **Loose Coupling**: Aggregates communicate through domain events
4. **Reference by ID**: Aggregates reference each other by ID, not direct object references
5. **Transaction Boundaries**: One aggregate per transaction (generally)

## Domain Events for Aggregate Coordination

- `UserRegisteredEvent` → Role assignment coordination
- `UserActivatedEvent` → File access coordination
- `UserRoleAssignedEvent` → Permission cache invalidation
- `RolePermissionUpdatedEvent` → User permission cache refresh
- `FileUploadedEvent` → Storage service coordination

## Implementation Guidelines

1. **Repository Pattern**: One repository per aggregate root
2. **Application Services**: Coordinate between aggregates
3. **Domain Events**: Handle cross-aggregate consistency
4. **Specifications**: Validate business rules across aggregates
5. **Factory Methods**: Create consistent aggregate states