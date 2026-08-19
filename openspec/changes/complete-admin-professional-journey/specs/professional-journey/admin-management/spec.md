## Purpose

Lets the authenticated portfolio owner manage their professional journey — organizations and the roles held at each — through the admin application, grouping roles by organization so multiple roles at the same company are shown together.

## ADDED Requirements

### Requirement: View roles grouped by organization

The admin Professional Journey page SHALL display all roles grouped under their owning organization, with each organization's roles ordered by start date descending, and organizations ordered by their most recent role's start date descending.

#### Scenario: Multiple roles under one organization

- **WHEN** an organization has two or more roles recorded
- **THEN** the page renders one group for that organization containing all of its roles, not a separate group per role

#### Scenario: Empty state

- **WHEN** no roles exist yet
- **THEN** the page shows an empty state with an action to add the first role

#### Scenario: Load failure

- **WHEN** the roles or organizations request fails
- **THEN** the page shows an error message with a retry action and does not show stale or partial data

### Requirement: Create a role with an organization

An authenticated administrator SHALL be able to create a role by selecting an existing organization by name or providing a new organization name, which the system creates automatically before the role.

#### Scenario: Select an existing organization

- **WHEN** the administrator submits a new role using an organization name that matches an existing organization
- **THEN** the system links the new role to the existing organization without creating a duplicate

#### Scenario: Create a new organization inline

- **WHEN** the administrator submits a new role using an organization name that does not match any existing organization
- **THEN** the system creates the organization and links the new role to it

#### Scenario: Required field validation

- **WHEN** the administrator submits the role form without a job title, organization, or start date
- **THEN** the system blocks submission and shows field-level validation messages without calling the API

### Requirement: Edit and delete a role

An authenticated administrator SHALL be able to edit a role's fields and delete a role, with confirmation required before deletion.

#### Scenario: Edit updates the displayed role

- **WHEN** the administrator edits a role's fields and saves
- **THEN** the updated role is reflected in its organization's group without duplicating the role

#### Scenario: Delete requires confirmation

- **WHEN** the administrator chooses to delete a role
- **THEN** the system shows a confirmation dialog and only removes the role after the administrator confirms

#### Scenario: Cancelled delete makes no request

- **WHEN** the administrator dismisses the delete confirmation
- **THEN** the system does not call the delete API and the role remains visible

### Requirement: Edit organization details

An authenticated administrator SHALL be able to edit an organization's logo URL and website from the grouped list without leaving the Professional Journey page.

#### Scenario: Update organization logo and website

- **WHEN** the administrator edits an organization's logo URL or website and saves
- **THEN** the change is reflected in that organization's group header

### Requirement: Session and error handling

The Professional Journey admin page SHALL require an authenticated session for all mutations and SHALL present distinct, user-facing messages for expired-session, conflict, and general request failures.

#### Scenario: Expired session on mutation

- **WHEN** a create, update, or delete request returns an unauthorized response
- **THEN** the page shows a message indicating the session expired and prompts the administrator to sign in again

#### Scenario: Conflicting organization name

- **WHEN** creating or renaming an organization would duplicate an existing organization's name
- **THEN** the page shows a conflict message and does not apply the change
