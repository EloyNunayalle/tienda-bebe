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
        email = body['email']  # El correo electrónico sigue siendo necesario
        password = body['password']

        # Generar un `user_id` único con UUID
        user_id = str(uuid.uuid4())  

        # Asignar rol de 'admin' si el correo contiene el tenant_id, o 'cliente' si no
        rol = 'admin' if tenant_id in email else 'cliente'

        dynamodb = boto3.resource('dynamodb')

        # Definir la tabla de usuarios
        nombre_tabla = os.environ["TABLE_USERS"]
        t_usuarios = dynamodb.Table(nombre_tabla)

        # Usar query con GSI para buscar por tenant_id y email
        response = t_usuarios.query(
            IndexName="EmailTenantIndex",  # Nombre del GSI
            KeyConditionExpression="tenant_id = :tenant_id and email = :email",
            ExpressionAttributeValues={
                ":tenant_id": tenant_id,
                ":email": email
            }
        )

        # Verificar si el correo electrónico ya está registrado dentro del tenant_id
        items = response.get('Items', [])
        if items:
            return {
                'statusCode': 409,  # Código HTTP para conflicto (correo ya registrado en este tenant)
                'headers': cors_headers,
                'body': json.dumps({'error': 'El correo electrónico ya está registrado en este tenant'})
            }

        # Hashear la contraseña
        hashed_password = hash_password(password)

        # Crear el nuevo usuario en la base de datos, incluyendo los datos dinámicos
        user_data = {
            'tenant_id': tenant_id,
            'user_id': user_id,
            'email': email,  # Guardamos el correo como campo
            'password': hashed_password,
            'rol': rol
        }

        # Agregar cualquier dato adicional proporcionado en el cuerpo de la solicitud
        for key, value in body.items():
            if key not in user_data:  # Asegurarse de no sobreescribir los campos existentes
                user_data[key] = value

        # Guardar el nuevo usuario en DynamoDB
        t_usuarios.put_item(Item=user_data)

        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'message': 'Usuario registrado exitosamente',
                'user_id': user_id,
                'tenant_id': tenant_id,
                'rol': rol
            })
        }

    except Exception as e:
        print("ERROR:", str(e))
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({"error": str(e)})
        }
