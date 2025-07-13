const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Configuración de Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
    },
  },
  apis: ['./*.js'], // Archivos que contienen documentación Swagger
};

const specs = swaggerJsdoc(options);

// Handler principal
module.exports.handler = async (event, context) => {
  const html = swaggerUi.generateHTML(specs);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: html
  };
};