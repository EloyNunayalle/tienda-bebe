import os
import base64
import mimetypes

def lambda_handler(event, context):
    # Determinar la ruta del archivo solicitado
    base_path = os.path.join(os.environ['LAMBDA_TASK_ROOT'], 'swagger-ui')
    
    # Obtener el proxy path
    proxy = event.get('pathParameters', {}).get('proxy', '')
    file_path = os.path.join(base_path, proxy) if proxy else os.path.join(base_path, 'index.html')
    
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
            'body': json.dumps({'error': 'File not found'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }