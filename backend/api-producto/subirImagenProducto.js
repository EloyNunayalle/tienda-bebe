const AWS = require('aws-sdk');
const Busboy = require('busboy');

const s3 = new AWS.S3();
const lambda = new AWS.Lambda();

const BUCKET_NAME = process.env.BUCKET_PRODUCTOS_NAME;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  console.log("🔵 Event recibido:");
  console.log(JSON.stringify(event, null, 2));

  if (event.httpMethod === 'OPTIONS') {
    console.log("🟡 Preflight OPTIONS recibido");
    return { statusCode: 200, headers };
  }

  const rawAuth = event.headers.Authorization || event.headers.authorization || '';
  const token = rawAuth;

  if (!token) {
    console.warn("❌ Token no proporcionado");
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Token no proporcionado' })
    };
  }

  console.log("🔵 Token recibido:", token);

  // Validar token
  let validation;
  try {
    const tokenResult = await lambda.invoke({
      FunctionName: process.env.VALIDAR_TOKEN_FUNCTION_NAME,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({ token })
    }).promise();

    validation = JSON.parse(tokenResult.Payload);
  } catch (e) {
    console.error("❌ Error al invocar función de validación:", e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error al validar token' })
    };
  }

  if (validation.statusCode !== 200) {
    console.warn("❌ Token inválido:", validation.body);
    return {
      statusCode: validation.statusCode,
      headers,
      body: JSON.stringify({ error: 'Token inválido' })
    };
  }

  const { tenant_id: tokenTenantId, rol: userRol } = JSON.parse(validation.body);
  console.log("✅ Token validado. Tenant:", tokenTenantId, "Rol:", userRol);

  return new Promise((resolve) => {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    if (!contentType) {
      console.error("❌ Content-Type faltante");
      return resolve({
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing Content-Type' })
      });
    }

    const busboy = Busboy({ headers: { 'content-type': contentType } });

    let tenant_id = '';
    let producto_id = '';
    let name = '';
    let uploadBuffer = null;
    let mimetype = '';
    let fileUploadFinished = false;

    busboy.on('field', (fieldname, val) => {
      console.log(`🟡 Campo recibido: ${fieldname} = ${val}`);
      if (fieldname === 'tenant_id') tenant_id = val;
      if (fieldname === 'producto_id') producto_id = val;
      if (fieldname === 'name') name = val;
    });

    busboy.on('file', (fieldname, file, fileInfo) => {
      const { filename, mimeType } = fileInfo || {};
      mimetype = mimeType || '';
      console.log(`📦 Archivo recibido: field=${fieldname}, filename=${filename}, mimetype=${mimetype}`);

      const chunks = [];

      file.on('data', (data) => {
        console.log(`🔹 Chunk recibido: ${data.length} bytes`);
        chunks.push(data);
      });

      file.on('end', () => {
        uploadBuffer = Buffer.concat(chunks);
        fileUploadFinished = true;
        console.log(`✅ Archivo completado. Total bytes: ${uploadBuffer.length}`);
        console.log(`📸 Primeros bytes: ${uploadBuffer.toString('hex', 0, 20)}...`);
      });
    });

    busboy.on('finish', async () => {
      console.log("🟢 Busboy terminó. Procesando...");

      if (!fileUploadFinished || !uploadBuffer) {
        console.error("❌ El archivo no se procesó correctamente.");
        return resolve({
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Archivo incompleto o no proporcionado' })
        });
      }

      if (!tenant_id || !producto_id || !name) {
        console.warn("❌ Faltan campos requeridos");
        return resolve({
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Faltan campos requeridos' })
        });
      }

      if (tenant_id !== tokenTenantId) {
        console.warn("❌ Tenant ID no coincide");
        return resolve({
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'El tenant_id no coincide con el token' })
        });
      }

      if (userRol !== 'admin') {
        console.warn("❌ Usuario no autorizado para subir imágenes");
        return resolve({
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Solo los administradores pueden subir imágenes' })
        });
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(mimetype)) {
        console.warn(`❌ Tipo de archivo no permitido: ${mimetype}`);
        return resolve({
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Formato de imagen no permitido. Usa JPG o PNG.' })
        });
      }

      const ext = mimetype === 'image/png' ? 'png' : 'jpg';
      const key = `${tenant_id}/${producto_id}/${name}.${ext}`;
      console.log(`📝 Guardando imagen en S3 con key: ${key}`);

      try {
        await s3.putObject({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: uploadBuffer,
          ContentType: mimetype,
          ACL: 'public-read'
        }).promise();

        const region = process.env.AWS_REGION || 'us-east-1';
        const imageUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
        console.log("✅ Imagen subida con éxito:", imageUrl);

        return resolve({
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Imagen subida correctamente', imageUrl })
        });
      } catch (err) {
        console.error("❌ Error al subir imagen a S3:", err);
        return resolve({
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Error al subir la imagen' })
        });
      }
    });

    try {
      const buffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
      console.log("🔵 Body decodificado correctamente. Bytes:", buffer.length);
      console.log("🔵 Primera parte del body:", buffer.toString('hex', 0, 50), '...');
      busboy.end(buffer);
    } catch (e) {
      console.error("❌ Error al decodificar el body:", e);
      return resolve({
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Error al procesar body base64' })
      });
    }
  });
};
