const fs = require('fs');
const path = require('path');

exports.lambda_handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  try {
    // Ruta base donde están los archivos estáticos
    const basePath = path.join(__dirname, '../swagger-ui');
    
    // Obtener el proxy path
    const proxy = event.pathParameters?.proxy || '';
    
    // Determinar el archivo a servir
    const filePath = proxy 
      ? path.join(basePath, proxy)
      : path.join(basePath, 'index.html');

    console.log(`Serving file: ${filePath}`);
    
    // Leer el archivo
    const fileContent = fs.readFileSync(filePath);
    
    // Determinar el tipo MIME
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
    if (error.code === 'ENOENT') {
      console.error('File not found:', error.path);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'File not found' })
      };
    }
    
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};