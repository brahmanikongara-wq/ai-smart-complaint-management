import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',

    info: {
      title: 'ResolvAI - AI Smart Complaint & Service Management Platform API',
      version: '1.0.0',
      description:
        'AI-powered Smart Complaint and Service Management Platform API.',
    },

    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Local Development Server',
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },

  apis: [
    path.join(__dirname, '../routes/*.routes.js'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);