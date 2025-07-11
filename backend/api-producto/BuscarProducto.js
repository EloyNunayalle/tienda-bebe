const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_PRODUCTOS;


exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*', // En producción, usar tu dominio en vez de '*'
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  try {
    const body = JSON.parse(event.body || '{}');
    const { producto_id } = body;

    if (!producto_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Falta producto_id' })
      };
    }

    const token = event.headers?.Authorization || event.headers?.authorization;
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token no proporcionado' })
      };
    }

    const tokenResult = await lambda.invoke({
      FunctionName: process.env.VALIDAR_FUNC_NAME,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({ token })
    }).promise();

    const payload = JSON.parse(tokenResult.Payload);

    if (payload.statusCode === 403) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Token inválido' })
      };
    }

    const data = JSON.parse(payload.body);
    const tenant_id = data.tenant_id;

    if (!tenant_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Falta tenant_id del token' })
      };
    }

    const result = await dynamodb.scan({
      TableName: TABLE_NAME,
      FilterExpression: "producto_id = :pid",
      ExpressionAttributeValues: { ":pid": producto_id }
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Items[0] || {})
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
