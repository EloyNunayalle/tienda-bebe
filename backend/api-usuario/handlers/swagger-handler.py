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
    processed_items = 0

    for record in event.get('Records', []):
        if record['eventName'] == 'INSERT':
            try:
                new_image = record['dynamodb'].get('NewImage')
                if not new_image:
                    continue

                compra = dynamodb_item_to_dict(new_image)
                tenant_id = compra.get('tenant_id', 'unknown')
                compra_id = compra.get('compra_id', str(datetime.now().timestamp()))

                date_prefix = datetime.now().strftime('%Y/%m/%d')
                key = f"compras/{tenant_id}/{date_prefix}/{compra_id}.json"

                s3.put_object(
                    Bucket=bucket_name,
                    Key=key,
                    Body=json.dumps(compra, indent=2, default=str),
                    ContentType='application/json'
                )
                processed_items += 1

            except Exception as e:
                print(f"Error procesando registro: {str(e)}")
                continue

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': f'{processed_items} compras procesadas',
            'bucket': bucket_name
        })
    }