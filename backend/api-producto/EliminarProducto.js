const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');  

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

    let token = rawAuth;  // Usamos el token directamente sin procesarlo

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
      FunctionName: process.env.VALIDAR_TOKEN_FUNCTION_NAME,  // Nombre de la función Lambda para validar el token
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({ token })
    }).promise();

    const validation = JSON.parse(tokenResult.Payload);
    console.log("Token validation response:", validation); 

    // 4) Verificar si la validación del token devolvió un error
    if (validation.statusCode !== 200) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Token inválido' })
      };
    }

    const { tenant_id: tokenTenantId, rol: userRol, user_id: userId } = JSON.parse(validation.body);  // Obtener tenant_id, rol y user_id del token

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

    console.log("Token tenant_id:", tokenTenantId);  
    console.log("Request tenant_id:", body.tenant_id);

    // 6) Extraer campos del payload
    const { producto_id, tenant_id } = body;

    // 7) Validaciones mínimas
    if (!producto_id || !tenant_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Missing required fields' })
      };
    }

    // 8) Validar que el tenant_id coincida con el del token
    if (tenant_id !== tokenTenantId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'El tenant_id del token no coincide con el proporcionado en el cuerpo' })
      };
    }

    // 9) Validar que el rol sea 'admin'
    if (userRol !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Solo los administradores pueden eliminar productos' })
      };
    }

    // 10) Eliminar el producto utilizando tenant_id y producto_id
    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: {
        tenant_id: tenant_id,  // Usamos tenant_id
        producto_id: producto_id  // Usamos el producto_id
      }
    }).promise();

    const item = result.Item;
    if (!item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Producto no encontrado' })
      };
    }

    // 11) Eliminar el producto
    await dynamodb.delete({
      TableName: TABLE_NAME,
      Key: {
        tenant_id: item.tenant_id,
        producto_id: producto_id
      }
    }).promise();

    // 12) Responder éxito
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Producto eliminado exitosamente' })
    };

  } catch (err) {
    console.error('❌ Error en EliminarProducto:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' })
    };
  }
};
