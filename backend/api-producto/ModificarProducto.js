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
    // 1) Comprobamos si es una solicitud OPTIONS (para CORS)
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Preflight OK' })
      };
    }

    // 2) Parsear el body de la solicitud
    const { producto_id, producto_datos, tenant_id: requestTenantId } = JSON.parse(event.body || '{}');
    const token = event.headers.Authorization || event.headers.authorization;  // Aquí obtenemos el token directamente

    if (!token) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Token no proporcionado' })
      };
    }

    if (!producto_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Falta producto_id' })
      };
    }

    // 3) Validar el token (invocar la función Lambda que valida el token)
    const tokenResult = await lambda.invoke({
      FunctionName: process.env.VALIDAR_TOKEN_FUNCTION_NAME,  // Usamos la función Lambda para validar el token
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({ token })
    }).promise();

    const validation = JSON.parse(tokenResult.Payload);

    if (validation.statusCode !== 200) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Token inválido' })
      };
    }

    const { tenant_id: tokenTenantId, rol: userRol } = JSON.parse(validation.body);  // Obtener tenant_id y rol del token

    // 4) Verificar que el tenant_id del body coincida con el tenant_id del token
    if (requestTenantId !== tokenTenantId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'El tenant_id del token no coincide con el proporcionado en la solicitud' })
      };
    }

    // 5) Validar que el rol del usuario sea 'admin'
    if (userRol !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Solo los administradores pueden modificar productos' })
      };
    }

    // 6) Construir dinámicamente la expresión de actualización de DynamoDB
    const updateExprParts = [];
    const exprAttrVals = {};

    // Solo incluimos los campos que están presentes en producto_datos
    for (let key in producto_datos) {
      updateExprParts.push(`${key} = :${key}`);
      exprAttrVals[`:${key}`] = producto_datos[key];
    }

    if (updateExprParts.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No se proporcionaron datos para actualizar' })
      };
    }

    const updateExpr = 'set ' + updateExprParts.join(', ');

    // 7) Actualizar el producto en la base de datos
    const updateResult = await dynamodb.update({
      TableName: TABLE_NAME,
      Key: {
        tenant_id: tokenTenantId,  // Usar el tenant_id del token
        producto_id: producto_id
      },
      UpdateExpression: updateExpr,
      ExpressionAttributeValues: exprAttrVals,
      ReturnValues: 'UPDATED_NEW'
    }).promise();

    // 8) Responder éxito
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Producto modificado exitosamente',
        datosActualizados: updateResult.Attributes
      })
    };

  } catch (err) {
    console.error('ERROR en ModificarProducto:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Error interno del servidor' })
    };
  }
};
