## ADDED Requirements

### Requirement: Team commission on recharges
The system SHALL distribute commission when team members recharge.

#### Scenario: LV1 member recharges
- **WHEN** LV1 member recharges
- **THEN** system gives 10% commission to inviter

#### Scenario: LV2 member recharges
- **WHEN** LV2 member recharges
- **THEN** system gives 3% commission to inviter

### Requirement: Team statistics
The system SHALL provide team member count and recharge statistics.

#### Scenario: View team stats
- **WHEN** user views team statistics
- **THEN** system returns LV1/LV2/LV3 member counts and total recharge
