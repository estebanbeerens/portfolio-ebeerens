## Purpose

Allows the portfolio owner to manage the structured identity information that public visitors see across the portfolio.

## ADDED Requirements

### Requirement: Profile API exposes structured identity fields

The system SHALL expose a public profile with a required name and optional avatar URL, professional headline, residence location, Markdown biography, LinkedIn URL, GitHub URL, Instagram URL, X URL, and YouTube URL. Optional fields SHALL be omitted when no value has been provided.

#### Scenario: Read a complete profile

- **WHEN** a public visitor requests the existing profile endpoint for a configured profile
- **THEN** the response includes the required name and every configured optional identity field

#### Scenario: Read a profile with omitted fields

- **WHEN** a public visitor requests a profile whose optional fields have not been configured
- **THEN** the response includes the required name and omits the absent optional fields

### Requirement: Authenticated administrator updates profile details

The system SHALL allow the authenticated administrator to create or update the singleton profile with a nonblank name and any optional profile fields. Avatar and social URLs MUST be absolute HTTP or HTTPS URLs; invalid values MUST be rejected without changing the stored profile.

#### Scenario: Update a complete profile

- **WHEN** the authenticated administrator submits a valid name, residence, biography, avatar URL, and social URLs
- **THEN** the system persists the submitted values and returns the updated profile

#### Scenario: Reject invalid profile input

- **WHEN** the authenticated administrator submits a blank name or malformed avatar or social URL
- **THEN** the system rejects the request and preserves the existing profile values

### Requirement: Administrator can edit biography Markdown safely

The system SHALL provide the authenticated administrator with a Basic Info form that edits the biography as Markdown source and offers a sanitized rendered preview before saving.

#### Scenario: Preview biography before saving

- **WHEN** the administrator switches the biography editor to preview mode
- **THEN** the system renders the current Markdown content with unsafe HTML removed

#### Scenario: Save an empty optional biography

- **WHEN** the administrator clears the biography and saves a valid profile
- **THEN** the system saves the profile without a biography value
