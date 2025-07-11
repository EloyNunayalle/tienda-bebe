import boto3
import json
from datetime import datetime
from zoneinfo import ZoneInfo
import os

def lambda_handler(event, context):
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST'
    }

    try:
        print(json.dumps({
            "tipo": "INFO",
            "log_datos": {
                "evento_recibido": event
            }
        }))

        print(event.get('token'))
       
        
        token = event.get('token')
        print(not token)


        if not token:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Token no proporcionado'})
            }

        dynamodb = boto3.resource('dynamodb')

        nombre_tabla = os.environ["TABLE_TOKENS"]
        t_tokens = dynamodb.Table(nombre_tabla)

        # Buscar el token en la tabla
        response = t_tokens.get_item(Key={'token': token})
        if 'Item' not in response:
            return {
                'statusCode': 403,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Token inválido o no encontrado'})
            }

        item = response['Item']
        expires_str = item['expires']
        expires_dt = datetime.strptime(expires_str, '%Y-%m-%d %H:%M:%S')
        now = datetime.now(ZoneInfo("America/Lima"))

        if now > expires_dt:
            return {
                'statusCode': 403,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Token expirado'})
            }

        # Obtener el rol desde el item del token
        rol = item.get('rol', 'cliente')  # Asignamos 'cliente' por defecto si no está definido

        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'message': 'Token válido',
                'tenant_id': item['tenant_id'],
                'user_id': item['user_id'],
                'rol': rol,  # Incluimos el rol en la respuesta
                'expires': item['expires']
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': str(e)})
        }
