const AWS   = require('aws-sdk');
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
    /* ---------- 1. Pre-flight CORS ---------- */
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Preflight OK' }) };
    }

    /* ---------- 2. Token ---------- */
    const rawAuth = event.headers.Authorization || event.headers.authorization || '';
    if (!rawAuth) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Token no proporcionado' }) };
    }
    const token = rawAuth;                       // sin “Bearer ”

    /* ---------- 3. Validar token ---------- */
    const tokenResult = await lambda.invoke({
      FunctionName   : process.env.VALIDAR_TOKEN_FUNCTION_NAME,
      InvocationType : 'RequestResponse',
      Payload        : JSON.stringify({ token })
    }).promise();

    const validation = JSON.parse(tokenResult.Payload);
    if (validation.statusCode !== 200) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Token inválido' }) };
    }

    /* ---------- 4. Datos del token ---------- */
    const { tenant_id: tokenTenantId, rol: userRol } = JSON.parse(validation.body);

    if (userRol !== 'admin') {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Solo los administradores pueden modificar productos' }) };
    }

    /* ---------- 5. Parsear body ---------- */
    let body;
    try { body = JSON.parse(event.body); }
    catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) }; }

    const { producto_id, producto_datos = {}, tenant_id: requestTenantId } = body;

    if (!producto_id)      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Falta producto_id' }) };
    if (!requestTenantId)  return { statusCode: 400, headers, body: JSON.stringify({ error: 'Falta tenant_id en la solicitud' }) };
    if (requestTenantId !== tokenTenantId) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'El tenant_id del token no coincide con el proporcionado en la solicitud' }) };
    }

    /* ---------- 6. Construir UpdateExpression ---------- */
    const exprNames = {};
    const exprVals  = {};
    const sets      = [];

    for (const key in producto_datos) {
      const alias = key === 'name' ? '#name' : key;      // alias para la palabra reservada “name”
      const valueKey = `:${key}`;
      sets.push(`${alias} = ${valueKey}`);
      exprVals[valueKey] = producto_datos[key];
      if (key === 'name') exprNames['#name'] = 'name';
    }

    if (sets.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No se proporcionaron datos para actualizar' }) };
    }

    /* ---------- 7. Update DynamoDB ---------- */
    const updateResult = await dynamodb.update({
      TableName : TABLE_NAME,
      Key       : { tenant_id: tokenTenantId, producto_id },
      UpdateExpression         : 'SET ' + sets.join(', '),
      ExpressionAttributeNames : Object.keys(exprNames).length ? exprNames : undefined,
      ExpressionAttributeValues: exprVals,
      ReturnValues             : 'UPDATED_NEW'
    }).promise();

    /* ---------- 8. Éxito ---------- */
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
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Error interno del servidor' }) };
  }
};
