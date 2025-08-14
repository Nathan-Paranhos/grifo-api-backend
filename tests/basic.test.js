// Basic test to ensure Jest is working

describe('Basic Tests', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should have test environment set', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('should have JWT secret set', () => {
    expect(process.env.JWT_SECRET).toBeDefined();
  });
});