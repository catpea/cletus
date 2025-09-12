/**
 * Elegant Test Runner for Node.js and Browser
 * ES2025 Compatible Implementation
 */

const isNode = typeof process !== 'undefined' && process.versions?.node;
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m'
};

// Color helper for cross-platform support
const color = (text, code) =>
  isNode && process.stdout.isTTY ? `${code}${text}${colors.reset}` : text;

// Test context and state management
const context = {
  suites: [],
  current: null,
  results: { passed: 0, failed: 0, skipped: 0, todo: 0 },
  depth: 0
};

// Test context class for subtests
class TestContext {
  constructor(name, depth = 0) {
    this.name = name;
    this.depth = depth;
    this.subtests = [];
    this.abortController = new AbortController();
  }

  async test(name, options, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    const subtest = new TestContext(name, this.depth + 1);
    this.subtests.push(subtest);

    try {
      await runTest(name, options, fn, subtest);
    } catch (error) {
      // Subtest errors are already handled
    }

    return subtest;
  }

  abort() {
    this.abortController.abort();
    this.subtests.forEach(st => st.abort());
  }
}

// Core test runner
async function runTest(name, options, fn, testContext = null) {
  const indent = '  '.repeat(context.depth);

  // Handle options shorthand
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  // Skip test
  if (options.skip) {
    console.log(`${indent}${color('○', colors.yellow)} ${name} ${color('[skipped]', colors.dim)}`);
    context.results.skipped++;
    return;
  }

  // Todo test
  if (options.todo) {
    try {
      await executeTest(fn, testContext);
      console.log(`${indent}${color('○', colors.yellow)} ${name} ${color('[todo]', colors.dim)}`);
    } catch {
      console.log(`${indent}${color('○', colors.yellow)} ${name} ${color('[todo]', colors.dim)}`);
    }
    context.results.todo++;
    return;
  }

  // Regular test execution
  try {
    const startTime = performance.now();
    await executeTest(fn, testContext);
    const duration = Math.round(performance.now() - startTime);

    console.log(`${indent}${color('✓', colors.green)} ${name} ${color(`(${duration}ms)`, colors.dim)}`);
    context.results.passed++;
  } catch (error) {
    console.log(`${indent}${color('✗', colors.red)} ${name}`);
    if (error.message) {
      console.log(`${indent}  ${color(error.message, colors.red)}`);
    }
    context.results.failed++;
    throw error;
  }
}

// Execute test with proper context handling
async function executeTest(fn, testContext) {
  const ctx = testContext || new TestContext('', context.depth);

  // Check if callback-style (has done parameter)
  if (fn.length > 1) {
    return new Promise((resolve, reject) => {
      const done = (error) => {
        if (error) reject(error);
        else resolve();
      };

      try {
        fn(ctx, done);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Promise/async style
  const result = fn(ctx);

  // Handle promises
  if (result && typeof result.then === 'function') {
    await result;
  }

  // Wait for subtests
  if (ctx.subtests.length > 0) {
    await Promise.all(ctx.subtests.map(st => st.promise));
  }
}

// Suite/describe implementation
function suite(name, fn) {
  const previousDepth = context.depth;
  const previousSuite = context.current;

  console.log(`${'  '.repeat(context.depth)}${name}`);
  context.depth++;
  context.current = { name, tests: [] };
  context.suites.push(context.current);

  try {
    fn();
  } finally {
    context.depth = previousDepth;
    context.current = previousSuite;
  }
}

// Test implementation
function test(name, options, fn) {
  // Queue test for execution if inside suite
  if (context.current) {
    context.current.tests.push({ name, options, fn });
    setImmediate(() => runTest(name, options, fn));
  } else {
    // Run immediately if top-level
    setImmediate(() => runTest(name, options, fn));
  }
}

// Aliases
const describe = suite;
const it = test;

// Summary reporter
process?.on?.('exit', () => {
  const { passed, failed, skipped, todo } = context.results;
  const total = passed + failed + skipped + todo;

  if (total > 0) {
    console.log('\n' + '─'.repeat(40));
    console.log(
      `Tests: ${color(passed + ' passed', colors.green)}, ` +
      `${failed ? color(failed + ' failed', colors.red) + ', ' : ''}` +
      `${skipped ? color(skipped + ' skipped', colors.yellow) + ', ' : ''}` +
      `${todo ? color(todo + ' todo', colors.yellow) + ', ' : ''}` +
      `${total} total`
    );

    if (failed > 0 && isNode) {
      process.exitCode = 1;
    }
  }
});

// Export for both Node.js and browser
const exports = { suite, test, describe, it };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exports;
} else if (typeof window !== 'undefined') {
  window.testRunner = exports;
}

export { suite, test, describe, it };
