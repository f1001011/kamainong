## ADDED Requirements

### Requirement: Monthly salary based on team recharge
The system SHALL award salary when LV1 team reaches recharge milestones.

#### Scenario: Reach 300000 XAF milestone
- **WHEN** LV1 team total recharge reaches 300000 XAF this month
- **THEN** system allows user to claim 3000 XAF salary

#### Scenario: Claim monthly salary
- **WHEN** user claims salary for reached milestone
- **THEN** system adds salary to balance and marks as claimed
