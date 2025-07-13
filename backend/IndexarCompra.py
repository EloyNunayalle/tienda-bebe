import json
import urllib.request

def lambda_handler(event, context):
    for record in event['Records']:
        if record['eventName'] == 'INSERT':
            new_image = record['dynamodb']['NewImage']

            compra = {
                "compra_id": new_image['compra_id']['S'],
                "user_id": new_image['user_id']['S'],
                "producto_id": new_image['producto_id']['S'],
                "fecha": new_image.get('fecha', {}).get('S', ''),
                "cantidad": int(new_image['cantidad']['N']),
                "tenant_id": new_image['tenant_id']['S']
            }

            print(f"[IndexarCompra] Nueva compra recibida: {compra}")

            tenant_id = compra["tenant_id"]
            port = f"920{tenant_id[-1]}"
            url = f"http://52.90.186.135:{port}/compras/_doc/{compra['compra_id']}"

            try:
                data = json.dumps(compra).encode('utf-8')
                req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='PUT')
                with urllib.request.urlopen(req) as response:
                    print(f"[IndexarCompra] Indexado en {url}, status: {response.status}")
            except Exception as e:
                print(f"[IndexarCompra] Error al indexar: {e}")

    return {"statusCode": 200}