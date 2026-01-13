# Frontend Testing Documentation

## Overview

This directory contains comprehensive automated tests for the frontend application, focusing on authentication flows and user management.

## Test Structure

```
src/__tests__/
├── integration/          # Integration tests for complete user flows
│   ├── auth-flow.test.tsx       # Complete auth flow tests
│   └── user-session.test.ts     # User session management tests
├── unit/                # Unit tests for individual components
│   ├── api.test.ts             # API library tests
│   ├── authSlice.test.ts       # Redux auth slice tests
│   ├── login.test.tsx          # Login page tests
│   └── register.test.tsx       # Registration page tests
└── utils/               # Test utilities and helpers
    ├── mock-handlers.ts        # MSW mock API handlers
    ├── setup-tests.ts          # MSW server setup
    └── test-utils.tsx          # Custom render function with providers
```

## Test Coverage

### Authentication Flow Tests (`integration/auth-flow.test.tsx`)

- ✅ Complete registration and login flow
- ✅ Prevention of duplicate email registration
- ✅ Invalid credentials handling
- ✅ Session persistence
- ✅ Form validation flow
- ✅ Navigation between auth pages

### User Session Management (`integration/user-session.test.ts`)

- ✅ Complete login flow with user data fetch
- ✅ Logout and data clearing
- ✅ Token persistence in localStorage
- ✅ Failed login scenarios
- ✅ User societies information fetching
- ✅ Unauthorized access handling
- ✅ Session expiry and re-login

### Login Page Tests (`unit/login.test.tsx`)

- ✅ Form rendering
- ✅ Field validation (email, password)
- ✅ Successful login
- ✅ Invalid credentials error display
- ✅ Navigation links
- ✅ Loading states

### Registration Page Tests (`unit/register.test.tsx`)

- ✅ Form rendering
- ✅ Societies loading and display
- ✅ Field validation (name, email, phone, password)
- ✅ Password matching validation
- ✅ Society selection
- ✅ Successful registration
- ✅ Duplicate email handling
- ✅ Navigation links

### Auth Slice Tests (`unit/authSlice.test.ts`)

- ✅ Initial state
- ✅ Login action (success and failure)
- ✅ Registration action
- ✅ Get current user action
- ✅ Logout action
- ✅ State reducers (setCredentials, clearAuth)
- ✅ Loading states

### API Library Tests (`unit/api.test.ts`)

- ✅ Token refresh functionality
- ✅ GET requests with authentication
- ✅ POST requests
- ✅ Authorization header inclusion
- ✅ Error handling

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with UI

```bash
npm run test:ui
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test File

```bash
npm test -- login.test.tsx
```

### Run Tests Matching Pattern

```bash
npm test -- --grep "authentication"
```

## Test Utilities

### Mock Service Worker (MSW)

We use MSW to mock API endpoints, providing realistic test scenarios without actual network requests.

**Mock Endpoints:**

- POST `/api/v1/auth/login` - User login
- POST `/api/v1/auth/register` - User registration
- GET `/api/v1/auth/me` - Get current user
- POST `/api/v1/auth/refresh` - Refresh access token
- POST `/api/v1/auth/logout` - User logout
- POST `/api/v1/auth/forgot-password` - Request password reset
- POST `/api/v1/auth/reset-password` - Reset password
- GET `/api/v1/societies/public` - Get public societies list
- GET `/api/v1/users` - Get users list

### Test Users

**Valid Test User:**

- Email: `admin@test.com`
- Password: `password123`
- Returns: Mock access and refresh tokens

**Invalid Credentials:**

- Any email other than `admin@test.com`
- Returns: 401 Unauthorized error

**Existing Email (Registration):**

- Email: `existing@test.com`
- Returns: 400 Bad Request (Email already registered)

### Custom Render Function

`renderWithProviders()` - Renders components with Redux store and other providers

```typescript
import { renderWithProviders } from '@/__tests__/utils/test-utils'

const { store } = renderWithProviders(<YourComponent />, {
  preloadedState: {
    auth: { ... }
  }
})
```

## Writing New Tests

### Component Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils/test-utils'
import YourComponent from '@/path/to/component'
import '../utils/setup-tests'

describe('YourComponent', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should render correctly', () => {
    renderWithProviders(<YourComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    renderWithProviders(<YourComponent />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument()
    })
  })
})
```

### Redux Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import yourReducer, { yourAction } from '@/store/slices/yourSlice'
import '../utils/setup-tests'

describe('Your Slice', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: { your: yourReducer }
    })
  })

  it('should handle action', async () => {
    await store.dispatch(yourAction())
    const state = store.getState().your
    expect(state.someValue).toBe('expected')
  })
})
```

## Best Practices

1. **Cleanup**: Always clear localStorage and reset mocks in `beforeEach`
2. **Async Handling**: Use `waitFor` for async operations
3. **User Events**: Use `userEvent` instead of `fireEvent` for more realistic interactions
4. **Accessibility**: Use accessible queries (`getByRole`, `getByLabelText`) when possible
5. **MSW Handlers**: Keep mock handlers realistic and close to actual API responses
6. **Isolation**: Each test should be independent and not rely on other tests

## Debugging Tests

### View Test Output in UI

```bash
npm run test:ui
```

This opens a web interface where you can see test results, execution time, and re-run tests.

### Debug Specific Test

```typescript
import { screen, debug } from '@testing-library/react'

it('should debug', () => {
  renderWithProviders(<Component />)
  screen.debug() // Prints DOM to console
})
```

### Check What's Rendered

```typescript
screen.logTestingPlaygroundURL() // Generates URL with DOM snapshot
```

## CI/CD Integration

Tests run automatically in CI/CD pipelines. The configuration ensures:

- All tests pass before merging
- Coverage thresholds are met
- No console errors or warnings

## Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Cover all critical user journeys
- **E2E Tests**: (Future) Cover main user workflows

## Common Issues

### Issue: Test timeout

**Solution**: Increase timeout in waitFor or test configuration

```typescript
await waitFor(() => {
  expect(something).toBe(true)
}, { timeout: 5000 })
```

### Issue: Element not found

**Solution**: Wait for async operations or check query

```typescript
// Use findBy for async elements
const element = await screen.findByText('Async content')
```

### Issue: Mock not working

**Solution**: Ensure MSW handlers are set up correctly and server is running

```typescript
import '../utils/setup-tests' // This should be in every test file
```

## Future Enhancements

- [ ] Add E2E tests with Playwright
- [ ] Add visual regression tests
- [ ] Add performance tests
- [ ] Increase coverage to 90%+
- [ ] Add mutation testing
- [ ] Add accessibility (a11y) tests
