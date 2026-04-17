const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'EVIDENTIARY API',
    version: '7.0.0',
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
        summary: 'Advance project stage',
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
  },
};

module.exports = { openApiSpec };
