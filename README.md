# AgroSmart

## Participantes

Lucas Sobral Roxo RM98188 
Maitê Savicius Menezes RM98435 
Murilo Henrique Obinata RM99855 
Pedro Henrique Oliveira Ananias RM550689 
Vitor da Silva Sant ana RM99586

## Contexto geral do projeto

O AgroSmart é uma iniciativa que busca aproximar a tecnologia dos desafios do mercado agrícola. O projeto integra sensores, análise de dados e inteligência artificial para apoiar o monitoramento de uma plantação de soja e decisões mais conscientes sobre o manejo.

A plataforma permite acompanhar temperatura e umidade do ar, consultar o histórico das medições, gerar recomendações de IA e cadastrar rotinas de irrigação. Nosso propósito é unir inovação, produtividade e uso responsável dos recursos naturais.

### ODS da ONU

Os Objetivos de Desenvolvimento Sustentável que orientam a proposta são:

| ODS | Relação com o AgroSmart |
| --- | --- |
| [2 — Fome zero e agricultura sustentável](https://brasil.un.org/pt-br/sdgs/2) | Apoiar práticas agrícolas mais resilientes e sustentáveis. |
| [6 — Água potável e saneamento](https://brasil.un.org/pt-br/sdgs/6) | Incentivar o uso eficiente da água nas decisões sobre irrigação. |
| [9 — Indústria, inovação e infraestrutura](https://brasil.un.org/pt-br/sdgs/9) | Aplicar sensores, dados e IA aos desafios do agronegócio. |
| [12 — Consumo e produção responsáveis](https://brasil.un.org/pt-br/sdgs/12) | Promover o uso consciente dos recursos naturais na produção. |

### Valores considerados baixos, ideais ou altos

| Medida | Baixo | Ideal | Alto |
| Temperatura | Abaixo de 20 °C | De 20 a 30 °C, inclusive | Acima de 30 °C |
| Umidade do ar | Abaixo de 50% | De 50 a 80%, inclusive | Acima de 80% |

O status geral é **ideal** quando as duas medidas estão na faixa ideal. Se alguma estiver baixa ou alta, o status é **irregular**.

Essas faixas são parâmetros do projeto acadêmico. A umidade medida é a do **ar**, e não a do solo; os limites não representam uma recomendação agronômica universal.

## Link do vídeo pitch

**Link:** 

## Como iniciar os testes

Tenha o projeto no computador, Python com pip, Node.js 22.12 ou superior com npm. Os comandos abaixo são para **Windows / PowerShell**, partindo da pasta raiz do projeto.

### Dependências: o que instalar e onde

O **Python com pip** e o **Node.js com npm** precisam estar instalados no computador. As bibliotecas do backend ficam no ambiente virtual `backend/.venv`; as do frontend ficam em `frontend/node_modules`. Não é necessário instalar as bibliotecas globalmente.

#### Backend — instalar na pasta `backend`

Partindo da raiz do projeto, instale todas as dependências Python com:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Se o ambiente `.venv` já existir, pule o comando de criação. O arquivo `backend/requirements.txt` instala as seguintes bibliotecas:

| Biblioteca | Utilização | Comando individual, dentro de `backend` |
| --- | --- | --- |
| `fastapi` | Criação da API, rotas e autenticação. | `.\.venv\Scripts\python.exe -m pip install fastapi` |
| `uvicorn` | Servidor que executa a API. | `.\.venv\Scripts\python.exe -m pip install uvicorn` |
| `paho-mqtt` | Conexão ao broker e recebimento das leituras dos sensores. | `.\.venv\Scripts\python.exe -m pip install paho-mqtt` |
| `openai` | Integração com o serviço de IA. | `.\.venv\Scripts\python.exe -m pip install openai` |
| `python-dotenv` | Carregamento das variáveis do arquivo `.env`. | `.\.venv\Scripts\python.exe -m pip install python-dotenv` |

O código também usa **Pydantic** para validar as requisições. Ela é instalada automaticamente como dependência do FastAPI; não é necessário um comando separado. As demais dependências desses pacotes também são instaladas pelo pip.

#### Frontend — instalar na pasta `frontend`

Em outro terminal, partindo da raiz do projeto:

```powershell
cd frontend
npm install
```

Esse comando instala todas as bibliotecas declaradas em `frontend/package.json`, incluindo as ferramentas de desenvolvimento. As versões abaixo são as faixas declaradas nesse arquivo; o `package-lock.json` registra as versões resolvidas.

| Biblioteca | Versão declarada | Utilização | Comando individual, dentro de `frontend` |
| --- | --- | --- | --- |
| `react` | `^19.3.1` | Componentes e estado da interface. | `npm install "react@^19.3.1"` |
| `react-dom` | `^19.3.1` | Renderização do React no navegador. | `npm install "react-dom@^19.3.1"` |
| `bootstrap` | `^5.3.8` | Estilos e recursos de layout. | `npm install "bootstrap@^5.3.8"` |
| `mqtt` | `^5.16.1` | Cliente MQTT usado pelo módulo de sensores do frontend. | `npm install "mqtt@^5.16.1"` |
| `vite` | `^8.3.6` | Servidor de desenvolvimento e build. | `npm install -D "vite@^8.3.6"` |
| `@vitejs/plugin-react` | `^6.1.2` | Integração do React com o Vite. | `npm install -D "@vitejs/plugin-react@^6.1.2"` |
| `oxlint` | `^1.90.0` | Verificação de problemas no código. | `npm install -D "oxlint@^1.90.0"` |
| `@types/react` | `^19.3.0` | Definições de tipos do React para as ferramentas de desenvolvimento. | `npm install -D "@types/react@^19.3.0"` |
| `@types/react-dom` | `^19.3.0` | Definições de tipos do React DOM. | `npm install -D "@types/react-dom@^19.3.0"` |

Use os comandos individuais apenas como referência: se você já executou `pip install -r requirements.txt` e `npm install` nas pastas corretas, todas as bibliotecas listadas já foram instaladas. As dependências adicionais dos pacotes são resolvidas automaticamente.

#### Bibliotecas que não precisam de instalação separada

O SQLite é utilizado pelo módulo `sqlite3`, incluído no Python. Módulos como `json`, `os`, `pathlib`, `datetime`, `hashlib`, `logging` e `unittest` também fazem parte da biblioteca padrão. Os testes do frontend usam `node:test` e `node:assert`, incluídos no Node.js. Não é necessário instalar SQLite, pytest ou Jest para executar este projeto.

### Sequência do teste manual

Para testar a aplicação, siga esta ordem:

1. Inicie a simulação dos sensores no Wokwi.
2. Inicie a API em um terminal.
3. Inicie o React em outro terminal.
4. Entre com as credenciais de teste.
5. Aguarde as leituras aparecerem no dashboard. Para testar os conselhos de IA, configure também a chave descrita na última seção e aguarde pelo menos cinco leituras.

### Iniciar os sensores pelo Wokwi

[Abra o projeto dos sensores no Wokwi](https://wokwi.com/projects/479996521543979009).

Clique no botão de iniciar a simulação e mantenha-a em execução durante os testes. 

O envio das leituras deve usar:

- **Broker:** `broker.emqx.io`
- **Tópico:** `agrosmart/fiap/gs2026/sensores`

OBS: Para o Wokwi realizar a publicação, é necessário estar com a página focalizada. Após indicar os valores para temperatura e umidade no sensor DHT22, aguarde a confirmação de "Publicação enviada" no terminal do Wokwi.

A API se conecta automaticamente ao broker por MQTT na porta `1883`. Não é necessário abrir o MQTTX: ele é apenas uma ferramenta opcional para acompanhar ou enviar mensagens manualmente. Se outra pessoa já estiver mantendo o simulador ativo no mesmo tópico, as leituras também poderão ser recebidas pela sua API.

### Iniciar a API

Na primeira execução, crie o ambiente virtual e instale as dependências:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

No mesmo terminal, inicie a API:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Nas próximas execuções, basta entrar em `backend` e executar o comando do Uvicorn.

**A cada inicialização da API, todas as leituras antigas são excluídas da RAW, Trusted e Refined, inclusive nos reinícios provocados pelo `--reload`.** Contas, sessões e programação de irrigação são preservadas. A coleta recomeça com as novas mensagens dos sensores.

### Iniciar o React

Abra outro terminal na raiz do projeto:

```powershell
cd frontend
npm install
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173). Se a porta estiver ocupada, use o endereço informado pelo Vite no terminal. Nas próximas execuções, basta entrar em `frontend` e executar `npm run dev`.

## Credenciais de login

Conta disponível para testes:

**ID:** `2342`  
**Senha:** `Agrosmart`  
**Nome:** `UserTest`

## Conselhos de IA e chave da API

Na página **Histórico**, clique em **Gerar por IA**, na área **Ações sugeridas**. O backend consulta exclusivamente as **cinco leituras mais recentes** e envia os dados ao modelo `gpt-4.1-mini` da OpenAI. Com menos de cinco registros, a plataforma informa que os dados são insuficientes.

A resposta solicitada contém somente **3 ou 4 recomendações curtas e numeradas**. A leitura mais recente define a condição atual; as outras quatro servem como contexto.

| Condição atual | Orientação solicitada à IA |
| --- | --- |
| Umidade do ar baixa | Indicar ativação manual dos sprinklers pelo Painel de controle, após verificar o solo e a cultura. |
| Temperatura alta | Indicar uma rotina de sprinklers mais frequente pelo Painel de controle. |
| Umidade do ar alta ou temperatura baixa | Indicar uma rotina de sprinklers menos frequente pelo Painel de controle. |
| Condições que exigem ações opostas | Indicar a revisão da rotina, evitando recomendações contraditórias. |
| Ambas as medidas ideais | Indicar a manutenção do monitoramento. |

As recomendações não acionam equipamentos. No MVP, o acionamento imediato é uma simulação com confirmação e contagem regressiva, e a programação diária é cadastrada sem execução automática nos sprinklers.

### Como obter e configurar a chave

Para usar a IA, é necessário obter a API KEY e cadastra-la. 

Crie o arquivo `backend/.env` e preencha:

```.env
OPENAI_API_KEY=chave_da_openai
```

Substitua o valor de exemplo pela sua chave e reinicie a API. A chave é carregada apenas pelo backend; o arquivo `.env` já está no `.gitignore` e não deve ser publicado.
