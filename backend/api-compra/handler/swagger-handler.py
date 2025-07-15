import os
import base64
import mimetypes
import json
import logging
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }

    # 1. Manejar preflight OPTIONS
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'Preflight OK'})
        }

    # 2. Servir Swagger UI sin verificación de token
    path = event.get('path', '')
    if '/docs/swagger' in path:
        try:
            base_path = os.path.join(os.path.dirname(__file__), '../docs/swagger-ui')
            proxy = event.get('pathParameters', {}).get('proxy', '')
            
            if '..' in proxy:
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Path traversal no permitido'})
                }

            file_path = os.path.join(base_path, proxy) if proxy else os.path.join(base_path, 'index.html')

            with open(file_path, 'rb') as file:
                content = file.read()
            
            mime_type, _ = mimetypes.guess_type(file_path)
            content_type = mime_type if mime_type else 'application/octet-stream'

            return {
                'statusCode': 200,
                'headers': {
                    **headers,
                    'Content-Type': content_type
                },
                'body': base64.b64encode(content).decode('utf-8'),
                'isBase64Encoded': True
            }

        except FileNotFoundError:
            logger.error(f"Archivo no encontrado: {file_path}")
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Archivo no encontrado'})
            }
        except Exception as e:
            logger.error(f"Error interno: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': 'Error interno del servidor'})
            }

    # 3. Para otras rutas: Verificación de token
    token = event.get('headers', {}).get('Authorization') or event.get('headers', {}).get('authorization', '')
    if not token or not token.startswith('Bearer '):
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Token no proporcionado'})
        }

    try:
        lambda_client = boto3.client('lambda')
        response = lambda_client.invoke(
            FunctionName=os.environ['VALIDAR_TOKEN_FUNCTION_NAME'],
            InvocationType='RequestResponse',
            Payload=json.dumps({"token": token.split(' ')[1]})
        )
        validation = json.loads(response['Payload'].read())

        if validation['statusCode'] != 200:
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({'error': 'Token inválido'})
            }

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'Acceso autorizado'})
        }

    except Exception as e:
        logger.error(f"Error al validar token: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Error al validar token'})
        }