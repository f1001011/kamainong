## ADDED Requirements

### Requirement: Daily prize pool distribution
The system SHALL distribute 3000 XAF daily at 5:00 AM.

#### Scenario: First place winner
- **WHEN** user has highest LV1 team recharge today
- **THEN** system awards 1388 XAF at 5:00 AM

#### Scenario: User claims prize
- **WHEN** user won prize and claims
- **THEN** system adds prize to balance
