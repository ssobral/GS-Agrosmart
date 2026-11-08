import asyncio
import json
import sqlite3
import sys
import tempfile
import time
import unittest
from contextlib import closing
from http.cookies import SimpleCookie
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main
import users_database as users
import controle_database as controle


class AuthenticationTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        db_patch = patch.object(users, 'USERS_DB', Path(self.temp.name) / 'users.db')
        db_patch.start()
        self.addCleanup(db_patch.stop)
        users.inicializar_banco_users()
        users.cadastrar_usuario('123', 'Teste', 'senha-de-teste')
        controle_patch = patch.object(controle, 'CONTROLE_DB', Path(self.temp.name) / 'controle.db')
        controle_patch.start()
        self.addCleanup(controle_patch.stop)
        controle.inicializar_banco_controle()

    async def request(self, path, method='GET', cookie='', body=None, scheme='http'):
        payload = json.dumps(body).encode() if body is not None else b''
        messages = []
        sent = False

        async def receive():
            nonlocal sent
            if not sent:
                sent = True
                return {'type': 'http.request', 'body': payload, 'more_body': False}
            await asyncio.Event().wait()

        async def send(message):
            messages.append(message)

        await main.app({
            'type': 'http', 'asgi': {'version': '3.0', 'spec_version': '2.4'},
            'http_version': '1.1', 'method': method, 'scheme': scheme,
            'path': path, 'raw_path': path.encode(), 'query_string': b'',
            'root_path': '', 'server': ('testserver', 80), 'client': ('127.0.0.1', 1234),
            'headers': [(b'host', b'testserver'), (b'content-type', b'application/json'),
                        (b'cookie', cookie.encode())],
        }, receive, send)
        start = next(item for item in messages if item['type'] == 'http.response.start')
        content = b''.join(item.get('body', b'') for item in messages
                           if item['type'] == 'http.response.body')
        return start['status'], start['headers'], json.loads(content) if content else None

    async def login(self, scheme='http', cookie=''):
        status, headers, _ = await self.request('/api/login', 'POST', cookie=cookie,
            body={'id': '123', 'senha': 'senha-de-teste'}, scheme=scheme)
        self.assertEqual(status, 200)
        cookies = SimpleCookie()
        for key, value in headers:
            if key == b'set-cookie':
                cookies.load(value.decode())
        return cookies['session_id'], headers

    async def test_missing_forged_and_legacy_cookies_cannot_access_private_api(self):
        for path in ['/api/session', '/api/leituras', '/api/leituras/refined', '/api/resumo', '/api/controle']:
            for cookie in ['', 'user_id=123', 'session_id=123', 'session_id=' + 'a' * 43]:
                with self.subTest(path=path, cookie=cookie):
                    status, headers, _ = await self.request(path, cookie=cookie)
                    self.assertEqual(status, 401)
                    self.assertIn((b'cache-control', b'no-store'), headers)

    async def test_login_creates_hashed_session_and_protects_cookie(self):
        cookie, _ = await self.login()
        token = cookie.value
        self.assertEqual(len(token), 43)
        self.assertTrue(cookie['httponly'])
        self.assertEqual(cookie['samesite'], 'lax')
        self.assertEqual(cookie['path'], '/')
        self.assertEqual(int(cookie['max-age']), users.SESSION_DURATION_SECONDS)
        with closing(sqlite3.connect(users.USERS_DB)) as db:
            saved_hash, user_hash, expires = db.execute('SELECT * FROM sessions').fetchone()
        self.assertNotEqual(saved_hash, token)
        self.assertEqual(saved_hash, users.hash_id(token))
        self.assertEqual(user_hash, users.hash_id('123'))
        self.assertGreater(expires, time.time())
        status, _, data = await self.request('/api/session', cookie=f'session_id={token}')
        self.assertEqual(status, 200)
        self.assertTrue(data['authenticated'])
        self.assertEqual(data['expires_at'], expires)
        self.assertEqual(data['user'], {'name': 'Teste'})
        self.assertNotIn('user_id_hash', data)
        for path, function in [('/api/leituras', 'buscar_leituras'),
                               ('/api/leituras/refined', 'buscar_leituras_refined'),
                               ('/api/resumo', 'buscar_resumo')]:
            with patch.object(main, function, return_value=[{'teste': True}]):
                status, _, data = await self.request(path, cookie=f'session_id={token}')
                self.assertEqual(status, 200)
                self.assertEqual(data, [{'teste': True}])

    async def test_https_cookie_is_secure(self):
        cookie, _ = await self.login(scheme='https')
        self.assertTrue(cookie['secure'])

    async def test_wrong_password_does_not_create_session(self):
        status, headers, _ = await self.request('/api/login', 'POST',
            body={'id': '123', 'senha': 'incorreta'})
        self.assertEqual(status, 401)
        self.assertFalse(any(key == b'set-cookie' for key, _ in headers))
        with closing(sqlite3.connect(users.USERS_DB)) as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM sessions').fetchone()[0], 0)

    async def test_expired_session_is_rejected_on_all_private_endpoints(self):
        cookie, _ = await self.login()
        with closing(sqlite3.connect(users.USERS_DB)) as db, db:
            db.execute('UPDATE sessions SET expires_at = ?', (int(time.time()) - 1,))
        for path in ['/api/session', '/api/leituras', '/api/leituras/refined', '/api/resumo']:
            status, _, _ = await self.request(path, cookie=f'session_id={cookie.value}')
            self.assertEqual(status, 401)

    async def test_logout_revokes_token_and_clears_cookie(self):
        cookie, _ = await self.login()
        token_cookie = f'session_id={cookie.value}'
        status, headers, _ = await self.request('/api/logout', 'POST', cookie=token_cookie)
        self.assertEqual(status, 204)
        self.assertTrue(any(key == b'set-cookie' and b'session_id=""' in value
                            and b'Max-Age=0' in value for key, value in headers))
        for path in ['/api/session', '/api/leituras', '/api/leituras/refined', '/api/resumo']:
            status, _, _ = await self.request(path, cookie=token_cookie)
            self.assertEqual(status, 401)
        status, _, _ = await self.request('/api/logout', 'POST')
        self.assertEqual(status, 204)

    async def test_login_rotates_existing_session(self):
        old, _ = await self.login()
        new, _ = await self.login(cookie=f'session_id={old.value}')
        self.assertNotEqual(old.value, new.value)
        self.assertIsNone(users.buscar_sessao(old.value))
        self.assertIsNotNone(users.buscar_sessao(new.value))

    async def test_deleted_user_loses_access(self):
        cookie, _ = await self.login()
        with closing(sqlite3.connect(users.USERS_DB)) as db, db:
            db.execute('DELETE FROM users')
        status, _, _ = await self.request('/api/session', cookie=f'session_id={cookie.value}')
        self.assertEqual(status, 401)

    async def test_display_name_updates_without_changing_password_or_session(self):
        cookie, _ = await self.login()
        self.assertTrue(users.atualizar_nome_usuario('123', 'Lucas'))
        self.assertTrue(users.verificar_credenciais('123', 'senha-de-teste'))
        status, _, data = await self.request('/api/session', cookie=f'session_id={cookie.value}')
        self.assertEqual(status, 200)
        self.assertEqual(data['user'], {'name': 'Lucas'})

    async def test_old_database_migrates_name_without_losing_login_or_sessions(self):
        cookie, _ = await self.login()
        with closing(sqlite3.connect(users.USERS_DB)) as db, db:
            
            db.execute('ALTER TABLE users DROP COLUMN nome')
            db.execute("ALTER TABLE users ADD COLUMN nome_hash TEXT NOT NULL DEFAULT 'old-hash'")
        users.inicializar_banco_users()
        users.inicializar_banco_users()
        with closing(sqlite3.connect(users.USERS_DB)) as db:
            columns = [row[1] for row in db.execute('PRAGMA table_info(users)')]
        self.assertIn('nome', columns)
        self.assertNotIn('nome_hash', columns)
        self.assertTrue(users.verificar_credenciais('123', 'senha-de-teste'))
        status, _, data = await self.request('/api/session', cookie=f'session_id={cookie.value}')
        self.assertEqual(status, 200)
        self.assertIsNone(data['user']['name'])

    async def test_control_actions_require_a_session(self):
        for path, body in [('/api/controle/programacao', {
            'frequencia_diaria': 2, 'primeiro_horario': '06:00', 'duracao_minutos': 5,
        }), ('/api/controle/acionar', {'duracao_minutos': 1}),
            ('/api/controle/programacao/cancelar', {})]:
            status, _, _ = await self.request(path, 'POST', body=body)
            self.assertEqual(status, 401)

    async def test_ai_requires_a_valid_session_without_calling_the_provider(self):
        with patch.object(main, 'gerar_recomendacoes') as gerar:
            for cookie in ['', 'user_id=123', 'session_id=inventada']:
                status, headers, _ = await self.request('/api/recomendacoes', 'POST', cookie=cookie)
                self.assertEqual(status, 401)
                self.assertIn((b'cache-control', b'no-store'), headers)
            cookie, _ = await self.login()
            with closing(sqlite3.connect(users.USERS_DB)) as db, db:
                db.execute('UPDATE sessions SET expires_at = ?', (int(time.time()) - 1,))
            status, _, _ = await self.request('/api/recomendacoes', 'POST', cookie=f'session_id={cookie.value}')
            self.assertEqual(status, 401)
            gerar.assert_not_called()

    async def test_ai_returns_recommendations_to_the_authenticated_user(self):
        cookie, _ = await self.login()
        resultado = {'recomendacoes': '1. Acompanhe a temperatura.\n2. Verifique a umidade do ar.'}
        with patch.object(main, 'gerar_recomendacoes', return_value=resultado) as gerar:
            status, headers, dados = await self.request('/api/recomendacoes', 'POST', cookie=f'session_id={cookie.value}')
            self.assertEqual(status, 200)
            self.assertEqual(dados, resultado)
            self.assertIn((b'cache-control', b'no-store'), headers)
            gerar.assert_called_once_with()

    async def test_ai_errors_return_safe_messages(self):
        cookie, _ = await self.login()
        for erro, mensagem in [
            (main.OpenAIError('detalhes internos'), 'Serviço de IA indisponível.'),
            (KeyError('OPENAI_API_KEY'), 'Chave da API não configurada.'),
        ]:
            with self.subTest(erro=type(erro).__name__), patch.object(main, 'gerar_recomendacoes', side_effect=erro):
                status, _, dados = await self.request('/api/recomendacoes', 'POST', cookie=f'session_id={cookie.value}')
                self.assertEqual(status, 503)
                self.assertEqual(dados['detail'], mensagem)

    async def test_ai_distinguishes_exhausted_credits_from_temporary_rate_limits(self):
        cookie, _ = await self.login()
        for codigo, mensagem in [
            ('credit_balance_exhausted', 'sem créditos'),
            ('insufficient_quota', 'cota da API de IA foi esgotada'),
            ('project_spend_limit_exceeded', 'cota da API de IA foi esgotada'),
            ('rate_limit_exceeded', 'Muitas solicitações'),
        ]:
            resposta = SimpleNamespace(status_code=429, request=object(), headers={})
            erro = main.RateLimitError('detalhes privados', response=resposta, body={'code': codigo})
            with self.subTest(codigo=codigo), patch.object(main, 'gerar_recomendacoes', side_effect=erro):
                status, _, dados = await self.request('/api/recomendacoes', 'POST', cookie=f'session_id={cookie.value}')
                self.assertEqual(status, 503)
                self.assertIn(mensagem, dados['detail'])
                self.assertNotIn('detalhes privados', dados['detail'])

    async def test_daily_schedule_is_saved_and_survives_reinitialization(self):
        cookie, _ = await self.login()
        session = f'session_id={cookie.value}'
        status, _, initial = await self.request('/api/controle', cookie=session)
        self.assertEqual(status, 200)
        self.assertIsNone(initial['programacao'])
        self.assertFalse(initial['acionamento_disponivel'])
        body = {'frequencia_diaria': 3, 'primeiro_horario': '06:30', 'duracao_minutos': 5}
        status, _, saved = await self.request('/api/controle/programacao', 'POST', cookie=session, body=body)
        self.assertEqual(status, 200)
        self.assertEqual(saved['programacao']['horarios'], ['06:30', '14:30', '22:30'])
        self.assertEqual(saved['programacao']['fuso_horario'], 'America/Sao_Paulo')
        controle.inicializar_banco_controle()
        status, _, loaded = await self.request('/api/controle', cookie=session)
        self.assertEqual(loaded['programacao'], saved['programacao'])
        body['frequencia_diaria'] = 2
        status, _, saved = await self.request('/api/controle/programacao', 'POST', cookie=session, body=body)
        self.assertEqual(saved['programacao']['horarios'], ['06:30', '18:30'])
        with closing(sqlite3.connect(controle.CONTROLE_DB)) as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM programacao_sprinklers').fetchone()[0], 1)

    async def test_schedule_rejects_invalid_limits_times_and_types(self):
        cookie, _ = await self.login()
        for changes in [
            {'frequencia_diaria': 0}, {'frequencia_diaria': 25},
            {'frequencia_diaria': 2.5}, {'frequencia_diaria': True},
            {'primeiro_horario': '24:00'}, {'primeiro_horario': '12:60'},
            {'primeiro_horario': '6:00'}, {'primeiro_horario': '06:00:30'},
            {'duracao_minutos': 0}, {'duracao_minutos': 61}, {'duracao_minutos': '5'},
        ]:
            body = {'frequencia_diaria': 2, 'primeiro_horario': '06:00', 'duracao_minutos': 5, **changes}
            status, _, _ = await self.request('/api/controle/programacao', 'POST',
                cookie=f'session_id={cookie.value}', body=body)
            self.assertEqual(status, 422, changes)
        self.assertIsNone(controle.buscar_programacao())

    async def test_cancel_schedule_removes_persisted_frequency_and_allows_new_registration(self):
        cookie, _ = await self.login()
        session = f'session_id={cookie.value}'
        body = {'frequencia_diaria': 2, 'primeiro_horario': '06:00', 'duracao_minutos': 5}
        await self.request('/api/controle/programacao', 'POST', cookie=session, body=body)
        for _ in range(2):
            status, _, result = await self.request('/api/controle/programacao/cancelar', 'POST', cookie=session)
            self.assertEqual(status, 200)
            self.assertIsNone(result['programacao'])
        controle.inicializar_banco_controle()
        status, _, loaded = await self.request('/api/controle', cookie=session)
        self.assertEqual(status, 200)
        self.assertIsNone(loaded['programacao'])
        status, _, result = await self.request('/api/controle/programacao', 'POST', cookie=session, body=body)
        self.assertEqual(status, 200)
        self.assertEqual(result['programacao']['frequencia_diaria'], 2)

    async def test_unauthenticated_cancellation_does_not_remove_saved_frequency(self):
        controle.salvar_programacao(2, '06:00', 5, users.hash_id('123'))
        status, _, _ = await self.request('/api/controle/programacao/cancelar', 'POST')
        self.assertEqual(status, 401)
        self.assertIsNotNone(controle.buscar_programacao())

    async def test_manual_action_does_not_claim_success_without_hardware(self):
        cookie, _ = await self.login()
        status, _, result = await self.request('/api/controle/acionar', 'POST',
            cookie=f'session_id={cookie.value}', body={'duracao_minutos': 1})
        self.assertEqual(status, 503)
        self.assertIn('não estão conectados', result['detail'])

    async def test_schedule_times_wrap_at_midnight_without_duplicate_times(self):
        self.assertEqual(controle.gerar_horarios(2, '23:30'), ['23:30', '11:30'])
        for frequency in range(1, 25):
            times = controle.gerar_horarios(frequency, '07:15')
            self.assertEqual(len(times), frequency)
            self.assertEqual(len(set(times)), frequency)


if __name__ == '__main__':
    unittest.main()
