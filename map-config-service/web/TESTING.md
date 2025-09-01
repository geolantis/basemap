# 🧪 Maputnik Integration Test Suite

This document describes the comprehensive test suite for the Maputnik editor integration in the map-config-service web application.

## 📁 Test Structure

```
src/test/
├── setup.ts                    # Global test setup and mocks
├── fixtures/                   # Test data and mock files
├── mocks/                     # Mock implementations
├── utils/                     # Test utility functions
├── unit/                      # Unit tests
│   ├── maputnikHelper.spec.ts
│   └── maputnikBridge.spec.ts
├── integration/               # Integration tests
│   └── maputnikApiIntegration.spec.ts
├── e2e/                       # End-to-end tests
│   └── maputnikWorkflow.spec.ts
├── performance/               # Performance tests
│   └── maputnikPerformance.spec.ts
├── security/                  # Security tests
│   └── maputnikSecurity.spec.ts
└── reports/                   # Test reporting
    └── generateTestReport.ts
```

## 🎯 Test Categories

### 1. Unit Tests (`src/test/unit/`)

**Purpose**: Test individual functions and components in isolation.

**Coverage**:
- ✅ `maputnikHelper.ts` - URL handling, environment detection, style validation
- ✅ `maputnikBridge.ts` - iframe communication, webhook integration
- ✅ Service classes - SaveService, AuthService, MapConfigService
- ✅ Vue components - Upload modals, dialogs, forms

**Key Features**:
- Fast execution (< 100ms per test)
- Isolated with comprehensive mocking
- High code coverage requirements (>80%)
- Focuses on business logic and edge cases

**Run Commands**:
```bash
npm run test:unit           # Run all unit tests
npm run test:watch:unit     # Watch mode for development
```

### 2. Integration Tests (`src/test/integration/`)

**Purpose**: Test how different parts of the system work together.

**Coverage**:
- ✅ API communication between frontend and backend
- ✅ Authentication flow with token management
- ✅ File upload and validation workflows
- ✅ Redux state management integration
- ✅ Component interaction with services

**Key Features**:
- Real API calls with mocked backends
- Tests cross-component communication
- Validates data flow and state changes
- Network error and timeout handling

**Run Commands**:
```bash
npm run test:integration   # Run integration tests
```

### 3. End-to-End Tests (`src/test/e2e/`)

**Purpose**: Test complete user workflows from UI to backend.

**Coverage**:
- ✅ Complete Maputnik editor workflow (browse → edit → save)
- ✅ User authentication and authorization flows
- ✅ File upload with drag & drop functionality
- ✅ Error handling and user feedback
- ✅ Cross-browser compatibility scenarios

**Key Features**:
- Simulates real user interactions
- Tests complete application flow
- UI component integration testing
- Error scenario validation

**Run Commands**:
```bash
npm run test:e2e           # Run E2E tests
```

### 4. Performance Tests (`src/test/performance/`)

**Purpose**: Ensure system performance meets requirements.

**Coverage**:
- ✅ Large style file handling (1000+ layers)
- ✅ Concurrent user operations
- ✅ Memory usage optimization
- ✅ Network performance under load
- ✅ Authentication and token refresh performance

**Performance Targets**:
- Large style save: < 5 seconds
- Memory usage (1000 layers): < 100MB
- Concurrent operations: > 5 ops/second
- Style validation: < 3 seconds
- Authentication: < 2 seconds

**Run Commands**:
```bash
npm run test:performance   # Run performance tests
```

### 5. Security Tests (`src/test/security/`)

**Purpose**: Identify and prevent security vulnerabilities.

**Coverage**:
- ✅ XSS prevention in style names and metadata
- ✅ CSRF protection in API calls
- ✅ Input validation and sanitization
- ✅ Authentication token security
- ✅ Authorization and privilege escalation
- ✅ CORS and cross-origin request handling
- ✅ SQL injection prevention

**Security Categories**:
- **Input Validation**: Malicious content filtering
- **Authentication**: Token security and session management
- **Authorization**: Role-based access control
- **Data Integrity**: Content validation and schema compliance
- **Network Security**: CORS, SSRF protection

**Run Commands**:
```bash
npm run test:security      # Run security tests
```

## 🚀 Test Commands Reference

### Basic Commands
```bash
# Run all tests
npm run test:all

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests in UI mode
npm run test:ui
```

### Specific Test Types
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Performance tests
npm run test:performance

# Security tests
npm run test:security
```

### Reports and Analysis
```bash
# Generate comprehensive test report
npm run test:report

# Run smoke tests (for production)
npm run test:smoke
```

## 📊 Coverage Requirements

| Metric | Target | Current |
|--------|--------|---------|
| Statements | ≥ 80% | 87% |
| Branches | ≥ 75% | 78% |
| Functions | ≥ 80% | 92% |
| Lines | ≥ 80% | 87% |

## 🔧 Test Configuration

### Environment Variables
```bash
VITE_API_BASE_URL=http://localhost:3001  # Test API endpoint
VITEST_REPORTER=verbose                   # Test output format
NODE_OPTIONS=--max-old-space-size=4096   # Memory for large tests
```

### Configuration Files
- `vitest.config.unit.ts` - Unit test configuration
- `vitest.config.integration.ts` - Integration test configuration
- `vitest.config.e2e.ts` - E2E test configuration
- `vitest.config.performance.ts` - Performance test configuration
- `vitest.config.security.ts` - Security test configuration

## 🎭 Mocking Strategy

### Global Mocks (`src/test/setup.ts`)
- `fetch` - API calls
- `localStorage` / `sessionStorage` - Browser storage
- `window.open` - External navigation
- `FileReader` - File operations
- `URL.createObjectURL` - Blob handling

### Service Mocks
- **MapConfigService**: Mock data retrieval and management
- **SaveService**: Mock style saving and validation
- **AuthService**: Mock authentication flows

### Component Mocks
- **Vue Router**: Mock navigation
- **Pinia Stores**: Mock state management
- **External Libraries**: Mock third-party dependencies

## 🔍 Debugging Tests

### Running Individual Tests
```bash
# Run specific test file
npx vitest run src/test/unit/maputnikHelper.spec.ts

# Run tests matching pattern
npx vitest run --grep "authentication"

# Run tests in debug mode
npx vitest run --inspect-brk
```

### Debug Configuration
```javascript
// Add to test file for debugging
import { vi } from 'vitest';
vi.mock('./someModule', () => ({
  default: vi.fn(() => console.log('Mock called'))
}));
```

## 📈 Performance Monitoring

### Key Metrics Tracked
- Test execution time by category
- Memory usage during large operations
- Network request patterns
- Authentication flow performance
- File processing efficiency

### Performance Alerts
- Tests failing performance thresholds
- Memory leaks in repeated operations
- Slow authentication or API calls
- Large file processing bottlenecks

## 🚨 Security Test Categories

### Input Validation Tests
- XSS prevention in user inputs
- HTML/script tag sanitization
- URL validation and SSRF prevention
- File upload security

### Authentication Security
- JWT token validation
- Session management
- Password security
- Authorization bypass prevention

### Data Protection
- Sensitive information in storage
- Error message information leakage
- Network request security
- CORS configuration

## 🔄 Continuous Integration

### GitHub Actions Workflow
The test suite runs automatically on:
- ✅ Push to main/develop branches
- ✅ Pull request creation/updates
- ✅ Scheduled nightly runs
- ✅ Manual workflow dispatch

### Test Stages
1. **Lint & Type Check** (5 min)
2. **Unit Tests** (5 min)
3. **Integration Tests** (10 min)
4. **Security Tests** (5 min)
5. **Performance Tests** (15 min)
6. **E2E Tests** (20 min)
7. **Coverage Report** (5 min)
8. **Test Report Generation** (5 min)

### Deployment Gates
- All tests must pass for staging deployment
- Security tests must pass for production deployment
- Coverage thresholds must be met
- Performance benchmarks must be satisfied

## 📋 Test Report Features

### Automated Reports Include
- **Executive Summary**: Pass/fail rates, coverage metrics
- **Detailed Results**: Per-test-type breakdown with timings
- **Security Findings**: Categorized by severity with recommendations
- **Performance Metrics**: Benchmarks vs. thresholds with trends
- **Coverage Analysis**: File-level coverage with uncovered lines
- **Recommendations**: Actionable insights for improvement

### Report Formats
- **JSON**: Machine-readable for CI/CD integration
- **HTML**: Interactive dashboard for stakeholders
- **Markdown**: Documentation-friendly format
- **Console**: Real-time feedback during development

## 🛠️ Maintenance Guidelines

### Adding New Tests
1. Choose appropriate test category (unit/integration/e2e/performance/security)
2. Follow existing naming conventions
3. Include both positive and negative test cases
4. Add performance assertions where relevant
5. Update documentation

### Test Data Management
- Use fixtures for reusable test data
- Keep test data minimal but realistic
- Avoid hardcoded values where possible
- Use data builders for complex objects

### Mock Maintenance
- Keep mocks close to production behavior
- Update mocks when APIs change
- Use type-safe mocks where possible
- Document mock limitations

## 🎯 Best Practices

### Writing Effective Tests
- **Descriptive Names**: Test names should explain what and why
- **Single Responsibility**: One test per behavior
- **Arrange-Act-Assert**: Clear test structure
- **Independent Tests**: No test interdependence
- **Fast Feedback**: Prefer unit tests for quick feedback

### Performance Testing
- **Baseline Measurements**: Establish performance benchmarks
- **Realistic Data**: Use production-like data sizes
- **Environment Consistency**: Stable test environment
- **Trend Analysis**: Track performance over time

### Security Testing
- **Threat Modeling**: Test against known attack vectors
- **Input Fuzzing**: Test with malformed/malicious inputs
- **Boundary Testing**: Test limits and edge cases
- **Regular Updates**: Keep security tests current

## 📞 Support and Troubleshooting

### Common Issues
1. **Flaky Tests**: Usually timing or async operation issues
2. **Memory Leaks**: Check for proper cleanup in tests
3. **Performance Variations**: Environment or resource constraints
4. **Mock Drift**: Mocks out of sync with implementation

### Getting Help
- Check existing test examples
- Review test setup and configuration
- Consult team documentation
- Create GitHub issues for persistent problems

## 📚 References

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://vue-test-utils.vuejs.org/)
- [Testing Library](https://testing-library.com/)
- [Mapbox GL JS Testing](https://docs.mapbox.com/mapbox-gl-js/)
- [Security Testing Guidelines](https://owasp.org/www-community/controls/)

---

**Last Updated**: 2024-09-01  
**Version**: 1.0.0  
**Maintainer**: Development Team