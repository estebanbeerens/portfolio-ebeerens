## Purpose

Provides an accessible, server-rendered public profile and professional history so portfolio visitors can understand the owner's identity and career progression.

## ADDED Requirements

### Requirement: Public basic information is available at a stable route

The system SHALL provide a public Basic Info page at `/basic-info` that renders the configured profile name and any configured avatar, headline, residence location, and sanitized Markdown biography. The page SHALL render a clear loading, unavailable, or error state when profile content cannot be displayed.

#### Scenario: Render configured profile information

- **WHEN** a visitor opens `/basic-info` and a profile exists
- **THEN** the page presents the profile name and every configured public identity field

#### Scenario: Profile is unavailable

- **WHEN** a visitor opens `/basic-info` and the profile is absent or cannot be loaded
- **THEN** the page presents an accessible unavailable or error state instead of stale profile information

### Requirement: Public basic information exposes configured social destinations

The system SHALL render a social-links region on the Basic Info page only when at least one social URL is configured. Each social destination MUST have an accessible name that identifies its platform and destination behavior.

#### Scenario: Render configured social links

- **WHEN** a profile has LinkedIn and GitHub URLs configured
- **THEN** the Basic Info page exposes accessible links for LinkedIn and GitHub and does not render links for unconfigured platforms

#### Scenario: Omit an empty social-links region

- **WHEN** no social URLs are configured
- **THEN** the Basic Info page does not render an empty social-links region

### Requirement: Public professional journey groups consecutive roles by organization

The system SHALL provide a public Professional Journey page at `/professional-journey` that presents roles in descending start-date order. Consecutive roles from the same organization SHALL be grouped under one organization heading; roles from the same organization separated by another organization SHALL form separate groups.

#### Scenario: Group consecutive roles

- **WHEN** two adjacent roles belong to the same organization
- **THEN** the page presents both roles under one organization heading

#### Scenario: Keep non-consecutive roles separate

- **WHEN** roles from one organization are separated by a role from another organization
- **THEN** the page presents separate organization groups for the non-consecutive roles

### Requirement: Public professional journey presents accessible role details

The Professional Journey page SHALL present each role's title, organization, start date, end date or `Present`, and any configured location and employment type. It SHALL present organization websites and logos when configured with accessible fallbacks when they are absent or unavailable.

#### Scenario: Render a current role

- **WHEN** a role has no end date
- **THEN** the page labels its end date as `Present`

#### Scenario: Render role optional details

- **WHEN** a role has a location, employment type, organization website, and organization logo
- **THEN** the page presents each available detail with accessible semantics

### Requirement: Public journey respects feature visibility controls

The system SHALL not render Professional Journey content when the `ROLES` feature flag is disabled. The system SHALL render role skills only when both journey content is visible and the `SKILLS` feature flag is enabled.

#### Scenario: Roles are disabled

- **WHEN** the `ROLES` feature flag is disabled
- **THEN** the public navigation and Professional Journey content do not expose the journey

#### Scenario: Skills are disabled

- **WHEN** the `ROLES` feature flag is enabled and the `SKILLS` feature flag is disabled
- **THEN** the page presents role details without skill labels
