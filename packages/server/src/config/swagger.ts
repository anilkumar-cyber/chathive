import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "NexusChat API",
      version: "1.0.0",
      description: "Real-time chat platform REST API documentation.",
    },
    servers: [{ url: "/api/v1" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, "../routes/*.ts"), path.join(__dirname, "../routes/*.js")],
});
