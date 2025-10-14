# Test Suite

This directory contains comprehensive unit tests for the OpenAI PR Reviewer GitHub Action.

## Test Files

### Existing Tests
- `main.test.ts` - Basic integration test for main entry point
- `workflow-validation.test.ts` - GitHub Actions workflow validation
- `workflows.test.ts` - Specific workflow file tests

### New Comprehensive Tests (Added)
- `inputs.test.ts` - Tests for Inputs class (31 tests)
- `limits.test.ts` - Tests for TokenLimits class (23 tests)
- `options.test.ts` - Tests for Options, PathFilter, and OpenAIOptions (45 tests)
- `prompts.test.ts` - Tests for Prompts class (37 tests)
- `tokenizer.test.ts` - Tests for tokenizer module (42 tests)
- `commenter.test.ts` - Tests for Commenter class (57 tests)

## Total Coverage

- **235+ new test cases** covering core functionality.
- Tests for pure functions, data structures, and business logic.
- Comprehensive edge case coverage.
- Real-world scenario testing

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test -- inputs.test.ts

# Watch mode
npm test -- --watch
```

## Test Structure

Each test file follows this structure:

1. **Imports and Setup**: Import dependencies and set up mocks
2. **Test Suites**: Organized by functionality
3. **Test Cases**: Individual test scenarios
4. **Assertions**: Clear expectations using Jest matchers

## Key Testing Principles

- ✅ **Isolation**: Each test is independent
- ✅ **Clarity**: Descriptive test names
- ✅ **Coverage**: Happy paths, edge cases, and errors
- ✅ **Maintainability**: Well-organized and documented

See `TEST_COVERAGE.md` for detailed information about test coverage.