## ADDED Requirements

### Requirement: User can sign in daily
The system SHALL reward 1 point for daily sign-in.

#### Scenario: First sign-in today
- **WHEN** user signs in for first time today
- **THEN** system adds 1 point and records sign-in

#### Scenario: Already signed in
- **WHEN** user already signed in today
- **THEN** system returns error "ALREADY_SIGNED"
