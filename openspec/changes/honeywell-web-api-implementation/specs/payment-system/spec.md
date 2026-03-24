## ADDED Requirements

### Requirement: User can create recharge order
The system SHALL allow users to create recharge orders with minimum 8000 XAF.

#### Scenario: Valid recharge amount
- **WHEN** user creates recharge with amount >= 8000 XAF
- **THEN** system creates pending recharge order

#### Scenario: Below minimum amount
- **WHEN** user creates recharge with amount < 8000 XAF
- **THEN** system returns error "BELOW_MINIMUM"

### Requirement: User can create withdraw order
The system SHALL allow users to withdraw with 10% tax during 10:00-18:00.

#### Scenario: Valid withdraw request
- **WHEN** user withdraws during allowed time with sufficient balance
- **THEN** system creates withdraw order and deducts balance plus 10% tax

#### Scenario: Outside allowed time
- **WHEN** user withdraws outside 10:00-18:00
- **THEN** system returns error "OUTSIDE_WITHDRAW_TIME"

#### Scenario: Daily limit reached
- **WHEN** user already withdrew once today
- **THEN** system returns error "DAILY_LIMIT_REACHED"
