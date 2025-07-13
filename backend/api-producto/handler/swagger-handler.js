const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

exports.handler = async (event) => {
    const basePath = process.env.LAMBDA_TASK_ROOT ? path.join(process.env.LAMBDA_TASK_ROOT, 'swagger-ui') : path.join(__dirname, 'swagger-ui');

    const proxy = event.pathParameters ? event.pathParameters.proxy : '';
    const filePath = proxy ? path.join(basePath, proxy) : path.join(basePath, 'index.html');

    console.log(`Attempting to serve file: ${filePath}`);

    try {
        const content = fs.readFileSync(filePath);

        const mimeType = mime.lookup(filePath) || 'application/octet-stream';

        return {
            statusCode: 200,
            headers: {
                'Content-Type': mimeType,
                'Access-Control-Allow-Origin': '*' 
            },
            body: content.toString('base64'),
            isBase64Encoded: true
        };
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`File not found: ${filePath}`);
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'File not found' })
            };
        } else {
            console.error(`Error serving file ${filePath}:`, error);
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: error.message })
            };
        }
    }
};