import boto3
import json
import os

def lambda_handler(event, context):
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST'
    }

    try:
        body = json.loads(event['body'])

        tenant_id = body.get("tenant_id")
        user_id = body.get("user_id")

        if not tenant_id or not user_id:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Faltan tenant_id o user_id'})
            }

        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_USERS']
        table = dynamodb.Table(table_name)

        # Si tenant_id y user_id son la clave compuesta (PK+SK)
        response = table.get_item(
            Key={
                'tenant_id': tenant_id,
                'user_id': user_id
            }
        )

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Usuario no encontrado'})
            }

        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({'usuario': response['Item']})
        }

    except Exception as e:
        print("ERROR:", str(e))
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': str(e)})
        }
