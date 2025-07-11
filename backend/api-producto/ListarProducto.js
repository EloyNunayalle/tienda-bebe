const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 't_productos1';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*', // Puedes cambiar * por tu dominio en producción
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  try {
    const body = JSON.parse(event.body);
    const token = event.headers.Authorization || event.headers.authorization;

    const tokenResult = await lambda.invoke({
      FunctionName: 'api-bebes-dev-validarUsuario',
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({ token })
    }).promise();

    const validation = JSON.parse(tokenResult.Payload);

    if (!validation.body || validation.statusCode === 403) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Token inválido' })
      };
    }

    const { limit = 5, start_key } = body;

    const params = {
      TableName: TABLE_NAME,
      Limit: limit
    };

    if (start_key) {
      params.ExclusiveStartKey = start_key;
    }

    const response = await dynamodb.scan(params).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        productos: response.Items,
        lastEvaluatedKey: response.LastEvaluatedKey || null
      })
    };

  } catch (err) {
    console.error('ERROR en ListarProducto:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
