const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

exports.lambda_handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight OK' })
    };
  }

  const rawAuth = event.headers.Authorization || event.headers.authorization || '';
  const token = rawAuth.startsWith('Bearer ') ? rawAuth.split(' ')[1] : rawAuth;

  if (!token) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Token no proporcionado' })
    };
  }

  try {
    const tokenResult = await lambda.invoke({
      FunctionName: process.env.VALIDAR_TOKEN_FUNCTION_NAME,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({ token })
    }).promise();

    const validation = JSON.parse(tokenResult.Payload);
    if (validation.statusCode !== 200) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Token inválido o expirado' })
      };
    }

    const basePath = path.join(__dirname, '../docs/swagger-ui');
    const proxy = event.pathParameters?.proxy || '';
    
    if (proxy.includes('..')) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Path traversal no permitido' })
      };
    }

    const filePath = proxy 
      ? path.join(basePath, proxy)
      : path.join(basePath, 'index.html');

    const fileContent = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': contentType
      },
      body: fileContent.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Error:', error);
    if (error.code === 'ENOENT') {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Archivo no encontrado' })
      };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};