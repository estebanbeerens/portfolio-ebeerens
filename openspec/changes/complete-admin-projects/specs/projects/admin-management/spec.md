## Purpose

Provide an authenticated, accessible administration workflow for maintaining the portfolio projects that appear in the public portfolio.

## ADDED Requirements

### Requirement: Authenticated project list

The system SHALL provide an admin Projects view that loads the current projects from the project API and presents each project's title, slug, dates, and associated skills.

#### Scenario: Projects load successfully

- **GIVEN** an administrator has an active authenticated session
- **WHEN** the administrator opens the Projects view
- **THEN** the system requests the project collection through the supported API client and displays the returned projects

#### Scenario: No projects exist

- **GIVEN** an administrator has an active authenticated session
- **WHEN** the project collection is empty
- **THEN** the system displays an explicit empty state with an accessible action to create the first project

#### Scenario: Project list request is unauthorized

- **GIVEN** the administrator session is missing or expired
- **WHEN** the Projects view request is rejected as unauthorized
- **THEN** the system presents an authentication-related error and does not display editable project data

### Requirement: Create and edit projects

The system SHALL allow an authenticated administrator to create a project and edit an existing project using the fields supported by the project API: title, slug, short description, rich-text description, image URL, client, job role, live URL, start date, end date, and skills. The short description SHALL be limited to 255 characters, and the rich-text description SHALL be authored through a WYSIWYG editor and stored as ProseMirror JSON.

#### Scenario: Administrator creates a valid project

- **GIVEN** the administrator is viewing the Projects view
- **WHEN** the administrator submits all required valid project fields
- **THEN** the system sends the project to the API, shows the created project in the list, and communicates successful completion

#### Scenario: Administrator edits a project

- **GIVEN** an existing project is selected for editing
- **WHEN** the administrator submits valid changed fields
- **THEN** the system sends the update to the API, replaces the displayed project with the saved representation, and communicates successful completion

#### Scenario: Required or formatted field validation fails

- **GIVEN** the project form contains a missing required field or an invalid slug, URL, or date
- **WHEN** the administrator submits the form
- **THEN** the system identifies the invalid field, provides an accessible error message, and does not send an API mutation request

#### Scenario: Short description exceeds the limit

- **GIVEN** the administrator enters more than 255 characters in the short description
- **WHEN** the administrator submits the form
- **THEN** the system prevents submission and identifies the character-limit error

#### Scenario: Administrator formats the rich-text description

- **GIVEN** the administrator is editing a project description
- **WHEN** the administrator uses the WYSIWYG formatting controls
- **THEN** the editor reflects the formatting and the saved API payload contains the resulting ProseMirror JSON

#### Scenario: Project slug conflicts with an existing project

- **GIVEN** the administrator submits a slug already used by another project
- **WHEN** the API rejects the mutation as a conflict
- **THEN** the system preserves the entered values and explains that the slug must be unique

### Requirement: Delete projects

The system SHALL allow an authenticated administrator to delete an existing project only after an explicit confirmation and SHALL remove the project from the list after successful deletion.

#### Scenario: Administrator confirms deletion

- **GIVEN** an existing project is displayed
- **WHEN** the administrator confirms the deletion request and the API succeeds
- **THEN** the system removes that project from the list and communicates successful completion

#### Scenario: Administrator cancels deletion

- **GIVEN** a deletion confirmation is open
- **WHEN** the administrator cancels it
- **THEN** the system closes the confirmation without sending a delete request or changing the project list

#### Scenario: Delete request fails

- **GIVEN** an administrator has confirmed deletion
- **WHEN** the API rejects the delete request
- **THEN** the system keeps the project visible and presents an actionable error

### Requirement: Accessible and resilient project workflow

The system SHALL expose all project-management actions through keyboard-accessible, semantically labelled controls and SHALL represent loading, submitting, success, empty, and failure states without overlapping content or relying on color alone. The start and end date controls SHALL use a calendar icon with contrast appropriate to the active light or dark theme, and the form SHALL keep client, job role, image URL, and live URL as separate full-width fields.

#### Scenario: Keyboard navigation reaches project actions

- **GIVEN** the administrator navigates the Projects view with a keyboard
- **WHEN** focus moves through the project list and form
- **THEN** every create, edit, delete, confirm, cancel, and retry action is reachable with a visible focus indicator and an accessible name

#### Scenario: Mutation is in progress

- **GIVEN** the administrator submits a create, edit, or delete action
- **WHEN** the API request is pending
- **THEN** the system prevents duplicate submission for that action and communicates that work is in progress

#### Scenario: General API failure

- **GIVEN** the project list or a project mutation fails for a reason other than validation, conflict, or authorization
- **WHEN** the failure is returned
- **THEN** the system preserves recoverable form input where applicable and provides a retry or recovery action
