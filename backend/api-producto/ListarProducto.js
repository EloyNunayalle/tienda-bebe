const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_PRODUCTOS;      // p.ej. "t_productos"
// Si usas un GSI con tenant_id como PK, indícalo aquí:
// const INDEX_NAME = 'byTenantId';

exports.handler = async (event) => {
  /*─── Cabeceras CORS ──────────────────────────────────────*/
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  /*─── Respuesta inmediata a pre-flight OPTIONS ────────────*/
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    /*──── 1. Parsear body JSON ─────────────────────────────*/
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (_) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Invalid JSON body' })
      };
    }

    const {
      tenant_id: tenantId,
      limit = 5,
      start_key             // objeto o undefined
    } = body;

    if (!tenantId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'tenant_id is required' })
      };
    }

    /*──── 2. Construir parámetros de DynamoDB.Query ───────*/
    const params = {
      TableName: TABLE_NAME,
      // IndexName: INDEX_NAME,          // ← descomenta si usas un GSI
      KeyConditionExpression: 'tenant_id = :t',
      ExpressionAttributeValues: { ':t': tenantId },
      Limit: limit
    };

    if (start_key) params.ExclusiveStartKey = start_key;

    /*──── 3. Ejecutar Query ───────────────────────────────*/
    const { Items = [], LastEvaluatedKey } =
      await dynamodb.query(params).promise();

    /*──── 4. Responder con el mismo formato que antes ─────*/
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        productos: Items,
        lastEvaluatedKey: LastEvaluatedKey || null
      })
    };

  } catch (err) {
    console.error('❌ ERROR en ListarProducto:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
