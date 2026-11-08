
import json
import os

from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI, OpenAIError

from database import buscar_leituras



load_dotenv(Path(__file__).with_name(".env"))


def gerar_recomendacoes():
    
    registros = buscar_leituras(5)

    if len(registros) < 5:
        return {
            "recomendacoes": (
                "Dados insuficientes. Aguarde pelo menos "
                "5 leituras para gerar uma análise."
            )
        }

    cliente = OpenAI(
        api_key=os.environ["OPENAI_API_KEY"],
        timeout=30.0
    )

    
    resposta = cliente.responses.create(
        model="gpt-4.1-mini",

        instructions="""
Você é um assistente de monitoramento agrícola
da plataforma AgroSmart.

Analise leituras ambientais de uma plantação
de soja, no Brasil.

Referências configuradas para o MVP:
- Temperatura: 20 a 30 °C.
- Umidade relativa do ar: 50 a 80%.

A faixa de umidade é um parâmetro de
simulação, não um limite agronômico universal.

Sua tarefa é recomendar ações práticas de monitoramento
com base exclusivamente nas cinco leituras fornecidas.
Avalie as condições e suas variações apenas para escolher
as ações; não apresente essa análise na resposta.

Padrões obrigatórios para as recomendações:
- Use a última leitura (o último registro da lista) para
  identificar a condição atual; as outras quatro leituras
  servem apenas como contexto.
- Umidade do ar baixa, menor que 50%: indique a ativação
  manual dos sprinklers pelo Painel de controle.
  Padrão: "Acione os sprinklers pelo Painel de controle
  para a condição de umidade do ar baixa, após verificar
  a umidade do solo e as condições da cultura."
- Temperatura alta, maior que 30 °C: indique criar ou
  ajustar uma rotina de sprinklers mais frequente pelo
  Painel de controle, com mais ativações por dia.
  Padrão: "Configure uma rotina de sprinklers mais
  frequente pelo Painel de controle devido à temperatura
  alta, após verificar a umidade do solo e a cultura."
- Umidade do ar alta, maior que 80%, ou temperatura baixa,
  menor que 20 °C: indique criar ou ajustar uma rotina de
  sprinklers menos frequente pelo Painel de controle.
  Padrão: "Configure uma rotina de sprinklers menos
  frequente pelo Painel de controle devido à umidade do
  ar alta ou à temperatura baixa."
  Cite somente a condição que estiver presente na leitura.
- Aplique somente os padrões correspondentes às condições
  atuais; não sugira corrigir uma condição já normalizada.
- Combine orientações equivalentes para evitar repetições.
- Se as condições simultâneas exigirem ações opostas,
  recomende revisar a rotina pelo Painel de controle após
  verificar o solo e a cultura; não indique aumentar e
  diminuir a frequência ao mesmo tempo.
- Com ambas as medidas na faixa ideal, recomende manter
  o monitoramento, sem inventar necessidade de alterações.
- Não invente frequência, horários ou duração específicos.

Formato obrigatório da resposta:
- Retorne somente uma lista numerada com 3 ou 4 recomendações.
- Cada item deve ter uma única frase curta, começando com
  um verbo de ação, como verificar, acompanhar ou registrar.
- Não inclua introdução, títulos, subtítulos, diagnóstico,
  descrição de tendências, resumo das leituras ou conclusão.
- Não inclua sublistas, explicações extensas ou Markdown
  além da numeração dos itens.

Regras obrigatórias:
- Utilize somente os registros fornecidos.
- Não invente dados, sensores ou previsões.
- Considere o intervalo de tempo das medições.
- Não confunda umidade do ar com umidade do solo.
- Não recomende ligar sprinklers automaticamente.
- Para irrigação, recomende verificar primeiro
  a umidade do solo e as condições da cultura.
- Escreva em português do Brasil.
- Use linguagem profissional, direta e sem repetições.
""",

        input=(
            "Com base somente nestas cinco leituras mais recentes, "
            "retorne apenas as ações recomendadas, em uma lista numerada, "
            "sem texto antes ou depois da lista:\n"
            + json.dumps(registros, ensure_ascii=False)
        ),

        max_output_tokens=500
    )

    texto = resposta.output_text.strip()
    if resposta.status != "completed" or not texto:
        raise OpenAIError("A IA não retornou uma análise completa.")

    return {
        "recomendacoes": texto
    }
