import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import controle_database as controle
import database
import main
import users_database as users


class StartupTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        base = Path(temp.name)
        for remendo in [
            patch.multiple(database, BASE=base, RAW=base / 'raw', TRUSTED=base / 'trusted',
                           REFINED=base / 'refined', DB=base / 'trusted' / 'agrosmart.db',
                           REFINED_DB=base / 'refined' / 'agrosmart.db'),
            patch.object(users, 'USERS_DB', base / 'users.db'),
            patch.object(controle, 'CONTROLE_DB', base / 'controle.db'),
        ]:
            remendo.start()
            self.addCleanup(remendo.stop)
        database.inicializar_banco()
        users.inicializar_banco_users()
        controle.inicializar_banco_controle()

    async def test_each_start_clears_sensor_history_before_mqtt_and_preserves_accounts_and_schedule(self):
        users.cadastrar_usuario('2342', 'UserTest', 'senha-de-teste')
        token = users.criar_sessao('2342')
        programacao = controle.salvar_programacao(2, '06:00', 5, users.hash_id('2342'))

        def registrar(temperatura):
            return database.registrar_mensagem('teste', json.dumps({
                'temperatura': temperatura, 'umidade': 65,
            }).encode())

        self.assertTrue(registrar(21))
        cliente = Mock()

        def conectar():
            self.assertEqual(database.buscar_leituras(), [])
            self.assertEqual(database.buscar_leituras_refined(), [])
            self.assertEqual(database.buscar_resumo(), [])
            self.assertEqual(list(database.RAW.glob('*.jsonl')), [])
            return cliente

        with patch.object(main, 'iniciar_mqtt', side_effect=conectar) as iniciar:
            for temperatura in [25, 30]:
                async with main.lifespan(main.app):
                    self.assertTrue(users.verificar_credenciais('2342', 'senha-de-teste'))
                    self.assertEqual(users.buscar_sessao(token)['nome'], 'UserTest')
                    self.assertEqual(controle.buscar_programacao(), programacao)
                    self.assertTrue(registrar(temperatura))
                    self.assertEqual(len(database.buscar_leituras()), 1)
                    self.assertEqual(database.buscar_leituras_refined()[0]['temperatura'], temperatura)

        self.assertEqual(iniciar.call_count, 2)
        self.assertEqual(cliente.disconnect.call_count, 2)
        self.assertEqual(cliente.loop_stop.call_count, 2)


if __name__ == '__main__':
    unittest.main()
