# Test Suite for Maputnik Style Upload Feature

This directory contains comprehensive tests for the Maputnik style upload feature, ensuring robust functionality across all components.

## Quick Start

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run specific test files
npm run test -- StyleUploadModal.spec.ts

# Run with coverage
npm run test:coverage
```

## Test Structure

### 📁 Directory Layout

```
src/test/
├── __tests__/                 # Component unit tests
│   └── StyleUploadModal.spec.ts
├── e2e/                      # End-to-end test scenarios
│   └── styleUpload.spec.ts
├── fixtures/                 # Test data files
│   ├── valid-maputnik-style.json
│   ├── invalid-style.json
│   └── malformed.json
├── integration/              # API integration tests
│   ├── uploadApi.spec.ts
│   └── mapConfigIntegration.spec.ts
├── mocks/                    # Mock implementations
│   └── mapConfigService.ts
├── utils/                    # Test utilities
│   └── testHelpers.ts
├── setup.ts                  # Global test setup
├── TESTING_GUIDE.md         # Comprehensive testing guide
└── README.md                # This file
```

## Test Categories

### ✅ Unit Tests (`__tests__/`)

**StyleUploadModal.spec.ts** (46 tests)
- Component rendering and visibility
- File upload and validation
- Drag and drop functionality
- Form validation
- Error handling
- Modal controls
- Accessibility

Coverage: All component methods and user interactions

### ✅ Integration Tests (`integration/`)

**uploadApi.spec.ts** (25 tests)
- API endpoint testing
- File upload validation
- Error response handling
- Network failure scenarios
- Performance testing
- CORS handling

**mapConfigIntegration.spec.ts** (15 tests)  
- Map configuration creation
- Style URL validation
- Search and filtering
- Configuration updates
- Error handling

### ✅ End-to-End Tests (`e2e/`)

**styleUpload.spec.ts** (12 scenarios)
- Complete user workflows
- Multi-user scenarios
- Browser compatibility
- Error recovery
- Session management

## Test Data and Fixtures

### Valid Test Files ✅

- **`valid-maputnik-style.json`**: Complete Maputnik style with all required fields
- **`invalid-style.json`**: Missing required Mapbox style fields
- **`malformed.json`**: Invalid JSON syntax

### Mock Services ✅

- **MapConfigService**: Mocked for isolated unit testing
- **Fetch API**: Controlled responses for integration testing
- **File APIs**: Browser file handling simulation

## Key Test Scenarios Covered

### File Upload Validation ✅
- ✅ Valid JSON files accepted
- ✅ Non-JSON files rejected
- ✅ Files >10MB rejected
- ✅ Malformed JSON rejected
- ✅ Invalid Mapbox styles rejected

### User Interface Testing ✅  
- ✅ Drag and drop functionality
- ✅ File preview display
- ✅ Form field validation
- ✅ Progress indicators
- ✅ Error message display
- ✅ Success feedback

### API Integration ✅
- ✅ Successful upload responses
- ✅ Error handling (400, 500 status codes)
- ✅ Network failure recovery
- ✅ Concurrent upload handling
- ✅ File accessibility via public URLs

### Map Configuration ✅
- ✅ Style integration with map system
- ✅ Configuration creation and updates
- ✅ Search and filtering functionality
- ✅ Metadata handling

## Running Specific Test Groups

```bash
# Unit tests only
npm run test -- --grep "StyleUploadModal"

# Integration tests
npm run test -- --grep "Integration"  

# API tests
npm run test -- --grep "API"

# E2E scenarios
npm run test -- --grep "E2E"

# Error handling tests
npm run test -- --grep "error|Error"

# File validation tests  
npm run test -- --grep "validation|Validation"
```

## Test Configuration

### Vitest Config (vite.config.ts)
```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
}
```

### Global Setup (setup.ts)
- Mock File APIs (File, FileReader, Blob)
- Mock DOM APIs (DragEvent, DataTransfer)
- Mock network APIs (fetch)
- Jest DOM matchers

## Manual Testing

Comprehensive manual testing guide available in `TESTING_GUIDE.md`.

Key manual test scenarios:
1. **Complete Upload Workflow**: File selection → validation → form completion → upload
2. **Error Handling**: Invalid files, network failures, form validation
3. **Browser Compatibility**: Chrome, Firefox, Safari, Edge  
4. **Mobile Testing**: Touch interactions, file picker behavior

## Performance Testing

### Metrics Tracked ✅
- Upload time for various file sizes
- Concurrent upload handling
- Memory usage during operations
- Network timeout handling

### Performance Tests Include:
- Multiple concurrent uploads
- Large file handling (up to 10MB limit)
- Memory leak detection
- Network condition simulation

## Accessibility Testing ✅

- Keyboard navigation support
- Screen reader compatibility  
- ARIA labels and roles
- Focus management
- Progress announcements

## Debugging Tests

### Common Issues and Solutions

1. **File.text() not defined**
   - Fixed in `setup.ts` with proper File API mocks

2. **DragEvent not defined**  
   - Added DragEvent mock to global setup

3. **Component state access**
   - Use Vue Test Utils wrapper methods properly

4. **Async operations**
   - Use `await nextTick()` for Vue reactivity
   - Use `waitFor()` helper for conditions

### Debug Utilities

```bash
# Run with debug output
DEBUG_TESTS=true npm run test

# Run single test with logs
npm run test -- --reporter=verbose -t "specific test name"

# Open test UI for interactive debugging
npm run test:ui
```

## Continuous Integration

Tests are designed to run in CI environments:

```yaml
# GitHub Actions example
- name: Run Tests
  run: |
    npm install
    npm run test:run
    npm run test:coverage
```

## Coverage Targets

- **Unit Tests**: >90% line coverage
- **Integration**: All API endpoints covered  
- **E2E**: Critical user paths covered
- **Overall**: >85% combined coverage

Current coverage can be viewed with:
```bash
npm run test:coverage
```

## Contributing to Tests

### Adding New Tests

1. **Unit Tests**: Add to existing spec files or create new ones in `__tests__/`
2. **Integration**: Add to `integration/` directory
3. **Test Data**: Add fixtures to `fixtures/` directory
4. **Helpers**: Add utilities to `utils/testHelpers.ts`

### Test Naming Convention

```typescript
describe('Feature Area', () => {
  describe('Specific Functionality', () => {
    it('should behave correctly when condition is met', () => {
      // Test implementation
    })
  })
})
```

### Best Practices

- ✅ Use descriptive test names
- ✅ Test one thing per test case  
- ✅ Use fixtures for consistent test data
- ✅ Mock external dependencies
- ✅ Clean up after tests
- ✅ Test both happy and error paths

## Support

For questions about the test suite:
- Review test files for examples
- Check `TESTING_GUIDE.md` for detailed procedures  
- Examine mock implementations for service testing patterns

---

*Test suite created December 2023*  
*Framework: Vitest + Vue Test Utils + Testing Library*  
*Coverage: 78 test cases across unit, integration, and E2E scenarios*