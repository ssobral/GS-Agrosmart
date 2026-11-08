import json
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import ia
from openai import OpenAIError


class RecomendacoesTests(unittest.TestCase):
    def test_insufficient_readings_do_not_call_the_provider(self):
        for quantidade in [0, 1, 4]:
            with self.subTest(quantidade=quantidade), \
                    patch.object(ia, 'buscar_leituras', return_value=[{}] * quantidade), \
                    patch.object(ia, 'OpenAI') as cliente:
                resultado = ia.gerar_recomendacoes()
                self.assertIn('5 leituras', resultado['recomendacoes'])
                cliente.assert_not_called()

    def test_generation_uses_real_readings_and_returns_the_provider_text(self):
        registros = [
            {'id': indice, 'temperatura': 20 + indice, 'umidade': 60,
             'recebido_em': f'2026-11-08T12:00:0{indice}+00:00'}
            for indice in range(5)
        ]
        with patch.object(ia, 'buscar_leituras', return_value=registros) as buscar, \
                patch.object(ia, 'OpenAI') as cliente, \
                patch.dict(ia.os.environ, {'OPENAI_API_KEY': 'chave-de-teste'}):
            cliente.return_value.responses.create.return_value = SimpleNamespace(
                status='completed', output_text=' 1. Acompanhe as leituras.\n',
            )
            self.assertEqual(ia.gerar_recomendacoes(), {
                'recomendacoes': '1. Acompanhe as leituras.',
            })
            buscar.assert_called_once_with(5)
            parametros = cliente.return_value.responses.create.call_args.kwargs
            self.assertEqual(parametros['model'], 'gpt-4.1-mini')
            dados_enviados = json.loads(parametros['input'].split('\n', 1)[1])
            self.assertEqual(dados_enviados, registros)

    def test_incomplete_or_empty_responses_are_not_presented_as_recommendations(self):
        for status, texto in [('incomplete', 'Texto cortado'), ('completed', ' \n'), ('failed', '')]:
            with self.subTest(status=status, texto=texto), \
                    patch.object(ia, 'buscar_leituras', return_value=[{}] * 5), \
                    patch.object(ia, 'OpenAI') as cliente, \
                    patch.dict(ia.os.environ, {'OPENAI_API_KEY': 'chave-de-teste'}):
                cliente.return_value.responses.create.return_value = SimpleNamespace(
                    status=status, output_text=texto,
                )
                with self.assertRaises(OpenAIError):
                    ia.gerar_recomendacoes()


if __name__ == '__main__':
    unittest.main()
