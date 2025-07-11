const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 't_productos1';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*', // En producción cambia a tu dominio
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Preflight OK' })
      };
    }

    const { producto_id, producto_datos } = JSON.parse(event.body || '{}');
    const token = event.headers.Authorization || event.headers.authorization;

    if (!token) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Token no proporcionado' })
      };
    }

    if (!producto_id || !producto_datos || typeof producto_datos !== 'object') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Faltan datos obligatorios o formato incorrecto' })
      };
    }

    const tokenResult = await lambda.invoke({
      FunctionName: 'api-bebes-dev-validarUsuario',
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({ token })
    }).promise();

    console.log('🔍 tokenResult.Payload:', tokenResult.Payload);
    const validation = JSON.parse(tokenResult.Payload);

    if (!validation.body) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Respuesta inválida de ValidarTokenUsuario' })
      };
    }

    let data;
    try {
      data = JSON.parse(validation.body);
    } catch (e) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Respuesta de validación no es JSON válido' })
      };
    }

    if (validation.statusCode === 403 || data.rol !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'No autorizado: solo administradores pueden modificar productos' })
      };
    }

    const result = await dynamodb.scan({
      TableName: TABLE_NAME,
      FilterExpression: 'producto_id = :pid',
      ExpressionAttributeValues: { ':pid': producto_id }
    }).promise();

    const item = result.Items[0];
    if (!item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Producto no encontrado' })
      };
    }

    const updateExpr = 'set ' + Object.keys(producto_datos).map(k => `${k} = :${k}`).join(', ');
    const exprAttrVals = {};
    for (let k in producto_datos) {
      exprAttrVals[`:${k}`] = producto_datos[k];
    }

    const updateResult = await dynamodb.update({
      TableName: TABLE_NAME,
      Key: {
        tenant_id: item.tenant_id,
        producto_id: producto_id
      },
      UpdateExpression: updateExpr,
      ExpressionAttributeValues: exprAttrVals,
      ReturnValues: 'UPDATED_NEW'
    }).promise();

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
