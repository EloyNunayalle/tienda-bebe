const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_PRODUCTOS;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  try {
    // 1) Obtener el token desde el header
    const rawAuth = event.headers.Authorization || event.headers.authorization || '';
    console.log('🔑 raw Authorization header:', rawAuth);

    let token = rawAuth;
    if (rawAuth.toLowerCase().startsWith('bearer ')) {
      token = rawAuth.slice(7);  // Extraemos el token sin el "Bearer"
    }

    // 2) Si no hay token, rechazamos
    if (!token) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Token no proporcionado' })
      };
    }

    // 3) Validar el token (invocar la función Lambda que valida el token)
    const tokenResult = await lambda.invoke({
      FunctionName: process.env.VALIDAR_TOKEN_FUNCTION_NAME,  
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({ token })
    }).promise();

    const validation = JSON.parse(tokenResult.Payload);

    // 4) Verificar que la respuesta del token es válida
    if (!validation.body || validation.statusCode === 403) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Token inválido' })
      };
    }

    console.log(' Token validado:', validation.body);  

    const { tenant_id: tokenTenantId, rol: userRol } = JSON.parse(validation.body);  // Obtener tenant_id 

    // 5) Parsear el body JSON
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

    const { tenant_id: requestTenantId, producto_id } = body;

    // 6) Validación de datos
    if (!producto_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Falta producto_id' })
      };
    }

    if (!requestTenantId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Falta tenant_id en la solicitud' })
      };
    }

    // 7) Verificar que el tenant_id del token coincida con el tenant_id de la solicitud
    if (requestTenantId !== tokenTenantId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'El tenant_id del token no coincide con el proporcionado en la solicitud' })
      };
    }

    // 8) Realizar la consulta en DynamoDB con el producto_id
    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: {
        tenant_id: requestTenantId,  // Usar tenant_id del request
        producto_id: producto_id  // Buscar por producto_id
      }
    }).promise();

    // 9) Verificar si el producto existe
    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Producto no encontrado' })
      };
    }

    // 10) Responder con el producto encontrado
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Item)
    };

  } catch (err) {
    console.error('ERROR en ListarProducto:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Error interno del servidor' })
    };
  }
};
