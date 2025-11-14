/**
 * Test runner for main process tests
 */

async function runTests() {
  // Import and run the tests
  require('./main-process.test.js');
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
