const mongoose = require('mongoose');
const User = require('../../../src/models/User');

describe('User Model', () => {
  // Test schema structure
  test('should have required fields: name, email, password', () => {
    const schema = User.schema;
    expect(schema.paths.name.isRequired).toBe(true);
    expect(schema.paths.email.isRequired).toBe(true);
    expect(schema.paths.password.isRequired).toBe(true);
  });

  test('should have email field with unique constraint', () => {
    const schema = User.schema;
    expect(schema.paths.email.options.unique).toBe(true);
  });

  test('should have role field with enum values', () => {
    const schema = User.schema;
    expect(schema.paths.role.enumValues).toEqual(['user', 'admin', 'manager']);
  });

  test('should set default role to user', () => {
    const schema = User.schema;
    expect(schema.paths.role.defaultValue).toBe('user');
  });

  test('should have password field with select false', () => {
    const schema = User.schema;
    expect(schema.paths.password.options.select).toBe(false);
  });

  test('should have timestamps', () => {
    const schema = User.schema;
    expect(schema.paths.createdAt).toBeDefined();
    expect(schema.paths.updatedAt).toBeDefined();
  });

  test('should have correct field types', () => {
    const schema = User.schema;
    expect(schema.paths.name.instance).toBe('String');
    expect(schema.paths.email.instance).toBe('String');
    expect(schema.paths.password.instance).toBe('String');
    expect(schema.paths.role.instance).toBe('String');
  });
});
