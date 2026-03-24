## ADDED Requirements

### Requirement: User can register with phone number
The system SHALL allow users to register using a 9-digit phone number and password.

#### Scenario: Successful registration
- **WHEN** user provides valid 9-digit phone number and password
- **THEN** system creates user account and returns authentication token

#### Scenario: Invalid phone format
- **WHEN** user provides phone number not matching 9-digit format
- **THEN** system returns error "INVALID_PHONE"

#### Scenario: Duplicate phone number
- **WHEN** user provides phone number that already exists
- **THEN** system returns error "PHONE_EXISTS"

### Requirement: User can login with credentials
The system SHALL authenticate users with phone number and password.

#### Scenario: Successful login
- **WHEN** user provides correct phone and password
- **THEN** system generates 32-character token and returns user profile

#### Scenario: Wrong credentials
- **WHEN** user provides incorrect phone or password
- **THEN** system returns error "WRONG_CREDENTIALS"

### Requirement: Token-based authentication
The system SHALL use token-based authentication for protected endpoints.

#### Scenario: Valid token access
- **WHEN** request includes valid token in Authorization header
- **THEN** system allows access to protected resource

#### Scenario: Missing token
- **WHEN** request to protected endpoint without token
- **THEN** system returns error "UNAUTHORIZED"

#### Scenario: Expired token
- **WHEN** request with token older than 30 days
- **THEN** system returns error "TOKEN_EXPIRED"
