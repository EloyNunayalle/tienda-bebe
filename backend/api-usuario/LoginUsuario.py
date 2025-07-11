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
        email = body['email']  # Usamos el correo electrónico
        password = body['password']

        dynamodb = boto3.resource('dynamodb')

        # Obtener la tabla de usuarios desde el environment
        tabla_usuarios = os.environ["TABLE_USERS"]
        t_usuarios = dynamodb.Table(tabla_usuarios)

        # Usar el GSI para buscar por tenant_id y email
        response = t_usuarios.query(
            IndexName="EmailTenantIndex",  # Nombre del GSI
            KeyConditionExpression="tenant_id = :tenant_id and email = :email",
            ExpressionAttributeValues={
                ":tenant_id": tenant_id,
                ":email": email
            }
        )

        # Verificar si el correo electrónico existe dentro del tenant_id
        items = response.get('Items', [])
        if not items:
            return {
                'statusCode': 403,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Usuario no existe o correo incorrecto'})
            }

        # Buscar el usuario correspondiente
        user = items[0]  # Tomamos el primer elemento ya que tenant_id y email son únicos

        # Verificar que la contraseña coincida
        hashed_password_bd = user['password']
        if hash_password(password) != hashed_password_bd:
            return {
                'statusCode': 403,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Contraseña incorrecta'})
            }

        # Recuperar el rol y otros datos del usuario
        rol = user.get('rol', 'cliente') 

        # Generar un token de sesión
        lima_time = datetime.now(ZoneInfo("America/Lima"))
        fecha_hora_exp = lima_time + timedelta(hours=1)

        # Tabla de tokens
        tabla_tokens = os.environ["TABLE_TOKENS"]
        t_tokens = dynamodb.Table(tabla_tokens)

        # Generación de token
        token = str(uuid.uuid4())
        t_tokens.put_item(Item={
            'token': token,
            'expires': fecha_hora_exp.strftime('%Y-%m-%d %H:%M:%S'),
            'tenant_id': tenant_id,
            'user_id': user['user_id']  # Recuperamos el `user_id` desde el usuario encontrado
        })

        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'message': 'Login exitoso',
                'token': token,
                'expires': fecha_hora_exp.strftime('%Y-%m-%d %H:%M:%S'),
                'user_id': user['user_id'],  # Incluimos el `user_id`
                'tenant_id': tenant_id,
                'rol': rol  # devolvemos el rol
            })
        }

    except Exception as e:
        print("ERROR:", str(e))
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': str(e)})
        }
