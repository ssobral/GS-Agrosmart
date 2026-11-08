
import json
import math
import sqlite3
from contextlib import closing

from pathlib import Path
from datetime import datetime, timezone

BASE = Path(__file__).resolve().parent.parent / "data_lake"
RAW = BASE / "raw"
TRUSTED = BASE / "trusted"
REFINED = BASE / "refined"

DB = TRUSTED / "agrosmart.db"
REFINED_DB = REFINED / "agrosmart.db"

TEMPERATURA_IDEAL_MIN = 20
TEMPERATURA_IDEAL_MAX = 30
UMIDADE_IDEAL_MIN = 50
UMIDADE_IDEAL_MAX = 80

def conectar_banco():
    conexao = sqlite3.connect(DB)
    conexao.row_factory = sqlite3.Row
    conexao.execute("ATTACH DATABASE ? AS refined", (str(REFINED_DB),))
    return conexao


def refinar_leituras(banco, leitura_id=None):
    
    consulta = """
        INSERT OR REPLACE INTO refined.leituras
        (id, recebido_em, temperatura, umidade,
         status_temperatura, status_umidade, status_geral)
        SELECT id, recebido_em, temperatura, umidade,
            CASE WHEN temperatura < ? THEN 'baixo'
                 WHEN temperatura > ? THEN 'alto' ELSE 'ideal' END,
            CASE WHEN umidade < ? THEN 'baixo'
                 WHEN umidade > ? THEN 'alto' ELSE 'ideal' END,
            CASE WHEN temperatura BETWEEN ? AND ? AND umidade BETWEEN ? AND ?
                 THEN 'ideal' ELSE 'irregular' END
        FROM main.leituras
    """
    parametros = [
        TEMPERATURA_IDEAL_MIN, TEMPERATURA_IDEAL_MAX,
        UMIDADE_IDEAL_MIN, UMIDADE_IDEAL_MAX,
        TEMPERATURA_IDEAL_MIN, TEMPERATURA_IDEAL_MAX,
        UMIDADE_IDEAL_MIN, UMIDADE_IDEAL_MAX,
    ]
    if leitura_id is not None:
        consulta += " WHERE id = ?"
        parametros.append(leitura_id)
    banco.execute(consulta, parametros)


def inicializar_banco(*, limpar_historico=False):
    for pasta in [RAW, TRUSTED, REFINED]:
        pasta.mkdir(parents=True, exist_ok=True)

    with closing(conectar_banco()) as banco, banco:
        banco.execute("""
            CREATE TABLE IF NOT EXISTS leituras (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recebido_em TEXT NOT NULL,
                temperatura REAL NOT NULL,
                umidade REAL NOT NULL
            )
        """)

        banco.execute("""
            CREATE VIEW IF NOT EXISTS resumo_horario AS
            SELECT
                substr(recebido_em, 1, 13) AS hora_utc,
                COUNT(*) AS total_leituras,
                ROUND(AVG(temperatura), 2)
                    AS temperatura_media,
                ROUND(AVG(umidade), 2)
                    AS umidade_media,
                MIN(temperatura) AS temperatura_minima,
                MAX(temperatura) AS temperatura_maxima
            FROM leituras
            GROUP BY substr(recebido_em, 1, 13)
        """)

        banco.execute("""
            CREATE TABLE IF NOT EXISTS refined.leituras (
                id INTEGER PRIMARY KEY,
                recebido_em TEXT NOT NULL,
                temperatura REAL NOT NULL,
                umidade REAL NOT NULL,
                status_temperatura TEXT NOT NULL CHECK (status_temperatura IN ('baixo', 'ideal', 'alto')),
                status_umidade TEXT NOT NULL CHECK (status_umidade IN ('baixo', 'ideal', 'alto')),
                status_geral TEXT NOT NULL CHECK (status_geral IN ('ideal', 'irregular'))
            )
        """)
        if limpar_historico:
            banco.execute("DELETE FROM refined.leituras")
            banco.execute("DELETE FROM main.leituras")
        else:
            refinar_leituras(banco)

    if limpar_historico:
        
        for arquivo in RAW.glob("*.jsonl"):
            if arquivo.is_file():
                arquivo.unlink()

    print("Banco de dados inicializado com histórico vazio!" if limpar_historico
          else "Banco de dados inicializado!")


def registrar_mensagem(topico, mensagem):
    agora = datetime.now(timezone.utc)
    horario = agora.isoformat(timespec="seconds")
    texto = mensagem.decode("utf-8", errors="replace")

    arquivo = RAW / f"{agora:%Y-%m-%d}.jsonl"

    with open(arquivo, "a", encoding="utf-8") as f:
        f.write(json.dumps({
            "recebido_em": horario,
            "topico": topico,
            "payload": texto
        }, ensure_ascii=False) + "\n")

    try:
        dados = json.loads(texto)

        if not isinstance(dados, dict):
            return False

        temperatura = dados.get("temperatura")
        umidade = dados.get("umidade")

        if type(temperatura) not in (int, float):
            return False

        if type(umidade) not in (int, float):
            return False

        if not math.isfinite(temperatura):
            return False

        if not math.isfinite(umidade):
            return False

        if not (-20 <= temperatura <= 60):
            return False

        if not (0 <= umidade <= 100):
            return False

    except (ValueError, TypeError, OverflowError):
        return False

    with closing(conectar_banco()) as banco, banco:
        registro = banco.execute("""
            INSERT INTO leituras
            (recebido_em, temperatura, umidade)
            VALUES (?, ?, ?)
        """, (horario, temperatura, umidade))
        refinar_leituras(banco, registro.lastrowid)

    return True


def buscar_leituras(limite=100):
    with closing(conectar_banco()) as banco:
        registros = banco.execute("""
            SELECT * FROM leituras
            ORDER BY id DESC
            LIMIT ?
        """, (limite,)).fetchall()

    return [dict(r) for r in reversed(registros)]


def buscar_leituras_refined(limite=100):
    with closing(conectar_banco()) as banco:
        registros = banco.execute("""
            SELECT * FROM refined.leituras
            ORDER BY id DESC
            LIMIT ?
        """, (limite,)).fetchall()
    return [dict(r) for r in reversed(registros)]


def buscar_resumo():
    with closing(conectar_banco()) as banco:
        registros = banco.execute("""
            SELECT * FROM resumo_horario
            ORDER BY hora_utc DESC
            LIMIT 24
        """).fetchall()

    return [dict(r) for r in reversed(registros)]
