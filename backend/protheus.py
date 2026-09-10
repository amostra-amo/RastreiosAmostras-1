from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import jwt
from datetime import datetime, timedelta

router = APIRouter()

SECRET_KEY = "SEU_SECRET"
ALGORITHM = "HS256"


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(data: LoginRequest):

    # ================= GERAR TOKEN =================
    payload = {
        "sub": data.username,
        "exp": datetime.utcnow() + timedelta(hours=8)
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    # ================= CHAMAR API CUSTOMVEND =================
    try:
        url = "http://10.70.2.9:8080/rest/customvend/"

        response = requests.get(
            url,
            auth=(data.username, data.password),  # 🔥 igual Postman (Basic Auth)
            timeout=10
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=401,
                detail="Usuário ou senha inválidos (API)"
            )

        vendedor_data = response.json()

        print("RETORNO CUSTOMVEND:", vendedor_data)

        # 🔥 CAMPO CORRETO DA SUA API
        seller_code = vendedor_data.get("codigo")

        if not seller_code:
            raise HTTPException(
                status_code=404,
                detail="Código de vendedor não encontrado"
            )

    except Exception as e:
        print("Erro ao consultar customvend:", str(e))
        raise HTTPException(
            status_code=500,
            detail="Erro na API de vendedores"
        )

    # ================= RETORNO FINAL =================
    return {
        "seller_code": seller_code.strip(),
        "seller_name": data.username,  # opcional
        "token": token
    }