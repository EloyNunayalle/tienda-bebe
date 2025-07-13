import os
import base64
import mimetypes

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }

def lambda_handler(event, context):
    # Determinar la ruta base donde están los archivos estáticos
    base_path = os.path.join(os.path.dirname(__file__), '../docs/swagger-ui')
    
    # Obtener el proxy path (la parte de la ruta después de /swagger/)
    proxy = event.get('pathParameters', {}).get('proxy', '')
    
    # Si no hay proxy, servimos index.html
    if not proxy:
        file_path = os.path.join(base_path, 'index.html')
    else:
        file_path = os.path.join(base_path, proxy)
    
    try:
        # Leer el archivo
        with open(file_path, 'rb') as file:
            content = file.read()
        
        # Determinar el tipo MIME
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            mime_type = 'application/octet-stream'
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': mime_type,
                'Access-Control-Allow-Origin': '*'
            },
            'body': base64.b64encode(content).decode('utf-8'),
            'isBase64Encoded': True
        }
    
    except FileNotFoundError:
        return {
            'statusCode': 404,
            'body': 'File not found'
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': f'Internal server error: {str(e)}'
        }