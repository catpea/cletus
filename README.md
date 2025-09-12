# Cletus

A lightweight, elegant test runner for JavaScript that works in both Node.js and the browser. The name Cletus comes from Greek, meaning "called forth" or "summoned" - exactly what this library does with your tests.

## Installation

```bash
npm install cletus
```

Or if you prefer yarn:

```bash
yarn add cletus
```

## Getting Started

Cletus provides a simple, intuitive API for writing tests. At its core, you have two main functions: `test` for writing individual tests, and `suite` (or `describe`) for organizing tests into groups.

### Your First Test

Create a file called `math.test.js`:

```javascript
import { test } from 'cletus';
import assert from 'assert';

test('addition works correctly', () => {
  assert.strictEqual(1 + 1, 2);
});

test('multiplication works correctly', () => {
  assert.strictEqual(3 * 4, 12);
});
```

Run your tests:

```bash
node math.test.js
```

You'll see output like this:

```
✓ addition works correctly (2ms)
✓ multiplication works correctly (1ms)

────────────────────────────────────────
Tests: 2 passed, 2 total
```

## Writing Tests

### Synchronous Tests

The simplest tests are synchronous. They pass if they don't throw an error:

```javascript
import { test } from 'cletus';
import assert from 'assert';

test('strings can be concatenated', () => {
  const result = 'hello' + ' ' + 'world';
  assert.strictEqual(result, 'hello world');
});
```

### Asynchronous Tests

Cletus handles asynchronous tests naturally. Just return a promise or use async/await:

```javascript
test('async operations work', async () => {
  const data = await fetchSomeData();
  assert.strictEqual(data.status, 'ok');
});

test('promises work too', () => {
  return fetch('/api/status')
    .then(response => response.json())
    .then(data => {
      assert.strictEqual(data.status, 'healthy');
    });
});
```

### Callback-Style Tests

For legacy code or specific scenarios, Cletus supports callback-style tests. The test receives a second parameter `done` that you call when finished:

```javascript
test('callback style test', (t, done) => {
  setTimeout(() => {
    assert.strictEqual(1, 1);
    done();
  }, 100);
});

test('callback with error', (t, done) => {
  setTimeout(() => {
    done(new Error('something went wrong'));
  }, 100);
});
```

## Organizing Tests

### Suites and Describes

Group related tests together using `suite` or `describe` (they're the same thing):

```javascript
import { describe, it } from 'cletus';
import assert from 'assert';

describe('Array methods', () => {
  it('should return -1 when value is not found', () => {
    assert.strictEqual([1, 2, 3].indexOf(4), -1);
  });

  it('should return the index when value is found', () => {
    assert.strictEqual([1, 2, 3].indexOf(2), 1);
  });
});
```

### Nested Suites

You can nest suites to create a hierarchy that matches your code structure:

```javascript
describe('User authentication', () => {
  describe('login', () => {
    it('should accept valid credentials', () => {
      // test implementation
    });

    it('should reject invalid credentials', () => {
      // test implementation
    });
  });

  describe('logout', () => {
    it('should clear the session', () => {
      // test implementation
    });
  });
});
```

## Subtests

One of Cletus's powerful features is the ability to create subtests within a test. This is useful for testing variations or related scenarios:

```javascript
test('database operations', async (t) => {
  const db = await connectToDatabase();

  await t.test('can insert records', async () => {
    const result = await db.insert({ name: 'Alice' });
    assert.ok(result.id);
  });

  await t.test('can query records', async () => {
    const records = await db.find({ name: 'Alice' });
    assert.strictEqual(records.length, 1);
  });

  await db.close();
});
```

The parent test waits for all subtests to complete. If you remove the `await` keyword, subtests run independently and may be cancelled if the parent completes first.

## Test Options

### Skipping Tests

Sometimes you need to temporarily disable a test. Use the `skip` option:

```javascript
test('work in progress', { skip: true }, () => {
  // This code won't run
  assert.fail('This should not execute');
});
```

### Todo Tests

Mark tests that you plan to implement later with the `todo` option. These tests run but don't cause failures:

```javascript
test('advanced feature', { todo: true }, () => {
  // This test runs but won't fail the suite
  throw new Error('not implemented yet');
});
```

## Best Practices

### Keep Tests Simple

Each test should verify one specific behavior. If you find yourself writing many assertions in a single test, consider splitting it into multiple tests or using subtests.

```javascript
// Good: Clear, focused tests
test('user email must be valid', () => {
  assert.throws(() => createUser({ email: 'invalid' }));
});

test('user email is normalized', () => {
  const user = createUser({ email: 'JOHN@EXAMPLE.COM' });
  assert.strictEqual(user.email, 'john@example.com');
});
```

### Use Descriptive Names

Test names should clearly describe what is being tested and what the expected outcome is:

```javascript
// Less clear
test('user test', () => { /* ... */ });

// More clear
test('user registration requires valid email address', () => { /* ... */ });
```

### Organize Related Tests

Use suites to group related tests together. This makes your test output easier to read and helps maintain your test files:

```javascript
describe('ShoppingCart', () => {
  describe('adding items', () => {
    it('should increase the item count', () => { /* ... */ });
    it('should calculate the total price', () => { /* ... */ });
  });

  describe('removing items', () => {
    it('should decrease the item count', () => { /* ... */ });
    it('should update the total price', () => { /* ... */ });
  });
});
```

## Running Tests

### In Node.js

Simply run your test files with Node:

```bash
node test/my-tests.js
```

Or add a test script to your `package.json`:

```json
{
  "scripts": {
    "test": "node test/*.test.js"
  }
}
```

### In the Browser

Include Cletus in your HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Tests</title>
  <script type="module">
    import { test, describe, it } from './cletus.js';

    describe('Browser tests', () => {
      it('should have access to DOM', () => {
        const div = document.createElement('div');
        console.assert(div instanceof HTMLElement);
      });
    });
  </script>
</head>
<body>
  <h1>Check the console for test results</h1>
</body>
</html>
```

## Understanding Test Output

Cletus provides clear, colored output to help you quickly understand test results:

- Green checkmark: Test passed
- Red cross: Test failed
- Yellow circle: Test skipped or marked as todo
- Timing information shows how long each test took
- Indentation shows the structure of nested tests and suites

Failed tests show the error message to help you quickly identify the problem:

```
✗ user validation should reject empty email
  Email is required

────────────────────────────────────────
Tests: 5 passed, 1 failed, 6 total
```

## Migration Guide

If you're coming from other test frameworks, here's a quick comparison:

### From Mocha or Jest

The API is very similar. The main differences:

- Use `import { test, describe, it } from 'cletus'` instead of global functions
- No built-in assertion library - use Node's `assert` module or your preferred library
- No built-in mocking - use your preferred mocking library

### From Tape

Cletus is similar but with a more modern API:

- Tests can be async functions instead of using `t.end()`
- Organizing tests in suites is built-in
- Subtests are supported natively

## Philosophy

Cletus follows these principles:

1. **Simplicity First**: The API should be obvious and easy to remember
2. **No Magic**: What you write is what runs - no hidden transformations
3. **Universal**: The same code works in Node.js and browsers
4. **Lightweight**: Minimal dependencies and small footprint
5. **Elegant**: The code you write should be pleasant to read and maintain

## Contributing

Cletus is open source and we welcome contributions. Whether you're fixing a bug, adding a feature, or improving documentation, your help makes Cletus better for everyone.

## License

MIT

---

Named after the Greek word meaning "called forth," Cletus summons your tests into action with grace and simplicity.
