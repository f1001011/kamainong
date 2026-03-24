## ADDED Requirements

### Requirement: VIP level based on product purchases
The system SHALL assign VIP level when user purchases 2 same products.

#### Scenario: Achieve SVIP1
- **WHEN** user purchases 2 Revenu fixe 1 products
- **THEN** system upgrades user to SVIP1 with 50 XAF daily reward

### Requirement: User can claim daily VIP reward
The system SHALL allow VIP users to claim daily rewards once per day.

#### Scenario: Claim daily reward
- **WHEN** VIP user claims reward for first time today
- **THEN** system adds reward to balance

#### Scenario: Already claimed today
- **WHEN** VIP user already claimed today
- **THEN** system returns error "ALREADY_CLAIMED"
