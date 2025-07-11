import boto3
import hashlib
import uuid
import json
import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def lambda_handler(event, context):
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST'
    }

    try:
        body = json.loads(event['body'])
        tenant_id = body['tenant_id']
        user_id = body['user_id']
        password = body['password']

        hashed_password = hash_password(password)
        dynamodb = boto3.resource('dynamodb')


        tabla_usuarios = os.environ["TABLE_USERS"]
        t_usuarios = dynamodb.Table(tabla_usuarios)

        response = t_usuarios.get_item(Key={
            'tenant_id': tenant_id,
            'user_id': user_id
        })

        if 'Item' not in response:
            return {
                'statusCode': 403,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Usuario no existe'})
            }

        hashed_password_bd = response['Item']['password']
        if hashed_password != hashed_password_bd:
            return {
                'statusCode': 403,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Contraseña incorrecta'})
            }

        lima_time = datetime.now(ZoneInfo("America/Lima"))
        fecha_hora_exp = lima_time + timedelta(hours=1)


        
        tabla_tokens = os.environ["TABLE_TOKENS"]
        t_tokens = dynamodb.Table(tabla_tokens)

        token = str(uuid.uuid4())
        t_tokens.put_item(Item={
            'token': token,
            'expires': fecha_hora_exp.strftime('%Y-%m-%d %H:%M:%S'),
            'tenant_id': tenant_id,
            'user_id': user_id
        })

        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'message': 'Login exitoso',
                'token': token,
                'expires': fecha_hora_exp.strftime('%Y-%m-%d %H:%M:%S'),
                'user_id': user_id,
                'tenant_id': tenant_id
            })
        }

    except Exception as e:
        print("ERROR:", str(e))
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': str(e)})
        }
