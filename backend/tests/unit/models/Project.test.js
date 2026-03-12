const mongoose = require('mongoose');
const Project = require('../../../src/models/Project');

describe('Project Model', () => {
  // Test schema structure
  test('should have required fields: name', () => {
    const schema = Project.schema;
    expect(schema.paths.name.isRequired).toBe(true);
  });

  test('should have description field as optional', () => {
    const schema = Project.schema;
    expect(schema.paths.description.isRequired).not.toBe(true);
  });

  test('should have status field with enum values', () => {
    const schema = Project.schema;
    expect(schema.paths.status.enumValues).toEqual(['planning', 'active', 'on_hold', 'completed']);
  });

  test('should set default status to planning', () => {
    const schema = Project.schema;
    expect(schema.paths.status.defaultValue).toBe('planning');
  });

  test('should have createdBy field as reference to User', () => {
    const schema = Project.schema;
    expect(schema.paths.createdBy.instance).toBe('ObjectId');
    expect(schema.paths.createdBy.options.ref).toBe('User');
  });

  test('should have timestamps', () => {
    const schema = Project.schema;
    expect(schema.paths.createdAt).toBeDefined();
    expect(schema.paths.updatedAt).toBeDefined();
  });

  test('should have correct field types', () => {
    const schema = Project.schema;
    expect(schema.paths.name.instance).toBe('String');
    expect(schema.paths.description.instance).toBe('String');
    expect(schema.paths.status.instance).toBe('String');
  });
});
