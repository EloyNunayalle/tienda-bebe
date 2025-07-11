import boto3
import hashlib
import json
import os


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

        dynamodb = boto3.resource('dynamodb')

        nombre_tabla = os.environ["TABLE_NAME"]
        t_usuarios = dynamodb.Table(nombre_tabla)

        response = t_usuarios.get_item(Key={
            'tenant_id': tenant_id,
            'user_id': user_id
        })

        if 'Item' in response:
            return {
                'statusCode': 409,
                'headers': cors_headers,
                'body': json.dumps({
                    'error': 'El usuario ya existe en este tenant'
                })
            }

        hashed_password = hash_password(password)

        t_usuarios.put_item(Item={
            'tenant_id': tenant_id,
            'user_id': user_id,
            'password': hashed_password,
            'rol': 'cliente'
        })

        return {
            'statusCode': 201,
            'headers': cors_headers,
            'body': json.dumps({
                'message': 'Usuario registrado exitosamente',
                'tenant_id': tenant_id,
                'user_id': user_id
            })
        }

    except Exception as e:
        print("ERROR:", str(e))
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({ "error": str(e) })
        }
