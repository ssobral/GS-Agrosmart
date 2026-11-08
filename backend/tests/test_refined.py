import json
import sqlite3
import sys
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import database


class RefinedTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        base = Path(temp.name)
        patches = patch.multiple(
            database, BASE=base, RAW=base / 'raw', TRUSTED=base / 'trusted',
            REFINED=base / 'refined', DB=base / 'trusted' / 'agrosmart.db',
            REFINED_DB=base / 'refined' / 'agrosmart.db',
        )
        patches.start()
        self.addCleanup(patches.stop)
        database.inicializar_banco()

    def register(self, temperatura, umidade):
        return database.registrar_mensagem(
            'agrosmart/fiap/gs2026/sensores',
            json.dumps({'temperatura': temperatura, 'umidade': umidade}).encode(),
        )

    def raw_records(self):
        return [json.loads(line) for path in database.RAW.glob('*.jsonl')
                for line in path.read_text(encoding='utf-8').splitlines()]

    def test_thresholds_are_inclusive_and_statuses_independent(self):
        temperaturas = [(19.9, 'baixo'), (20, 'ideal'), (25, 'ideal'),
                        (30, 'ideal'), (30.1, 'alto')]
        umidades = [(49.9, 'baixo'), (50, 'ideal'), (65, 'ideal'),
                    (80, 'ideal'), (80.1, 'alto')]
        for temperatura, status_t in temperaturas:
            for umidade, status_u in umidades:
                with self.subTest(temperatura=temperatura, umidade=umidade):
                    self.assertTrue(self.register(temperatura, umidade))
                    leitura = database.buscar_leituras_refined(1)[0]
                    self.assertEqual(leitura['temperatura'], temperatura)
                    self.assertEqual(leitura['umidade'], umidade)
                    self.assertEqual(leitura['status_temperatura'], status_t)
                    self.assertEqual(leitura['status_umidade'], status_u)
                    esperado = 'ideal' if status_t == status_u == 'ideal' else 'irregular'
                    self.assertEqual(leitura['status_geral'], esperado)
        self.assertEqual(len(database.buscar_leituras_refined()), 25)

    def test_trusted_extremes_still_reach_refined(self):
        for temperatura, umidade in [(-20, 0), (60, 100)]:
            self.assertTrue(self.register(temperatura, umidade))
        self.assertEqual(len(database.buscar_leituras()), 2)
        self.assertEqual(len(database.buscar_leituras_refined()), 2)

    def test_invalid_measurements_stay_only_in_raw(self):
        for temperatura, umidade in [
            (-20.1, 60), (60.1, 60), (25, -0.1), (25, 100.1),
            ('25', 60), (25, '60'), (True, 60), (25, False),
            (None, 60), (25, None), (float('nan'), 60),
            (25, float('inf')), (10 ** 400, 60),
        ]:
            with self.subTest(temperatura=temperatura, umidade=umidade):
                self.assertFalse(self.register(temperatura, umidade))
        for payload in [b'not-json', b'[]', b'{}']:
            self.assertFalse(database.registrar_mensagem('teste', payload))
        self.assertEqual(len(self.raw_records()), 16)
        self.assertEqual(database.buscar_leituras(), [])
        self.assertEqual(database.buscar_leituras_refined(), [])

    def test_refined_keeps_source_id_timestamp_and_values(self):
        self.assertTrue(self.register(26, 86))
        trusted = database.buscar_leituras()[0]
        refined = database.buscar_leituras_refined()[0]
        for key, value in trusted.items():
            self.assertEqual(refined[key], value)
        self.assertEqual(refined['status_temperatura'], 'ideal')
        self.assertEqual(refined['status_umidade'], 'alto')
        self.assertEqual(refined['status_geral'], 'irregular')
        self.assertTrue(database.REFINED_DB.exists())

    def test_startup_backfills_history_and_preserves_records_and_ids(self):
        
        with closing(sqlite3.connect(database.DB)) as banco, banco:
            banco.execute(
                'INSERT INTO leituras (recebido_em, temperatura, umidade) VALUES (?, ?, ?)',
                ('2026-11-07T12:00:00+00:00', 18, 90),
            )
        self.assertEqual(database.buscar_leituras_refined(), [])
        database.inicializar_banco()
        first = database.buscar_leituras_refined()
        self.assertEqual(first[0]['status_temperatura'], 'baixo')
        self.assertEqual(first[0]['status_umidade'], 'alto')
        database.inicializar_banco()
        self.assertEqual(database.buscar_leituras_refined(), first)
        self.assertEqual(len(database.buscar_leituras()), 1)
        self.register(25, 65)
        self.assertGreater(database.buscar_leituras_refined()[-1]['id'], first[0]['id'])

    def test_refined_failure_rolls_back_both_databases(self):
        with patch.object(database, 'refinar_leituras', side_effect=RuntimeError('failure')):
            with self.assertRaises(RuntimeError):
                self.register(25, 65)
        self.assertEqual(database.buscar_leituras(), [])
        self.assertEqual(database.buscar_leituras_refined(), [])
        self.assertEqual(len(self.raw_records()), 1)

    def test_reset_removes_old_readings_from_all_layers_and_new_readings_still_work(self):
        self.register(22, 65)
        self.register(35, 40)
        (database.RAW / '2026-11-07.jsonl').write_text('{"antigo": true}\n', encoding='utf-8')
        (database.RAW / '.gitkeep').touch()
        (database.RAW / 'notas.txt').write_text('preservar', encoding='utf-8')
        self.assertTrue(database.buscar_resumo())

        database.inicializar_banco(limpar_historico=True)

        self.assertEqual(database.buscar_leituras(), [])
        self.assertEqual(database.buscar_leituras_refined(), [])
        self.assertEqual(database.buscar_resumo(), [])
        self.assertEqual(list(database.RAW.glob('*.jsonl')), [])
        self.assertTrue((database.RAW / '.gitkeep').exists())
        self.assertEqual((database.RAW / 'notas.txt').read_text(encoding='utf-8'), 'preservar')
        self.assertTrue(database.DB.exists())
        self.assertTrue(database.REFINED_DB.exists())

        self.assertTrue(self.register(26, 70))
        self.assertEqual(len(database.buscar_leituras()), 1)
        self.assertEqual(database.buscar_leituras_refined()[0]['temperatura'], 26)
        self.assertEqual(len(self.raw_records()), 1)

    def test_reset_also_works_when_history_is_already_empty(self):
        for _ in range(2):
            database.inicializar_banco(limpar_historico=True)
            self.assertEqual(database.buscar_leituras(), [])
            self.assertEqual(database.buscar_leituras_refined(), [])
            self.assertEqual(database.buscar_resumo(), [])

    def test_query_returns_latest_records_in_chronological_order(self):
        for temperatura in [22, 24, 26]:
            self.register(temperatura, 60)
        readings = database.buscar_leituras_refined(2)
        self.assertEqual([row['temperatura'] for row in readings], [24, 26])


if __name__ == '__main__':
    unittest.main()
