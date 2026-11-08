
import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, SecretStr

from database import (
    inicializar_banco,
    buscar_leituras,
    buscar_leituras_refined,
    buscar_resumo
)

from mqtt_client import iniciar_mqtt
from controle_database import buscar_programacao, cancelar_programacao, inicializar_banco_controle, salvar_programacao
from users_database import (
    SESSION_DURATION_SECONDS,
    buscar_sessao,
    criar_sessao,
    inicializar_banco_users,
    revogar_sessao,
    verificar_credenciais,
)

from openai import OpenAIError, RateLimitError
from ia import gerar_recomendacoes

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    
    inicializar_banco(limpar_historico=True)
    inicializar_banco_users()
    inicializar_banco_controle()

    
    cliente = iniciar_mqtt()

    yield

    cliente.disconnect()
    cliente.loop_stop()


app = FastAPI(
    title="AgroSmart API",
    description="API de monitoramento agrícola",
    version="1.0.0",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"]
)


class LoginRequest(BaseModel):
    id: str = Field(min_length=1, max_length=100, pattern=r"^[0-9]+$")
    senha: SecretStr = Field(min_length=1, max_length=1024)


class ProgramacaoRequest(BaseModel):
    frequencia_diaria: int = Field(strict=True, ge=1, le=24)
    primeiro_horario: str = Field(pattern=r"^([01][0-9]|2[0-3]):[0-5][0-9]$")
    duracao_minutos: int = Field(strict=True, ge=1, le=60)


class AcionamentoRequest(BaseModel):
    duracao_minutos: int = Field(strict=True, ge=1, le=60)


@app.middleware("http")
async def desabilitar_cache_api(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


def exigir_sessao(request: Request):
    sessao = buscar_sessao(request.cookies.get("session_id"))
    if sessao is None:
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada. Faça login.")
    return sessao


@app.post("/api/login")
def login(dados: LoginRequest, request: Request, response: Response):
    response.headers["Cache-Control"] = "no-store"
    if not verificar_credenciais(dados.id, dados.senha.get_secret_value()):
        raise HTTPException(
            status_code=401,
            detail="ID ou senha incorretos.",
            headers={"Cache-Control": "no-store"},
        )

    token = criar_sessao(dados.id)
    revogar_sessao(request.cookies.get("session_id"))
    response.delete_cookie("user_id", path="/")
    response.set_cookie(
        key="session_id",
        value=token,
        httponly=True,
        secure=request.url.scheme == "https",
        samesite="lax",
        path="/",
        max_age=SESSION_DURATION_SECONDS,
    )
    return {"mensagem": "Login realizado com sucesso."}


@app.get("/api/session")
def verificar_sessao(sessao: dict = Depends(exigir_sessao)):
    return {
        "authenticated": True,
        "expires_at": sessao["expires_at"],
        "user": {"name": sessao["nome"]},
    }


@app.post("/api/logout", status_code=204)
def logout(request: Request, response: Response):
    revogar_sessao(request.cookies.get("session_id"))
    response.delete_cookie(
        "session_id", path="/", httponly=True,
        secure=request.url.scheme == "https", samesite="lax",
    )
    response.delete_cookie("user_id", path="/")


@app.get("/")
def inicio():
    return {
        "mensagem": "AgroSmart API funcionando!"
    }


@app.get("/api/leituras", dependencies=[Depends(exigir_sessao)])
def listar_leituras(
    limite: int = Query(100, ge=1, le=500)
):
    return buscar_leituras(limite)


@app.get("/api/leituras/refined", dependencies=[Depends(exigir_sessao)])
def listar_leituras_refined(limite: int = Query(100, ge=1, le=500)):
    return buscar_leituras_refined(limite)


@app.get("/api/resumo", dependencies=[Depends(exigir_sessao)])
def resumo():
    return buscar_resumo()


@app.get("/api/controle", dependencies=[Depends(exigir_sessao)])
def consultar_controle():
    return {"programacao": buscar_programacao(), "acionamento_disponivel": False}


@app.post("/api/controle/programacao")
def registrar_programacao(dados: ProgramacaoRequest, sessao: dict = Depends(exigir_sessao)):
    programacao = salvar_programacao(
        dados.frequencia_diaria, dados.primeiro_horario,
        dados.duracao_minutos, sessao["user_id_hash"],
    )
    return {
        "programacao": programacao,
        "mensagem": "Programação salva. A execução depende da conexão dos sprinklers.",
    }


@app.post("/api/controle/programacao/cancelar", dependencies=[Depends(exigir_sessao)])
def excluir_programacao():
    cancelar_programacao()
    return {"programacao": None, "mensagem": "Programação cancelada."}


@app.post("/api/controle/acionar", dependencies=[Depends(exigir_sessao)])
def acionar_sprinklers(dados: AcionamentoRequest):
    
    raise HTTPException(
        status_code=503,
        detail="Os sprinklers ainda não estão conectados ao sistema.",
    )


@app.post("/api/recomendacoes", dependencies=[Depends(exigir_sessao)])
def recomendacoes_ia():
    try:
        return gerar_recomendacoes()

    except RateLimitError as erro:
        logger.warning("Falha na geração por IA: tipo=%s status=%s codigo=%s",
                       type(erro).__name__, erro.status_code, erro.code)
        if erro.code == "credit_balance_exhausted":
            mensagem = "A conta da API de IA está sem créditos. Adicione créditos no faturamento da OpenAI para gerar sugestões."
        elif erro.code in {
            "insufficient_quota", "organization_spend_limit_exceeded",
            "project_spend_limit_exceeded", "organization_usage_limit_exceeded",
        }:
            mensagem = "A cota da API de IA foi esgotada. Verifique o saldo e os limites de uso da conta na OpenAI."
        else:
            mensagem = "Muitas solicitações ao serviço de IA. Aguarde alguns instantes e tente novamente."
        raise HTTPException(status_code=503, detail=mensagem) from erro

    except OpenAIError as erro:
        logger.warning("Falha na geração por IA: tipo=%s status=%s codigo=%s",
                       type(erro).__name__, getattr(erro, "status_code", None),
                       getattr(erro, "code", None))
        raise HTTPException(
            status_code=503,
            detail="Serviço de IA indisponível."
        )

    except KeyError:
        raise HTTPException(
            status_code=503,
            detail="Chave da API não configurada."
        )
