import hashlib
import hmac
import secrets
import sqlite3
import time
from contextlib import closing
from pathlib import Path


USERS_DB = Path(__file__).resolve().parent.parent / "data_lake" / "users.db"
ITERATIONS = 600_000
SESSION_DURATION_SECONDS = 8 * 60 * 60


def gerar_hash(valor):
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", valor.encode("utf-8"), salt, ITERATIONS)
    return f"pbkdf2_sha256${ITERATIONS}${salt.hex()}${digest.hex()}"


def verificar_hash(valor, hash_salvo):
    try:
        algoritmo, iteracoes, salt, digest = hash_salvo.split("$")
        if algoritmo != "pbkdf2_sha256":
            return False
        calculado = hashlib.pbkdf2_hmac(
            "sha256", valor.encode("utf-8"), bytes.fromhex(salt), int(iteracoes)
        )
        return hmac.compare_digest(calculado, bytes.fromhex(digest))
    except (ValueError, TypeError):
        return False

def hash_id(usuario_id):
    return hashlib.sha256(str(usuario_id).encode("utf-8")).hexdigest()


def inicializar_banco_users():
    USERS_DB.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(USERS_DB)) as banco, banco:
        banco.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id_hash TEXT PRIMARY KEY,
                senha_hash TEXT NOT NULL,
                nome TEXT
            )
        """)
        colunas = {coluna[1] for coluna in banco.execute("PRAGMA table_info(users)")}
        if "nome" not in colunas:
            banco.execute("ALTER TABLE users ADD COLUMN nome TEXT")
        if "nome_hash" in colunas:
            banco.execute("ALTER TABLE users DROP COLUMN nome_hash")
        banco.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                user_id_hash TEXT NOT NULL REFERENCES users(id_hash),
                expires_at INTEGER NOT NULL
            )
        """)


def cadastrar_usuario(usuario_id, nome, senha):
    with closing(sqlite3.connect(USERS_DB)) as banco, banco:
        banco.execute(
            "INSERT INTO users (id_hash, senha_hash, nome) VALUES (?, ?, ?)",
            (hash_id(usuario_id), gerar_hash(senha), nome.strip()),
        )


def atualizar_nome_usuario(usuario_id, nome):
    nome = nome.strip()
    if not nome:
        raise ValueError("Informe o nome do usuário.")
    with closing(sqlite3.connect(USERS_DB)) as banco, banco:
        resultado = banco.execute(
            "UPDATE users SET nome = ? WHERE id_hash = ?",
            (nome, hash_id(usuario_id)),
        )
    return resultado.rowcount > 0


def verificar_credenciais(usuario_id, senha):
    with closing(sqlite3.connect(USERS_DB)) as banco:
        registro = banco.execute(
            "SELECT senha_hash FROM users WHERE id_hash = ?", (hash_id(usuario_id),)
        ).fetchone()
    if registro is None:
        hashlib.pbkdf2_hmac("sha256", senha.encode("utf-8"), bytes(16), ITERATIONS)
        return False
    return verificar_hash(senha, registro[0])


def criar_sessao(usuario_id):
    token = secrets.token_urlsafe(32)
    agora = int(time.time())
    with closing(sqlite3.connect(USERS_DB)) as banco, banco:
        banco.execute("DELETE FROM sessions WHERE expires_at <= ?", (agora,))
        banco.execute(
            "INSERT INTO sessions (token_hash, user_id_hash, expires_at) VALUES (?, ?, ?)",
            (hash_id(token), hash_id(usuario_id), agora + SESSION_DURATION_SECONDS),
        )
    return token


def buscar_sessao(token):
    if not token or len(token) != 43:
        return None
    with closing(sqlite3.connect(USERS_DB)) as banco:
        registro = banco.execute(
            """
            SELECT sessions.user_id_hash, sessions.expires_at, users.nome
            FROM sessions JOIN users ON users.id_hash = sessions.user_id_hash
            WHERE sessions.token_hash = ? AND sessions.expires_at > ?
            """,
            (hash_id(token), int(time.time())),
        ).fetchone()
    if registro is None:
        return None
    return {"user_id_hash": registro[0], "expires_at": registro[1], "nome": registro[2]}


def revogar_sessao(token):
    if not token:
        return
    with closing(sqlite3.connect(USERS_DB)) as banco, banco:
        banco.execute("DELETE FROM sessions WHERE token_hash = ?", (hash_id(token),))
