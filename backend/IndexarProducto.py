import json
import urllib.request

def lambda_handler(event, context):
    for record in event['Records']:
        if record['eventName'] == 'INSERT':
            new_image = record['dynamodb']['NewImage']

            producto = {
                "producto_id": new_image['producto_id']['S'],
                "nombre": new_image['nombre']['S'],
                "precio": float(new_image['precio']['N']),
                "descripcion": new_image.get('descripcion', {}).get('S', ''),
                "tenant_id": new_image['tenant_id']['S']
            }

            print(f"[IndexarProducto] Nuevo producto recibido: {producto}")

            tenant_id = producto["tenant_id"]
            port = f"920{tenant_id[-1]}"
            url = f"http://52.90.186.135:{port}/productos/_doc/{producto['producto_id']}"

            try:
                data = json.dumps(producto).encode('utf-8')
                req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='PUT')
                with urllib.request.urlopen(req) as response:
                    print(f"[IndexarProducto] Indexado en {url}, status: {response.status}")
            except Exception as e:
                print(f"[IndexarProducto] Error al indexar: {e}")

    return {"statusCode": 200}