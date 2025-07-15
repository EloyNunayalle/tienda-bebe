import os
import base64
import mimetypes
import json
import boto3

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }

    # Verificación mínima de token
    token = event.get('headers', {}).get('Authorization', '')
    if not token.startswith('Bearer '):
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Token requerido'})
        }

    # Validar token
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

    # Servir archivos
    base_path = os.path.join(os.path.dirname(__file__), '../docs/swagger-ui')
    proxy = event.get('pathParameters', {}).get('proxy', '')
    file_path = os.path.join(base_path, proxy) if proxy else os.path.join(base_path, 'index.html')
    
    try:
        with open(file_path, 'rb') as file:
            return {
                'statusCode': 200,
                'headers': {
                    **headers,
                    'Content-Type': mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
                },
                'body': base64.b64encode(file.read()).decode('utf-8'),
                'isBase64Encoded': True
            }
    except FileNotFoundError:
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Archivo no encontrado'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }