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
    // Obtener el token desde el header
    const rawAuth = event.headers.Authorization || event.headers.authorization || '';
    console.log('🔑 raw Authorization header:', rawAuth);

    let token = rawAuth; // Usamos el token directamente sin el prefijo 'Bearer'

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
    console.log("Token validation response:", validation);

    // Verificar si la validación del token devolvió un error
    if (validation.statusCode !== 200) {
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

    const { tenant_id: requestTenantId, producto_id } = body;

    // Validación de datos
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

    // Verificar que el tenant_id del token coincida con el tenant_id de la solicitud
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
      Key: {
        tenant_id: requestTenantId,  // Usar tenant_id del request
        producto_id: producto_id  // Buscar por producto_id
      }
    };

    // Realizar la consulta
    const result = await dynamodb.get(params).promise();

    // Verificar si el producto existe
    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Producto no encontrado' })
      };
    }

    // Si el atributo 'name' está siendo actualizado, usar un alias para evitar conflicto con la palabra reservada
    const updateExprParts = [];
    const exprAttrVals = {};
    const exprAttrNames = {};  // Usamos un objeto para mapear los nombres de atributos reservados

    // Solo incluimos los campos que están presentes en producto_datos
    for (let key in body.producto_datos) {
      // Usar alias si el atributo es 'name' (reservado)
      if (key === 'name') {
        exprAttrNames['#name'] = key;
        updateExprParts.push(`#name = :name`);
      } else {
        updateExprParts.push(`${key} = :${key}`);
        exprAttrVals[`:${key}`] = body.producto_datos[key];
      }
    }

    // Si no hay campos para actualizar, retornamos error
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
      ExpressionAttributeNames: exprAttrNames,  // Pasar los nombres de atributos
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
