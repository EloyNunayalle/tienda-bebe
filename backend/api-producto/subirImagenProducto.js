const AWS = require('aws-sdk');
const Busboy = require('busboy');  // No se usa `new`, solo importamos la función

const s3 = new AWS.S3();
const lambda = new AWS.Lambda();

const BUCKET_NAME = process.env.BUCKET_PRODUCTOS_NAME;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  const rawAuth = event.headers.Authorization || event.headers.authorization || '';
  const token = rawAuth;

  if (!token) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Token no proporcionado' })
    };
  }

  // Validar token
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

  const { tenant_id: tokenTenantId, rol: userRol } = JSON.parse(validation.body);

  return new Promise((resolve) => {
    // CORRECCIÓN: Usar Busboy correctamente como función, sin `new`
    const busboy = Busboy({ headers: event.headers });

    let tenant_id = '';
    let producto_id = '';
    let name = '';
    let uploadBuffer = null;

    busboy.on('field', (fieldname, val) => {
      if (fieldname === 'tenant_id') tenant_id = val;
      if (fieldname === 'producto_id') producto_id = val;
      if (fieldname === 'name') name = val;
    });

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const chunks = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        uploadBuffer = Buffer.concat(chunks);  // Concatenamos los datos de la imagen
      });
    });

    busboy.on('finish', async () => {
      if (!tenant_id || !producto_id || !name || !uploadBuffer) {
        return resolve({
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Faltan campos requeridos o archivo' })
        });
      }

      // Validar que el tenant_id enviado coincida con el del token
      if (tenant_id !== tokenTenantId) {
        return resolve({
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'El tenant_id no coincide con el token' })
        });
      }

      // Validar rol admin
      if (userRol !== 'admin') {
        return resolve({
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Solo los administradores pueden subir imágenes' })
        });
      }

      const key = `${tenant_id}/${producto_id}/${name}.jpg`;  // Nombre del archivo en S3

      try {
        // Subir la imagen a S3
        await s3.putObject({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: uploadBuffer,
          ContentType: 'image/jpeg',
          ACL: 'public-read'  // Hacerla pública, si es necesario
        }).promise();

        const region = process.env.AWS_REGION || 'us-east-1';
        const imageUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;

        return resolve({
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Imagen subida correctamente', imageUrl })
        });
      } catch (err) {
        console.error('❌ Error al subir imagen:', err);
        return resolve({
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Error al subir la imagen' })
        });
      }
    });

    // Analizar el cuerpo de la solicitud
    const buffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
    busboy.end(buffer);  // Iniciar el proceso de análisis del archivo
  });
};
