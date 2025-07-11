// api-producto/CrearProducto.js

// Requiere aws-sdk v2 (instálalo con `npm install aws-sdk`)
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

// Nombre de la tabla, definido en serverless.yml como TABLE_PRODUCTOS
const TABLE_NAME = process.env.TABLE_PRODUCTOS;

exports.handler = async (event) => {
  console.log('🚀 Event recibido:', JSON.stringify(event));

  // 1) Obtener cabeceras (mayúsculas/minúsculas)
  const headers = event.headers || {};
  const rawAuth = headers.Authorization || headers.authorization || '';
  console.log('🔑 raw Authorization header:', rawAuth);

  // 2) Extraer token del formato "Bearer <token>"
  let token = rawAuth;
  if (rawAuth.toLowerCase().startsWith('bearer ')) {
    token = rawAuth.slice(7);
  }
  console.log('🔒 Token extraído:', token);

  // 3) Si no hay token, rechazamos
  if (!token) {
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Unauthorized: faltó token' }),
    };
  }

  // 4) Parsear body JSON
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    console.error('❌ Error parseando body:', err);
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Invalid JSON body' }),
    };
  }

  // 5) Extraer campos del payload
  const {
    tenant_id,
    producto_id,
    name,
    description,
    price,
    category_id,
    age,
    gender,
    type,
    availability,
    imageUrl,
  } = body;

  // 6) Validaciones mínimas
  if (!tenant_id || !producto_id || !name || price == null) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Missing required fields' }),
    };
  }

  try {
    // Aquí podrías invocar tu lambda ValidarTokenUsuario o cualquier lógica de autorización:
    // await validarToken(token);

    // 7) Insertar en DynamoDB
    const item = {
      tenant_id,
      producto_id,
      name,
      description,
      price,
      category_id,
      age,
      gender,
      type,
      availability,
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    await ddb
      .put({
        TableName: TABLE_NAME,
        Item: item,
      })
      .promise();

    // 8) Responder éxito
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        message: 'Producto creado exitosamente',
        producto_id,
      }),
    };
  } catch (err) {
    console.error('❌ Error en CreateProducto:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: err.message || 'Internal Server Error' }),
    };
  }
};
