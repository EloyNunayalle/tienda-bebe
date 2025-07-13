import boto3
import os
import json
from datetime import datetime
from boto3.dynamodb.types import TypeDeserializer

deserializer = TypeDeserializer()
s3 = boto3.client('s3')

def dynamodb_item_to_dict(item):
    return {k: deserializer.deserialize(v) for k, v in item.items()}

def lambda_handler(event, context):
    bucket_name = os.environ['BUCKET_COMPRAS']

    for record in event.get('Records', []):
        if record['eventName'] == 'INSERT':
            new_image = record['dynamodb'].get('NewImage')
            if not new_image:
                continue

            compra = dynamodb_item_to_dict(new_image)
            tenant_id = compra.get('tenant_id', 'unknown')
            compra_id = compra.get('compra_id', 'sin_id')

            # Ruta: compras/tenant_id/compra_id.json
            key = f"compras/{tenant_id}/{compra_id}.json"

            s3.put_object(
                Bucket=bucket_name,
                Key=key,
                Body=json.dumps(compra, indent=2),
                ContentType='application/json'
            )

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Archivos guardados en S3'})
    }
