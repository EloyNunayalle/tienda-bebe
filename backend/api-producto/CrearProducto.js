const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

const TABLE_NAME = process.env.TABLE_PRODUCTOS;
const BUCKET_PRODUCTOS_URL = process.env.BUCKET_PRODUCTOS_URL;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  try {
    const rawAuth = event.headers.Authorization || event.headers.authorization || '';
    const token = rawAuth;

    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token no proporcionado' })
      };
    }

    const tokenResult = await lambda.invoke({
      FunctionName: process.env.VALIDAR_TOKEN_FUNCTION_NAME,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({ token })
    }).promise();

    const validation = JSON.parse(tokenResult.Payload);
    if (validation.statusCode !== 200) {
      return {
        statusCode: validation.statusCode,
        headers,
        body: JSON.stringify({ error: 'Token inválido' })
      };
    }

    const { tenant_id: tokenTenantId, rol: userRol, user_id: userId } = JSON.parse(validation.body);

    let body;
    try {
      body = JSON.parse(event.body);
    } catch (err) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Invalid JSON body' })
      };
    }

    const {
      producto_id,
      name,
      description,
      price,
      category_id,
      age,
      gender,
      type,
      availability,
      imageUrl
    } = body;

    if (!name || price == null) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Missing required fields' })
      };
    }

    if (body.tenant_id !== tokenTenantId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'El tenant_id del token no coincide con el proporcionado en la solicitud' })
      };
    }

    if (userRol !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Solo los administradores pueden crear productos' })
      };
    }

    // Generar producto_id si no se envía
    const finalProductoId = producto_id || `prod-${uuid.v4()}`;

    // Generar imageUrl si no se envía
    const finalImageUrl = imageUrl || `${BUCKET_PRODUCTOS_URL}/${tokenTenantId}/${finalProductoId}/${name}.jpg`;

    const item = {
      tenant_id: tokenTenantId,
      producto_id: finalProductoId,
      name,
      description,
      price,
      category_id,
      age,
      gender,
      type,
      availability,
      imageUrl: finalImageUrl,
      createdAt: new Date().toISOString(),
      user_id: userId
    };

    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: item
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Producto creado exitosamente',
        producto_id: finalProductoId,
        imageUrl: finalImageUrl
      })
    };

  } catch (err) {
    console.error('❌ Error en CreateProducto:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: err.message || 'Internal Server Error' })
    };
  }
};
