const mongoose = require('mongoose');
const Task = require('../../../src/models/Task');

describe('Task Model', () => {
  // Test schema structure
  test('should have required fields: title', () => {
    const schema = Task.schema;
    expect(schema.paths.title.isRequired).toBe(true);
  });

  test('should have description field as optional', () => {
    const schema = Task.schema;
    expect(schema.paths.description.isRequired).not.toBe(true);
  });

  test('should have status field with enum values', () => {
    const schema = Task.schema;
    expect(schema.paths.status.enumValues).toEqual(['todo', 'in_progress', 'review', 'done']);
  });

  test('should set default status to todo', () => {
    const schema = Task.schema;
    expect(schema.paths.status.defaultValue).toBe('todo');
  });

  test('should have project field as reference to Project', () => {
    const schema = Task.schema;
    expect(schema.paths.project.instance).toBe('ObjectId');
    expect(schema.paths.project.options.ref).toBe('Project');
  });

  test('should have assignee field as reference to User', () => {
    const schema = Task.schema;
    expect(schema.paths.assignee.instance).toBe('ObjectId');
    expect(schema.paths.assignee.options.ref).toBe('User');
  });

  test('should have timestamps', () => {
    const schema = Task.schema;
    expect(schema.paths.createdAt).toBeDefined();
    expect(schema.paths.updatedAt).toBeDefined();
  });

  test('should have correct field types', () => {
    const schema = Task.schema;
    expect(schema.paths.title.instance).toBe('String');
    expect(schema.paths.description.instance).toBe('String');
    expect(schema.paths.status.instance).toBe('String');
  });
});
