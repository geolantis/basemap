# Testing Guide - Maputnik Style Upload Feature

This comprehensive testing guide covers all aspects of testing the Maputnik style upload feature, including automated tests and manual testing procedures.

## Table of Contents

1. [Test Setup](#test-setup)
2. [Running Tests](#running-tests)
3. [Test Coverage](#test-coverage)
4. [Manual Testing](#manual-testing)
5. [Test Files and Fixtures](#test-files-and-fixtures)
6. [Known Issues](#known-issues)
7. [Performance Testing](#performance-testing)

## Test Setup

### Prerequisites

- Node.js 16+ installed
- NPM dependencies installed (`npm install`)
- Style server running on port 3001 (`npm run styles:server`)

### Installation

The testing framework (Vitest) is already configured. To set up:

```bash
# Install dependencies (if not already done)
npm install

# Verify test setup
npm run test -- --version
```

### Environment Variables

For integration tests, ensure the following are set:

```bash
# In .env or environment
TEST_API_BASE_URL=http://localhost:3001
TEST_UPLOAD_ENDPOINT=/api/styles/upload
```

## Running Tests

### All Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests once and exit
npm run test:run
```

### Specific Test Suites

```bash
# Unit tests only
npm run test -- --grep "StyleUploadModal"

# Integration tests only
npm run test -- --grep "Integration"

# E2E tests only
npm run test -- --grep "E2E"
```

### Test UI

```bash
# Open Vitest UI for interactive testing
npm run test:ui
```

### Coverage

```bash
# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

### Current Coverage Targets

- **Unit Tests**: >90% coverage for StyleUploadModal component
- **Integration Tests**: All API endpoints and service methods
- **E2E Tests**: Complete user workflows

### Coverage Areas

#### StyleUploadModal Component ✅
- Component rendering and visibility
- File selection and validation
- Drag and drop functionality  
- Form validation and submission
- Error handling and user feedback
- Progress tracking
- Modal controls and navigation

#### Upload API Endpoints ✅
- Valid file uploads
- File validation (type, size, format)
- Error responses and status codes
- Concurrent upload handling
- File accessibility via public URLs

#### Map Configuration Integration ✅
- Configuration creation from uploaded styles
- Style URL generation and validation
- Search and filtering of uploaded styles
- Metadata handling and updates

## Manual Testing

### Test Environment Setup

1. **Start Development Server**
   ```bash
   npm run dev:all  # Starts both frontend and style server
   ```

2. **Open Application**
   - Navigate to `http://localhost:5173`
   - Ensure style server is running on `http://localhost:3001`

### Manual Test Scenarios

#### Scenario 1: Valid Style Upload ✅

**Objective**: Test complete upload workflow with valid Maputnik style

**Steps**:
1. Click "Upload Custom Style" button/link to open modal
2. Drag and drop the test file: `src/test/fixtures/valid-maputnik-style.json`
3. Verify file preview shows correct information:
   - Style name: "Test Basemap Style"
   - Layers count: 7
   - Sources count: 2
4. Fill in form fields:
   - **Name**: `test-basemap-style`
   - **Label**: `Test Basemap Style`
   - **Country**: `Germany (🇩🇪)`
   - **Type**: `VTC (Vector Tiles)`
   - **Description**: `Test upload from manual testing`
5. Click "Upload Style" button
6. Verify success message appears
7. Verify modal closes automatically after 2 seconds
8. Check that uploaded style appears in map configuration list

**Expected Results**:
- ✅ File validates successfully
- ✅ Preview shows correct metadata
- ✅ Form validates all required fields
- ✅ Upload completes without errors
- ✅ Success feedback is shown
- ✅ Style is accessible via generated URL

#### Scenario 2: Invalid File Rejection ✅

**Objective**: Test file validation with various invalid files

**Steps**:
1. Open upload modal
2. Try uploading each invalid file:
   - **Text file**: Create `test.txt` with text content
   - **Large file**: Create JSON file > 10MB (use online generator)
   - **Malformed JSON**: Use `src/test/fixtures/malformed.json`
   - **Invalid style**: Use `src/test/fixtures/invalid-style.json`
3. Verify appropriate error messages for each case

**Expected Results**:
- Text file: "Please select a valid JSON file"
- Large file: "File size must be less than 10MB"
- Malformed JSON: "Invalid JSON file. Please check the file format"
- Invalid style: "Invalid Mapbox style format. Please ensure the JSON contains version and layers"

#### Scenario 3: Drag and Drop Interface ✅

**Objective**: Test drag and drop functionality

**Steps**:
1. Open upload modal
2. Open file explorer with `valid-maputnik-style.json`
3. Drag file over upload area
4. Verify visual feedback (blue border, blue background)
5. Drop file
6. Verify file is processed and preview appears
7. Try dragging multiple files and verify only first is processed

**Expected Results**:
- Visual feedback during drag operations
- Single file processing
- Smooth user experience

#### Scenario 4: Form Validation ✅

**Objective**: Test form field validation

**Steps**:
1. Upload valid style file
2. Try submitting with empty required fields:
   - Leave **Name** empty → Upload button disabled
   - Leave **Label** empty → Upload button disabled
   - Leave **Country** unselected → Upload button disabled
   - Leave **Type** unselected → Upload button disabled
3. Fill all required fields → Upload button enabled
4. Test auto-population: Change name, verify label auto-updates (if label was empty)

**Expected Results**:
- Upload button disabled until all required fields filled
- Auto-population works correctly
- Form validation provides clear feedback

#### Scenario 5: Network Error Handling ✅

**Objective**: Test error handling during upload

**Steps**:
1. Stop the style server (`Ctrl+C` in terminal running styles:server)
2. Complete upload form with valid data
3. Click upload button
4. Verify error handling when server is unavailable
5. Restart server: `npm run styles:server`
6. Try upload again to verify recovery

**Expected Results**:
- Clear error message when server unavailable
- Retry capability when server restored
- No application crashes

#### Scenario 6: File Size and Progress ✅

**Objective**: Test upload progress and file size handling

**Steps**:
1. Create a moderately large valid JSON file (1-5MB)
2. Upload the file
3. Observe progress indicator
4. Verify file size is displayed correctly in preview

**Expected Results**:
- Progress bar shows during upload
- File size formatted correctly (KB, MB)
- Upload completes successfully

### Browser Compatibility Testing

Test the upload feature across different browsers:

#### Chrome/Chromium ✅
- Full drag and drop support
- File API support
- FormData upload support

#### Firefox ✅
- Full feature compatibility expected
- Test drag and drop specifically

#### Safari ✅
- May have different drag/drop behavior
- Verify file type validation

#### Edge ✅
- Should work identically to Chrome
- Test on Windows if possible

### Mobile Testing

#### iOS Safari
- Drag and drop not available
- File input should work
- Touch interface considerations

#### Android Chrome
- Similar to desktop Chrome
- File picker integration
- Touch interactions

## Test Files and Fixtures

### Located in `src/test/fixtures/`

#### `valid-maputnik-style.json` ✅
- Complete valid Maputnik style
- Contains all required fields (version, sources, layers)
- Includes realistic layer definitions
- File size: ~2.5KB
- Use for: Positive test cases

#### `invalid-style.json` ✅  
- Missing required fields (version, sources)
- Use for: Validation error testing

#### `malformed.json` ✅
- Invalid JSON syntax (missing comma)
- Use for: JSON parsing error testing

### Test File Creation

Create additional test files as needed:

```bash
# Large file for size testing (create 11MB+ JSON)
node -e "console.log(JSON.stringify({data: 'x'.repeat(11*1024*1024)}))" > large-file.json

# Empty JSON
echo '{}' > empty.json

# Non-JSON file
echo 'This is not JSON' > test.txt
```

## Performance Testing

### Load Testing

Test concurrent uploads:

```bash
# Simulate multiple users uploading
for i in {1..5}; do
  curl -X POST \
    -F "style=@src/test/fixtures/valid-maputnik-style.json" \
    -F "name=load-test-$i" \
    -F "label=Load Test $i" \
    -F "country=de" \
    -F "type=vtc" \
    http://localhost:3001/api/styles/upload &
done
wait
```

### Memory Testing

Monitor memory usage during:
- Large file uploads (5-10MB)
- Multiple concurrent uploads
- Repeated upload/delete cycles

### Network Testing

Test under various network conditions:
- Slow connections (throttle in DevTools)
- Intermittent connectivity
- High latency networks

## Known Issues and Limitations

### Current Limitations ⚠️

1. **File Size**: 10MB limit (configurable in server.js)
2. **Concurrent Uploads**: User can only upload one file at a time
3. **File Types**: Only JSON files accepted
4. **Browser Support**: Modern browsers only (ES6+)

### Known Issues 🐛

1. **Progress Tracking**: Progress is simulated, not real-time
2. **Session Handling**: No session timeout handling during long uploads
3. **Cleanup**: Failed uploads may leave temporary files

### Workarounds

1. **Large Files**: Split very large styles into multiple files
2. **Progress**: Future enhancement for real progress tracking
3. **Session**: Implement session refresh mechanism

## Automated Test Maintenance

### Adding New Tests

1. **Unit Tests**: Add to `src/components/__tests__/StyleUploadModal.spec.ts`
2. **Integration Tests**: Add to `src/test/integration/`
3. **E2E Tests**: Add to `src/test/e2e/`

### Test Data Management

- Keep fixture files small and focused
- Use factories for generating test data
- Mock external dependencies consistently

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
name: Test Style Upload Feature
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run test:run
      - run: npm run test:coverage
```

## Reporting Issues

When reporting test failures or issues:

1. **Environment**: OS, browser, Node.js version
2. **Steps**: Exact steps to reproduce
3. **Expected**: What should happen
4. **Actual**: What actually happened
5. **Logs**: Console errors, network logs
6. **Screenshots**: For UI issues

## Contact and Support

For questions about testing:
- Review test files in `src/test/`
- Check component implementation in `src/components/StyleUploadModal.vue`
- Examine API server code in `server.js`

---

*Last updated: December 2023*
*Test framework: Vitest with Vue Test Utils*
*Coverage target: >85% overall*