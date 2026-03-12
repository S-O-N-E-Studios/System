const mongoose = require('mongoose');
const File = require('../../../src/models/File');

describe('File Model', () => {
  // Test schema structure
  test('should have required fields: filename', () => {
    const schema = File.schema;
    expect(schema.paths.filename.isRequired).toBe(true);
  });

  test('should have originalName field as optional', () => {
    const schema = File.schema;
    expect(schema.paths.originalName.isRequired).not.toBe(true);
  });

  test('should have mimeType field as optional', () => {
    const schema = File.schema;
    expect(schema.paths.mimeType.isRequired).not.toBe(true);
  });

  test('should have size field as optional', () => {
    const schema = File.schema;
    expect(schema.paths.size.isRequired).not.toBe(true);
  });

  test('should have url field as optional', () => {
    const schema = File.schema;
    expect(schema.paths.url.isRequired).not.toBe(true);
  });

  test('should have uploadedBy field as reference to User', () => {
    const schema = File.schema;
    expect(schema.paths.uploadedBy.instance).toBe('ObjectId');
    expect(schema.paths.uploadedBy.options.ref).toBe('User');
  });

  test('should have timestamps', () => {
    const schema = File.schema;
    expect(schema.paths.createdAt).toBeDefined();
    expect(schema.paths.updatedAt).toBeDefined();
  });

  test('should have correct field types', () => {
    const schema = File.schema;
    expect(schema.paths.filename.instance).toBe('String');
    expect(schema.paths.originalName.instance).toBe('String');
    expect(schema.paths.mimeType.instance).toBe('String');
    expect(schema.paths.size.instance).toBe('Number');
    expect(schema.paths.url.instance).toBe('String');
  });
});
