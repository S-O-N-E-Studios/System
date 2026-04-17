const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'EVIDENTIARY API',
    version: '9.0.0',
    description: 'EVIDENTIARY Engineering Project Management API',
  },
  servers: [
    { url: '/api/v1', description: 'Versioned API base' },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          200: { description: 'API is healthy' },
        },
      },
    },
    '/{tenantSlug}/projects/{id}/advance-stage': {
      post: {
        summary: 'Advance project stage (legacy compatibility)',
        deprecated: true,
        parameters: [
          { in: 'path', name: 'tenantSlug', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Stage advanced' },
          422: {
            description: 'Stage gate failed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'STAGE_GATE_FAILED' },
                    stage: { type: 'number' },
                    missing: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/{tenantSlug}/planning/{id}/begin-inception': {
      post: {
        summary: 'Create project from planning entry',
        parameters: [
          { in: 'path', name: 'tenantSlug', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: {
          201: { description: 'Project created from planning entry' },
        },
      },
    },
    '/{tenantSlug}/projects/{id}/workflow': {
      get: {
        summary: 'Get workflow summary',
        parameters: [
          { in: 'path', name: 'tenantSlug', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Workflow summary' },
        },
      },
    },
    '/{tenantSlug}/projects/{id}/workflow/advance': {
      post: {
        summary: 'Advance workflow checkpoint',
        parameters: [
          { in: 'path', name: 'tenantSlug', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Workflow advanced' },
          422: { description: 'Workflow gate failed' },
        },
      },
    },
    '/{tenantSlug}/projects/{id}/procurement-trails': {
      get: {
        summary: 'List procurement trails',
        parameters: [
          { in: 'path', name: 'tenantSlug', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Procurement trails list' } },
      },
      post: {
        summary: 'Create procurement trail',
        parameters: [
          { in: 'path', name: 'tenantSlug', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: { 201: { description: 'Procurement trail created' } },
      },
    },
    '/{tenantSlug}/projects/{id}/extension-of-time': {
      get: {
        summary: 'List extension-of-time requests',
        parameters: [
          { in: 'path', name: 'tenantSlug', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'EOT list' } },
      },
      post: {
        summary: 'Create extension-of-time request',
        parameters: [
          { in: 'path', name: 'tenantSlug', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: { 201: { description: 'EOT created' } },
      },
    },
    '/{tenantSlug}/projects/{id}/penalties': {
      get: {
        summary: 'List penalties',
        parameters: [
          { in: 'path', name: 'tenantSlug', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Penalty list' } },
      },
      post: {
        summary: 'Create penalty',
        parameters: [
          { in: 'path', name: 'tenantSlug', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: { 201: { description: 'Penalty created' } },
      },
    },
    '/{tenantSlug}/projects/{id}/performance': {
      get: {
        summary: 'List performance snapshots',
        parameters: [
          { in: 'path', name: 'tenantSlug', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Performance snapshots' } },
      },
      post: {
        summary: 'Upsert performance snapshot',
        parameters: [
          { in: 'path', name: 'tenantSlug', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Performance snapshot upserted' } },
      },
    },
    '/{tenantSlug}/projects/{id}/audit': {
      get: {
        summary: 'List project audit log',
        parameters: [
          { in: 'path', name: 'tenantSlug', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Project audit log entries' } },
      },
    },
    '/{tenantSlug}/projects/{id}/audit/export': {
      get: {
        summary: 'Export project audit log',
        parameters: [
          { in: 'path', name: 'tenantSlug', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'format', required: false, schema: { type: 'string', enum: ['csv', 'pdf'] } },
        ],
        responses: { 200: { description: 'Audit export file' } },
      },
    },
    '/{tenantSlug}/audit': {
      get: {
        summary: 'List tenant audit log',
        parameters: [
          { in: 'path', name: 'tenantSlug', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Tenant audit log entries' } },
      },
    },
  },
};

module.exports = { openApiSpec };
