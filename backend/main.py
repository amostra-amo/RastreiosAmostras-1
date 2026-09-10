from fastapi import FastAPI
from backend.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware

import json
import os
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

# ================= PERMISSÕES =================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARQUIVO_PERMISSOES = os.path.join(BASE_DIR, "permissoes.json")


@app.get("/permissoes")
def get_permissoes():
    try:
        if not os.path.exists(ARQUIVO_PERMISSOES):
            return {"usuarios": {}}

        with open(ARQUIVO_PERMISSOES, "r", encoding="utf-8") as f:
            return json.load(f)

    except Exception as e:
        print("Erro ao ler permissoes:", e)
        return {"usuarios": {}}


@app.post("/permissoes")
def salvar_permissoes(data: dict):
    try:
        # 🔥 adiciona versão automática
        data["versao"] = int(time.time())

        # 🔥 garante que a pasta existe
        os.makedirs(BASE_DIR, exist_ok=True)

        with open(ARQUIVO_PERMISSOES, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        return {"ok": True}

    except Exception as e:
        print("Erro ao salvar permissoes:", e)
        return {"ok": False}


# ================= EXCLUIR USUÁRIO =================

@app.delete("/permissoes/{usuario}")
def excluir_usuario(usuario: str):
    try:
        if not os.path.exists(ARQUIVO_PERMISSOES):
            return {"ok": False, "erro": "Arquivo não encontrado"}

        with open(ARQUIVO_PERMISSOES, "r", encoding="utf-8") as f:
            data = json.load(f)

        user = usuario.strip().lower()

        # 🔒 proteção opcional (evita apagar admin crítico)
        if user == "v.santos":
            return {"ok": False, "erro": "Usuário protegido"}

        if user in data.get("usuarios", {}):
            del data["usuarios"][user]

            # 🔥 atualiza versão também na exclusão
            data["versao"] = int(time.time())

            with open(ARQUIVO_PERMISSOES, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            return {"ok": True}

        return {"ok": False, "erro": "Usuário não existe"}

    except Exception as e:
        print("Erro ao excluir usuário:", e)
        return {"ok": False}