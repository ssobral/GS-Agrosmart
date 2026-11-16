# AgroSmart — Plano de testes e evidências

**Projeto:** Global Solution FIAP — AgroSmart  
**Área:** DevOps, segurança e qualidade — critério 04 (Testes, 1 ponto)  
**Escopo:** testes automatizados do backend, integração e validações de negócio.  
**Situação:** suíte local aprovada conforme execução compartilhada pela equipe em 16/11/2026.

## 1. Objetivo

Demonstrar a qualidade do AgroSmart por meio de casos automatizados, resultados esperados e evidências reproduzíveis. O requisito da avaliação solicita **pelo menos cinco casos de teste e evidências de execução**.

## 2. Ambiente e estratégia

- **Backend:** Python 3.12, FastAPI e pytest.
- **Testes:** arquivos em `backend/tests/`.
- **Isolamento:** os testes que manipulam persistência utilizam diretórios/bancos temporários e mocks quando aplicável.
- **CI:** GitHub Actions (`.github/workflows/ci.yml`) com jobs de backend, frontend e build Docker.
- **Execução local:** Windows, ambiente virtual `.venv`.

## 3. Matriz de casos de teste

Os identificadores abaixo são usados **neste documento** para facilitar a avaliação. A coluna de referência indica o método automatizado existente no código. Os resultados individuais são compatíveis com a execução completa aprovada, mas não foram registrados separadamente em um relatório anexado.

| ID | Categoria | Cenário / procedimento | Resultado esperado | Teste automatizado | Situação |
|---|---|---|---|---|---|
| CT01 | Autenticação | Tentar login com senha incorreta | Não autenticar nem criar sessão válida | `tests/test_auth.py::AuthTests::test_wrong_password_does_not_create_session` | Aprovado na suíte |
| CT02 | Autorização | Acessar API privada sem cookie válido, com cookie forjado ou legado | Rejeitar acesso não autorizado | `tests/test_auth.py::AuthTests::test_missing_forged_and_legacy_cookies_cannot_access_private_api` | Aprovado na suíte |
| CT03 | Sessão | Fazer logout de usuário autenticado | Revogar token e limpar cookie de sessão | `tests/test_auth.py::AuthTests::test_logout_revokes_token_and_clears_cookie` | Aprovado na suíte |
| CT04 | Validação | Enviar limites, horários ou tipos inválidos para programação | Rejeitar parâmetros inválidos | `tests/test_auth.py::AuthTests::test_schedule_rejects_invalid_limits_times_and_types` | Aprovado na suíte |
| CT05 | Qualidade dos dados | Registrar medidas inválidas dos sensores | Manter dados na camada raw sem promovê-los à refined | `tests/test_refined.py::RefinedTests::test_invalid_measurements_stay_only_in_raw` | Aprovado na suíte |
| CT06 | Integridade | Simular falha na gravação da camada refinada | Reverter alterações nas duas bases relacionadas | `tests/test_refined.py::RefinedTests::test_refined_failure_rolls_back_both_databases` | Aprovado na suíte |
| CT07 | Persistência | Reiniciar a aplicação sem limpeza explícita | Preservar histórico de sensores, contas e programação | `tests/test_startup.py::StartupTests::test_normal_start_preserves_sensor_history_accounts_and_schedule` | Aprovado na suíte |
| CT08 | IA | Solicitar recomendação com leituras insuficientes | Não chamar o provedor externo | `tests/test_ia.py::IATests::test_insufficient_readings_do_not_call_the_provider` | Aprovado na suíte |
| CT09 | Limpeza controlada | Inicializar com `LIMPAR_HISTORICO=true` | Limpar histórico e manter contas/programação | `tests/test_startup.py::StartupTests::test_explicit_clear_removes_history_but_preserves_accounts_and_schedule` | Aprovado na suíte |

> **Nota:** os nomes das classes acima seguem a organização esperada dos arquivos de testes; para referência inequívoca, localize cada método pelo nome após `::`. Caso a classe difira na versão final do repositório, atualize a referência. Não altere os resultados esperados para forçar aprovação.

## 4. Como executar e reproduzir

Na raiz do projeto, em PowerShell:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install pytest
.\.venv\Scripts\python.exe -m pytest -v
```

Para gerar arquivos de evidência na pasta `docs/evidencias/` (execute a partir de `backend`):

```powershell
New-Item -ItemType Directory -Force ..\docs\evidencias | Out-Null
.\.venv\Scripts\python.exe -m pytest -v --junitxml=..\docs\evidencias\pytest-results.xml 2>&1 | Tee-Object -FilePath ..\docs\evidencias\pytest-output.txt
```

Os arquivos de saída devem ser revisados antes de publicação para evitar expor caminhos locais ou dados sensíveis. O relatório XML é gerado pelo pytest; não foi anexado a esta versão do documento.

## 5. Resultados e evidências disponíveis

### Execução local — 16/11/2026

Resultado informado pela execução no terminal da equipe:

```text
35 passed, 70 subtests passed in 24.94s
```

**Evidência recomendada:** inserir captura do terminal com o resumo acima em `docs/evidencias/pytest-local.png`.

### Pipeline de integração contínua — 16/11/2026

A captura compartilhada da execução **AgroSmart CI #4**, branch `main`, commit `10776e0`, mostra status **Success** e os três jobs aprovados:

- Backend Tests — aprovado (24 s)
- Frontend Tests — aprovado (9 s)
- Docker Build — aprovado (18 s)

Duração total exibida: **48 s**.

**Evidência recomendada:** salvar a captura em `docs/evidencias/github-actions-ci.png` e, se possível, incluir o link permanente da execução no GitHub:

`[Adicionar URL da execução AgroSmart CI #4]`

## 6. Critérios de aceite

- [x] Pelo menos cinco cenários automatizados identificados.
- [x] Suíte de backend executada localmente sem falhas (35 testes e 70 subtestes).
- [x] Pipeline de CI concluída com sucesso nos três jobs.
- [ ] Capturas de tela copiadas para `docs/evidencias/`.
- [ ] URL permanente da execução da pipeline adicionada.
- [ ] Relatório XML e saída textual anexados, se exigidos pelo professor.

## 7. Observações

A aprovação da suíte automatizada não substitui testes manuais de ponta a ponta em navegador, simulação real dos sensores ou auditoria completa de segurança. Os casos listados demonstram comportamentos específicos, não uma garantia absoluta de ausência de defeitos.

O fluxo de CI executa testes e build, mas **não representa implantação automática em produção**.
