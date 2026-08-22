import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './lib/swagger';
import portalRoutes from './routes/portalRoutes';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Interactive API docs. Served in every environment: exposure is gated at the edge
// (Istio + oauth2-proxy), not by NODE_ENV, and neither path is routed externally.
// /openapi.json is read in-mesh by apidocs-api-server, which aggregates every
// service's spec at api.<domain>/v1/api-docs.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get('/openapi.json', (_req, res) => res.json(openApiSpec));

// Request / response logging (debug: full payload, info: canonical summary line)
app.use(requestLogger);

// All portal routes are namespaced under /v1/portal
app.use('/v1/portal', portalRoutes);

// 404 + global error handler (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
