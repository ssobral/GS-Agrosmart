import json
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path


CONTROLE_DB = Path(__file__).resolve().parent.parent / "data_lake" / "controle.db"
FUSO_HORARIO = "America/Sao_Paulo"


def inicializar_banco_controle():
    CONTROLE_DB.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(CONTROLE_DB)) as banco, banco:
        banco.execute("""
            CREATE TABLE IF NOT EXISTS programacao_sprinklers (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                frequencia_diaria INTEGER NOT NULL CHECK (frequencia_diaria BETWEEN 1 AND 24),
                primeiro_horario TEXT NOT NULL,
                duracao_minutos INTEGER NOT NULL CHECK (duracao_minutos BETWEEN 1 AND 60),
                horarios TEXT NOT NULL,
                atualizado_em TEXT NOT NULL,
                atualizado_por TEXT NOT NULL
            )
        """)


def gerar_horarios(frequencia_diaria, primeiro_horario):
    hora, minuto = map(int, primeiro_horario.split(":"))
    inicio = hora * 60 + minuto
    horarios = []
    for indice in range(frequencia_diaria):
        minuto_do_dia = (inicio + indice * 1440 // frequencia_diaria) % 1440
        horarios.append(f"{minuto_do_dia // 60:02d}:{minuto_do_dia % 60:02d}")
    return horarios


def buscar_programacao():
    with closing(sqlite3.connect(CONTROLE_DB)) as banco:
        banco.row_factory = sqlite3.Row
        registro = banco.execute("SELECT * FROM programacao_sprinklers WHERE id = 1").fetchone()
    if registro is None:
        return None
    return {
        "frequencia_diaria": registro["frequencia_diaria"],
        "primeiro_horario": registro["primeiro_horario"],
        "duracao_minutos": registro["duracao_minutos"],
        "horarios": json.loads(registro["horarios"]),
        "atualizado_em": registro["atualizado_em"],
        "fuso_horario": FUSO_HORARIO,
    }


def salvar_programacao(frequencia_diaria, primeiro_horario, duracao_minutos, usuario_hash):
    horarios = gerar_horarios(frequencia_diaria, primeiro_horario)
    atualizado_em = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with closing(sqlite3.connect(CONTROLE_DB)) as banco, banco:
        banco.execute("""
            INSERT INTO programacao_sprinklers
            (id, frequencia_diaria, primeiro_horario, duracao_minutos, horarios,
             atualizado_em, atualizado_por)
            VALUES (1, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                frequencia_diaria = excluded.frequencia_diaria,
                primeiro_horario = excluded.primeiro_horario,
                duracao_minutos = excluded.duracao_minutos,
                horarios = excluded.horarios,
                atualizado_em = excluded.atualizado_em,
                atualizado_por = excluded.atualizado_por
        """, (frequencia_diaria, primeiro_horario, duracao_minutos,
              json.dumps(horarios), atualizado_em, usuario_hash))
    return buscar_programacao()


def cancelar_programacao():
    with closing(sqlite3.connect(CONTROLE_DB)) as banco, banco:
        banco.execute("DELETE FROM programacao_sprinklers WHERE id = 1")
