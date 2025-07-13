import os
import json
import urllib3

http = urllib3.PoolManager()

API_INDEXADOR = os.environ.get('API_INDEXADOR_URL', 'http://34.205.2.254:8000/indexar')

def lambda_handler(event, context):
    for record in event.get('Records', []):
        if record.get('eventName') not in ('INSERT', 'MODIFY', 'REMOVE'):
            continue

        tipo_evento = record['eventName']
        new_image = record.get('dynamodb', {}).get('NewImage', {})
        old_image = record.get('dynamodb', {}).get('OldImage', {})

        tenant_id = new_image.get('tenant_id', {}).get('S') or old_image.get('tenant_id', {}).get('S')
        producto_id = new_image.get('producto_id', {}).get('S') or old_image.get('producto_id', {}).get('S')

        payload = {
            "tenant_id": tenant_id,
            "producto_id": producto_id,
            "evento": tipo_evento,
            "producto": { key: val.get('S', val.get('N')) for key, val in new_image.items() }
        }

        try:
            response = http.request(
                "POST",
                API_INDEXADOR,
                body=json.dumps(payload),
                headers={"Content-Type": "application/json"}
            )
            print(f"Evento {tipo_evento} enviado a API - tenant {tenant_id} - status {response.status}")
        except Exception as e:
            print(f"Error enviando evento a indexador: {str(e)}")

    return {"statusCode": 200}
