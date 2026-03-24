## ADDED Requirements

### Requirement: System provides product list by series
The system SHALL return products filtered by series type.

#### Scenario: Get Revenu fixe products
- **WHEN** user requests products with series "REVENU_FIXE"
- **THEN** system returns all Revenu fixe 1-10 products

#### Scenario: Get Periodic products
- **WHEN** user requests products with series "PERIODIC"
- **THEN** system returns all Periodic 1-6 products

#### Scenario: Get all products
- **WHEN** user requests products without series filter
- **THEN** system returns all available products

### Requirement: Product information includes complete details
The system SHALL provide comprehensive product information.

#### Scenario: Product details returned
- **WHEN** user views product
- **THEN** system returns price, daily income, period, purchase limit, and status
