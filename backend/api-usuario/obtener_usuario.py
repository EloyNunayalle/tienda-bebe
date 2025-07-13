import boto3
import json
import os

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST'
    }

    try:
        print("Evento recibido:", event)

        # 1. Validar Token
        token = event['headers'].get('Authorization')
        if not token:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({ 'error': 'Token no proporcionado' })
            }

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

        # 2. Extraer datos del token
        auth_data = json.loads(validation['body'])
        tenant_token = auth_data.get('tenant_id')
        user_token = auth_data.get('user_id')

        # 3. Extraer datos del body
        body = json.loads(event['body'])
        tenant_body = body.get("tenant_id")
        user_body = body.get("user_id")

        if not tenant_body or not user_body:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Faltan tenant_id o user_id'})
            }

        # 4. Validar coincidencia con token
        if tenant_body != tenant_token or user_body != user_token:
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({'error': 'No autorizado para consultar este usuario'})
            }

        # 5. Consultar DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ['TABLE_USERS'])

        response = table.get_item(
            Key={
                'tenant_id': tenant_body,
                'user_id': user_body
            }
        )

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Usuario no encontrado'})
            }

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({ 'usuario': response['Item'] })
        }

    except Exception as e:
        print("ERROR:", str(e))
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({ 'error': str(e) })
        }
