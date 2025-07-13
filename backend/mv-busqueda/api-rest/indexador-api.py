# indexador-api.py
from fastapi import FastAPI, Request
import docker
import httpx
import uvicorn
import os
import time

app = FastAPI()
client = docker.from_env()

ES_IMAGE = "docker.elastic.co/elasticsearch/elasticsearch:8.12.0"
BASE_PORT = 9200
USED_PORTS = {}  

def ensure_es_container(tenant_id):
    nombre_contenedor = f"es_{tenant_id}"
    puerto = BASE_PORT + len(USED_PORTS) + 1

    if nombre_contenedor in [c.name for c in client.containers.list(all=True)]:
        if tenant_id not in USED_PORTS:
            USED_PORTS[tenant_id] = puerto
        return USED_PORTS[tenant_id]

    container = client.containers.run(
        ES_IMAGE,
        name=nombre_contenedor,
        environment=["discovery.type=single-node", "xpack.security.enabled=false"],
        ports={"9200/tcp": puerto},
        volumes={f"esdata_{tenant_id}": {"bind": "/usr/share/elasticsearch/data", "mode": "rw"}},
        detach=True
    )

    print(f"Contenedor creado para {tenant_id} en puerto {puerto}")
    USED_PORTS[tenant_id] = puerto

    time.sleep(10)
    return puerto

@app.post("/indexar")
async def indexar(request: Request):
    data = await request.json()
    tenant_id = data.get("tenant_id")
    producto_id = data.get("producto_id")
    evento = data.get("evento")
    producto = data.get("producto")

    if not tenant_id:
        return {"error": "Falta tenant_id"}

    puerto = ensure_es_container(tenant_id)
    es_url = f"http://localhost:{puerto}/productos/_doc/{producto_id}"

    async with httpx.AsyncClient() as client_http:
        if evento in ("INSERT", "MODIFY"):
            res = await client_http.put(es_url, json=producto)
        elif evento == "REMOVE":
            res = await client_http.delete(es_url)

    return {"status": res.status_code, "message": f"{evento} procesado para {tenant_id}"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
