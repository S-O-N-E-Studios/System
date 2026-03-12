const mongoose = require('mongoose');
const Sprint = require('../../../src/models/Sprint');

describe('Sprint Model', () => {
  // Test schema structure
  test('should have required fields: name', () => {
    const schema = Sprint.schema;
    expect(schema.paths.name.isRequired).toBe(true);
  });

  test('should have startDate field as optional', () => {
    const schema = Sprint.schema;
    expect(schema.paths.startDate.isRequired).not.toBe(true);
  });

  test('should have endDate field as optional', () => {
    const schema = Sprint.schema;
    expect(schema.paths.endDate.isRequired).not.toBe(true);
  });

  test('should have project field as reference to Project', () => {
    const schema = Sprint.schema;
    expect(schema.paths.project.instance).toBe('ObjectId');
    expect(schema.paths.project.options.ref).toBe('Project');
  });

  test('should have timestamps', () => {
    const schema = Sprint.schema;
    expect(schema.paths.createdAt).toBeDefined();
    expect(schema.paths.updatedAt).toBeDefined();
  });

  test('should have correct field types', () => {
    const schema = Sprint.schema;
    expect(schema.paths.name.instance).toBe('String');
    expect(schema.paths.startDate.instance).toBe('Date');
    expect(schema.paths.endDate.instance).toBe('Date');
  });
});
