import boto3
import json
import uuid
from datetime import datetime
from decimal import Decimal
import os

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }

    try:
        print("Evento recibido:", event)
        
        # Parsear el cuerpo de la solicitud
        body = json.loads(event['body'])
        
        # Obtener el token de autorización
        token = event['headers'].get('Authorization')

        # Verificar si el token está presente
        if not token:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({ 'error': 'Token no proporcionado' })
            }

        # Obtener el nombre de la función Lambda para la validación del token desde las variables de entorno
        lambda_client = boto3.client('lambda')
        payload = json.dumps({ "token": token })
        
        # Invocar la función Lambda para validar el token
        response = lambda_client.invoke(
            FunctionName=os.environ['VALIDAR_TOKEN_FUNCTION_NAME'],  # Usando la variable de entorno
            InvocationType='RequestResponse',
            Payload=payload
        )
        
        validation = json.loads(response['Payload'].read())

        # Si el token es inválido, devolver error
        if validation['statusCode'] != 200:
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({ 'error': 'Token inválido' })
            }

        # Obtener los datos del usuario desde la validación del token
        user_data = json.loads(validation['body'])
        tenant_id = user_data['tenant_id']
        user_id = user_data['user_id']

        # Procesar la lista de productos en el cuerpo
        productos = [
            {
                **p,
                "precio": Decimal(str(p["precio"])),
                "cantidad": Decimal(str(p.get("cantidad", 1)))
            }
            for p in body.get('productos', [])
        ]

        # Calcular el total de la compra
        total = sum(p["precio"] * p["cantidad"] for p in productos)

        # Crear el objeto de la compra
        compra = {
            'tenant_id': tenant_id,
            'compra_id': str(uuid.uuid4()),  # Generar un ID único para la compra
            'user_id': user_id,
            'productos': productos,
            'total': total,
            'fecha': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

        # Obtener el nombre de la tabla de compras desde las variables de entorno
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_COMPRAS']
        table = dynamodb.Table(table_name)
        
        # Insertar la compra en la tabla de DynamoDB
        table.put_item(Item=compra)

        # Devolver una respuesta exitosa
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({ 'message': 'Compra registrada', 'compra': compra }, default=str)
        }

    except Exception as e:
        # Manejo de errores
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({ 'error': str(e) })
        }
