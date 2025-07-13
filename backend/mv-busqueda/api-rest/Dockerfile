FROM python:3.11-slim

WORKDIR /app

COPY indexador-api.py .

RUN pip install fastapi uvicorn docker httpx

EXPOSE 8000

CMD ["uvicorn", "indexador-api:app", "--host", "0.0.0.0", "--port", "8000"]
