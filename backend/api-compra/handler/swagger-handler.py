import os
import base64
import mimetypes
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }
    
    # 1. Manejo de CORS pre-flight
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'Preflight OK'})
        }
    
    # 2. Determinar la ruta base de los archivos estáticos de Swagger UI
    base_path = os.path.join(os.environ.get('LAMBDA_TASK_ROOT', '.'), 'swagger-ui')
    
    # 3. Obtener la ruta del archivo solicitada (proxy)
    proxy = event.get('pathParameters', {}).get('proxy', '')
    
    # Limpiamos el proxy para prevenir 'path traversal'
    if '..' in proxy:
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({'error': 'Forbidden path access'})
        }
        
    file_path = os.path.join(base_path, proxy) if proxy else os.path.join(base_path, 'index.html')
    
    logger.info(f"Attempting to serve file: {file_path}")
    
    try:
        # 4. Leer el archivo en modo binario
        with open(file_path, 'rb') as file:
            content = file.read()
        
        # 5. Determinar el tipo MIME
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            mime_type = 'application/octet-stream'
        
        # 6. Codificar el contenido en Base64 para la respuesta de API Gateway
        encoded_content = base64.b64encode(content).decode('utf-8')
        
        # 7. Retornar la respuesta HTTP
        return {
            'statusCode': 200,
            'headers': {
                **headers,
                'Content-Type': mime_type
            },
            'body': encoded_content,
            'isBase64Encoded': True
        }
    
    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'File not found'})
        }
    except Exception as e:
        logger.error(f"Error serving file {file_path}: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }