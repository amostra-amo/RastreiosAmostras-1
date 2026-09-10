from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import urllib3
from requests.auth import HTTPBasicAuth

router = APIRouter()

urllib3.disable_warnings()

# ================= MODELO =================
class LoginRequest(BaseModel):
    username: str
    password: str

# ================= LOGIN =================
@router.post("/login")
def login(data: LoginRequest):
    try:
        # ================= 1. PROTHEUS =================
        url_protheus = "https://protheus.quatroktextil.com.br:6632/rest05/api/oauth2/v1/token"

        response = requests.post(
            url_protheus,
            data={
                "grant_type": "password",
                "username": data.username,
                "password": data.password
            },
            headers={
                "Content-Type": "application/x-www-form-urlencoded"
            },
            verify=False,
            timeout=10
        )

        # ---------- 🔹 ALTERAÇÃO AQUI: LOG detalhado ----------
        if response.status_code not in [200, 201]:
            print("LOGIN FALHOU - PROTHEUS STATUS:", response.status_code)
            print("LOGIN FALHOU - PROTHEUS RESPONSE:", response.text)
            raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")
        # -----------------------------------------------------

        dados = response.json()

        # ================= 2. VENDEDOR =================
        url_vendedor = "http://10.70.2.9:8080/rest/customvend/"

        response_vendedor = requests.get(
            url_vendedor,
            auth=HTTPBasicAuth(data.username, data.password),
            timeout=10
        )

        print("VENDEDOR STATUS:", response_vendedor.status_code)
        print("VENDEDOR RESPOSTA:", response_vendedor.text)

        if response_vendedor.status_code != 200:
            raise HTTPException(status_code=404, detail="Vendedor não encontrado")

        vendedor_data = response_vendedor.json()

        if "items" in vendedor_data:
            if len(vendedor_data["items"]) == 0:
                raise HTTPException(status_code=404, detail="Vendedor não encontrado")
            vendedor_data = vendedor_data["items"][0]

        seller_code = vendedor_data.get("codigo")
        seller_name = data.username  # ou remove se não precisar

        if not seller_code:
            raise HTTPException(status_code=404, detail="Vendedor não encontrado")

        return {
            "access_token": dados.get("access_token"),
            "seller_code": seller_code.strip(),
            "seller_name": seller_name.strip() if seller_name else data.username
        }

    except HTTPException as e:
        raise e

    except Exception as e:
        print("Erro inesperado no login:", e)
        raise HTTPException(status_code=500, detail="Erro no login")