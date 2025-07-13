const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

module.exports.handler = async (event) => {
  const html = swaggerUi.generateHTML(swaggerDocument);
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: html
  };
};