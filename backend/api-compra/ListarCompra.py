import boto3
import json
from boto3.dynamodb.conditions import Key
import os

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',  
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    }

    try:
        print("Evento recibido:", event)
        token = event['headers'].get('Authorization')

        if not token:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({ 'error': 'Token no proporcionado' })
            }

        # Validar el token
        lambda_client = boto3.client('lambda')
        payload = json.dumps({ "token": token })
        response = lambda_client.invoke(
            FunctionName=os.environ['VALIDAR_TOKEN_FUNCTION_NAME'],  
            InvocationType='RequestResponse',
            Payload=payload
        )
        validation = json.loads(response['Payload'].read())

        if validation['statusCode'] != 200:
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({ 'error': 'Token inválido' })
            }

        # Obtener tenant_id y user_id desde la validación del token
        user_data = json.loads(validation['body'])
        tenant_id = user_data['tenant_id']
        user_id = user_data['user_id']
        
        # Usar la tabla de compras desde las variables de entorno
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ['TABLE_COMPRAS'])  # Usamos la variable de entorno para la tabla

        # Realizar la consulta usando el GSI
        result = table.query(
            IndexName='idx_usuario',  
            KeyConditionExpression=Key('tenant_id').eq(tenant_id) & Key('user_id').eq(user_id)
        )

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'compras': result.get('Items', []),
                'cantidad': result.get('Count', 0)
            }, default=str)
        }

    except Exception as e:
        print("ERROR en ListarCompras:", str(e))
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({ 'error': str(e) })
        }
