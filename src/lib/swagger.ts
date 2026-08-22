import swaggerJSDoc from 'swagger-jsdoc';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../../package.json') as { version: string };

/**
 * OpenAPI spec built from @openapi JSDoc blocks on the route files.
 * Served at /api-docs in non-production (see app.ts).
 */
export const openApiSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'portal-api-server',
      version: pkg.version,
      description:
        'Portal API for the bouc.io platform — personal (user-scoped) instructions, ' +
        'billing/subscription records, and payment methods fetched by the agent at run start.',
      license: { name: 'Elastic-2.0', url: 'https://www.elastic.co/licensing/elastic-license' },
    },
    servers: [{ url: '/', description: 'Current host' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
});
