const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const dynamodb = new AWS.DynamoDB.DocumentClient();  // Definir correctamente el DocumentClient
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

    let token = rawAuth; // El token ahora es el valor directamente del header sin cambios

    // 2) Si no hay token, rechazamos
    if (!token) {
      return {
        statusCode: 401,
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

    console.log(JSON.stringify({ token }))
    console.log(process.env.VALIDAR_TOKEN_FUNCTION_NAME)

    const validation = JSON.parse(tokenResult.Payload);
    console.log("Token validation response:", validation); 

    // Verificar si la validación del token devolvió un error
    if (validation.statusCode !== 200) {
      return {
        statusCode: validation.statusCode,
        headers,
        body: JSON.stringify({ error: 'Token inválido' })
      };
    }

    const { tenant_id: tokenTenantId, rol: userRol, user_id: userId } = JSON.parse(validation.body);  // Obtener tenant_id, rol y user_id del token

    // 4) Parsear el body JSON
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

    // 5) Extraer campos del payload
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

    // 6) Validaciones mínimas
    if (!producto_id || !name || price == null) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Missing required fields' })
      };
    }

    // 7) Validar que el tenant_id coincida con el del token
    if (body.tenant_id !== tokenTenantId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'El tenant_id del token no coincide con el proporcionado en la solicitud' })
      };
    }

    // 8) Validar que el rol sea 'admin'
    if (userRol !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Solo los administradores pueden crear productos' })
      };
    }

    // 9) Si el producto_id no está en el cuerpo, generar uno automáticamente
    const generatedProductoId = producto_id || `prod-${uuid.v4()}`;  // Si no se proporciona producto_id, generamos uno

    // 10) Insertar el producto en DynamoDB con user_id (ya que es un campo adicional)
    const item = {
      tenant_id: tokenTenantId,
      producto_id: generatedProductoId,
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
      user_id: userId  // Guardamos el user_id del usuario que crea el producto
    };

    // Asegurarse de usar la variable `dynamodb` correctamente (definida como DocumentClient)
    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: item,
    }).promise();

    // 11) Responder éxito
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Producto creado exitosamente',
        producto_id: generatedProductoId,
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
