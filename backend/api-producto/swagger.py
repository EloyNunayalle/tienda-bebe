const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Productos para Bebés',
      version: '1.0.0',
      description: 'API para gestión de productos multi-tenant',
    },
    servers: [
      {
        url: '/dev',
        description: 'Entorno de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./*.js'], // Buscar documentación en todos los archivos .js
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customSiteTitle: "API Productos para Bebés",
    customCss: '.swagger-ui .topbar { display: none }'
  }));
};