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

    // Si no hay un token proporcionado, rechazamos inmediatamente
    let token = rawAuth;
    if (!token) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Token no proporcionado' })
      };
    }

    // 2) Validar el token (invocar la función Lambda que valida el token)
    const tokenResult = await lambda.invoke({
      FunctionName: process.env.VALIDAR_TOKEN_FUNCTION_NAME,  // Nombre de la función Lambda para validar el token
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({ token })
    }).promise();

    const validation = JSON.parse(tokenResult.Payload);
    console.log("Token validation response:", validation); 

    // 3) Verificar si la validación del token devolvió un error
    if (validation.statusCode !== 200) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Token inválido' })
      };
    }

    // Desestructurar tenant_id, rol, user_id desde el body de la validación
    const { tenant_id: tokenTenantId, rol: userRol } = JSON.parse(validation.body);

    // 4) Parsear el body JSON
    let body;
    try {
      body = JSON.parse(event.body);
      console.log('7) Body del producto:', body); // Log de body del producto
    } catch (err) {
      console.error('❌ Error parseando body:', err);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Invalid JSON body' })
      };
    }

    // 5) Extraer tenant_id y producto_id
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
