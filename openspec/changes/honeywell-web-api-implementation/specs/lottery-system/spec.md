## ADDED Requirements

### Requirement: User can spin lottery wheel
The system SHALL allow users to spin with available chances.

#### Scenario: Successful spin
- **WHEN** user has available chances and spins
- **THEN** system deducts chance and awards random prize

#### Scenario: No chances available
- **WHEN** user has zero chances
- **THEN** system returns error "NO_CHANCES"
