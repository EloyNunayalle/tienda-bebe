const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_PRODUCTOS;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  try {
    // 1) Parsear el body JSON
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

    // 2) Extraer tenant_id y producto_id
    const { tenant_id: requestTenantId, producto_id } = body;

    // 3) Validación de datos
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

    // 4) Realizar la consulta en DynamoDB con el producto_id
    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: {
        tenant_id: requestTenantId,  // Usar tenant_id del request
        producto_id: producto_id  // Buscar por producto_id
      }
    }).promise();

    // 5) Verificar si el producto existe
    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Producto no encontrado' })
      };
    }

    // 6) Responder con el producto encontrado
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
