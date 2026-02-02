# Backend Tests

Automated tests for the Q-Ease backend API.

## Directory Structure

```
tests/
├── integration/     # API integration tests
│   ├── integration-test.js
│   ├── test-api.js
│   └── quick-test.js
└── unit/           # Unit tests for individual modules
    └── (unit test files)
```

## Running Tests

**All Tests**
```bash
npm test
```

**Integration Tests**
```bash
npm run test:integration
```

**Unit Tests**
```bash
npm run test:unit
```

**Watch Mode**
```bash
npm run test:watch
```

## Writing Tests

- Place integration tests in `tests/integration/`
- Place unit tests in `tests/unit/`
- Follow existing test patterns
- Use descriptive test names
