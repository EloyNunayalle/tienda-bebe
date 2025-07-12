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

    const { tenant_id: requestTenantId, limit = 5, start_key } = body;

    // Parámetros de la consulta de DynamoDB
    const params = {
      TableName: TABLE_NAME,
      Limit: limit,
      FilterExpression: "tenant_id = :tenant_id", // Filtro para asegurar que solo se devuelvan productos del tenant correspondiente
      ExpressionAttributeValues: {
        ":tenant_id": requestTenantId
      }
    };

    if (start_key) {
      params.ExclusiveStartKey = start_key;  // Para manejar la paginación
    }

    // Realizar la consulta
    const response = await dynamodb.scan(params).promise();

    // Responder con los productos y el lastEvaluatedKey para la paginación
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        productos: response.Items,
        lastEvaluatedKey: response.LastEvaluatedKey || null  // Para manejar la paginación
      })
    };

  } catch (err) {
    console.error('ERROR en ListarProducto:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
