const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_PRODUCTOS;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*', // Cambiar * por tu dominio en producción
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  try {
    // Obtener el token desde el header
    const rawAuth = event.headers.Authorization || event.headers.authorization || '';
    console.log('🔑 raw Authorization header:', rawAuth);

    let token = rawAuth;
    if (rawAuth.toLowerCase().startsWith('bearer ')) {
      token = rawAuth.slice(7);  // Extraemos el token sin el "Bearer"
    }

    // Si no hay token, rechazamos
    if (!token) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Token no proporcionado' })
      };
    }

    // Validar el token (invocar la función Lambda que valida el token)
    const tokenResult = await lambda.invoke({
      FunctionName: process.env.VALIDAR_TOKEN_FUNCTION_NAME,  // Nombre de la función Lambda para validar el token
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

    const { tenant_id: tokenTenantId } = JSON.parse(validation.body);  // Obtener tenant_id del token

    // Parsear el body JSON
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (err) {
      console.error('❌ Error parseando body:', err);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Invalid JSON body' })
      };
    }

    const { tenant_id: requestTenantId, limit = 5, start_key } = body;

    // Verificar que el tenant_id proporcionado coincida con el del token
    if (requestTenantId !== tokenTenantId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'El tenant_id del token no coincide con el proporcionado en la solicitud' })
      };
    }

    // Parámetros de la consulta de DynamoDB
    const params = {
      TableName: TABLE_NAME,
      Limit: limit,
      FilterExpression: "tenant_id = :tenant_id", // Filtro para asegurar que solo se devuelvan productos del tenant correspondiente
      ExpressionAttributeValues: {
        ":tenant_id": tokenTenantId
      }
    };

    if (start_key) {
      params.ExclusiveStartKey = start_key;
    }

    // Realizar la consulta
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
