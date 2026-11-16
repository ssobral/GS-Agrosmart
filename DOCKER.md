# AgroSmart com Docker Compose

## Requisitos
Docker Desktop iniciado, com Docker Compose disponível.

## Inicializar
Na pasta raiz do projeto:

```powershell
docker compose up --build -d
```

Abra http://localhost:8080 para acessar a interface e http://localhost:8000/docs para a documentação da API.

## Comandos úteis

```powershell
docker compose ps
docker compose logs -f
docker compose down
```

Os arquivos SQLite e as leituras permanecem em `data_lake/` no computador, mesmo após `docker compose down`.

## IA (opcional)
Copie `.env.example` para `.env` na raiz, defina `OPENAI_API_KEY` e reinicie os serviços. Não compartilhe o arquivo `.env`.

## Observações
- O frontend usa Nginx para encaminhar `/api/` ao backend.
- MQTT usa o broker público `broker.emqx.io:1883`, exigindo acesso à internet.
- Não execute o backend local e o container simultaneamente: ambos podem disputar a porta 8000 e acessar os mesmos bancos SQLite.
- `LIMPAR_HISTORICO` agora é `false` por padrão. Definir `true` apagará o histórico na inicialização.
- Este Compose é destinado ao desenvolvimento e à demonstração local, não a um deploy público sem ajustes adicionais de segurança.
