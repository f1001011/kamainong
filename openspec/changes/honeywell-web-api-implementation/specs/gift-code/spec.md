## ADDED Requirements

### Requirement: User can redeem gift code
The system SHALL allow users to redeem valid gift codes.

#### Scenario: Valid gift code
- **WHEN** user enters valid unused gift code
- **THEN** system adds reward to balance and marks code as used

#### Scenario: Invalid or used code
- **WHEN** user enters invalid or already used code
- **THEN** system returns error "INVALID_CODE"
