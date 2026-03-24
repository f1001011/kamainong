## ADDED Requirements

### Requirement: User can purchase products
The system SHALL allow users to buy products with sufficient balance.

#### Scenario: Successful purchase
- **WHEN** user has sufficient balance and purchases product
- **THEN** system creates order and deducts balance

#### Scenario: Insufficient balance
- **WHEN** user balance is less than product price
- **THEN** system returns error "INSUFFICIENT_BALANCE"

### Requirement: User can view positions
The system SHALL display user's active positions.

#### Scenario: View all positions
- **WHEN** user requests position list
- **THEN** system returns all active orders with income status

### Requirement: User can claim income
The system SHALL allow users to claim available income.

#### Scenario: Claim available income
- **WHEN** user claims income within 24 hours
- **THEN** system adds income to balance and records log

#### Scenario: Income expired
- **WHEN** user claims income after 24 hours
- **THEN** system returns error "INCOME_EXPIRED"
