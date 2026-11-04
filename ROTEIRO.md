# Roteiro da dupla

Duração sugerida: 7 a 10 minutos. O PDF não determina duração. Ajustar se o professor orientar outro tempo. A demonstração manual é opcional e deve substituir parte da demonstração automática se o tempo estiver curto.

## Antes da aula

1. Instalar Node.js 22+ e executar `npm ci` na pasta do projeto.
2. Executar `npm test` e `npm run demo` no computador da apresentação. Manter `LOG_LEVEL` no padrão `info` para mostrar os eventos previstos.
3. Abrir o PowerPoint atualizado, com os dois registros no slide 6, e o VS Code com os três arquivos de `src`. Colocar essa versão do PPTX na pasta `apresentacao/` do projeto antes de publicar.
4. Aumentar a fonte do terminal e ensaiar a troca entre slides e código. Se houver demonstração manual, preparar dois terminais: um para o servidor e outro para enviar a requisição.
5. Publicar o projeto e o PPTX no GitHub, confirmar que a turma consegue acessar e levar uma cópia local com as dependências já instaladas.
6. Inserir os nomes da dupla na apresentação, se desejarem, e confirmar a data da apresentação com o professor.

## Pessoa 1: conceito e configuração (3 a 4 minutos)

Slides 1 a 4. Explicar: um cliente relata que não conseguiu agendar. Os logs permitem identificar se houve conflito de horário ou falha interna.

Mostrar `src/logger.js`: criação do Pino, nível padrão `info`, timestamp e campos ocultados por `redact`. Explicar que JSON separa informação em campos e permite filtragem por ferramentas. A ocultação cobre apenas os caminhos configurados; segredos não devem ser escritos na mensagem.

Fala sugerida: “Usamos info para uma reserva criada, warn para uma tentativa de ocupar um horário já reservado e error para uma falha na operação. O nível mínimo controla o que aparece.”

## Pessoa 2: código e demonstração (3 a 4 minutos)

Slides 5 a 7. Mostrar `src/app.js`: logger filho com `requestId`, rota de criação e middleware de erro. Explicar que o logger filho acrescenta o contexto da requisição aos registros, sem precisar configurar um logger independente em cada rota. `src/server.js` inicia o servidor para uso manual; `scripts/demo.js` inicia uma API temporária, executa as chamadas e encerra.

No slide 6, comparar os dois registros abreviados da reserva de **10:00**: `agendamento_criado` informa a criação e `http_finalizado` resume a conclusão HTTP com status **201**. Ambos mostram o mesmo `requestId`:

```text
398ffce7-c62e-427f-8d52-664993498863
```

Esse identificador veio da execução usada no slide. Cada nova requisição recebe outro valor, e o servidor também o devolve no cabeçalho `X-Request-Id` da resposta.

Fala sugerida: “Uma única requisição gerou dois registros: um informa que o agendamento foi criado e o outro resume o resultado HTTP. O mesmo requestId permite relacionar os dois.”

No slide 7, executar:

```sh
npm run demo
```

O script inicia uma API real em porta livre, faz chamadas HTTP e termina. Ler os resultados em ordem: **200, 201, 409 e 500**. Procurar `agendamento_criado`, `horario_ocupado` e `falha_interna`. A demonstração automática reserva **09:00**; o slide 6 usa **10:00**, mas o mecanismo é o mesmo.

Comparar o `requestId` impresso pelo script, lido do cabeçalho da resposta, com o evento de negócio e o evento `http_finalizado`. Na falha simulada, mostrar que a stack fica no campo `err.stack` do log, enquanto a resposta contém uma mensagem curta. O status 500 dessa etapa é intencional. No JSON, as quebras de linha da stack aparecem escapadas como `\n`.

**Opcional: reproduzir manualmente o exemplo do slide 6.** No primeiro terminal PowerShell, iniciar o servidor na porta que funcionou no ensaio:

```powershell
$env:PORT = '39127'
npm start
```

Deixar esse terminal aberto. No segundo terminal, executar em uma linha:

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:39127/agendamentos' -Method Post -ContentType 'application/json' -Body '{"horario":"10:00"}'
```

Voltar ao primeiro terminal para mostrar `agendamento_criado` e `http_finalizado`, com status 201 e o mesmo `requestId`. Repetir a chamada gera 409 e os eventos `horario_ocupado` e `http_finalizado`. O PowerShell mostra essa resposta como erro porque o status não é 2xx; o conflito é esperado.

Abrir `/agendamentos` na barra do navegador envia GET e retorna 404, pois o exemplo só implementa POST nesse endereço. Para uma consulta no navegador, usar `http://127.0.0.1:39127/servicos`.

Para comparar a formatação, parar `npm start` com Ctrl+C e executar `npm run dev` no mesmo terminal. O `pino-pretty` torna os logs mais legíveis. Parar com Ctrl+C antes de voltar a `npm start`; não executar ambos simultaneamente na mesma porta.

Se aparecer `EADDRINUSE`, a porta está em uso. `EACCES` indica acesso negado, sem identificar sozinho a causa. Escolher outra porta disponível e ajustar a URL da chamada, ou usar `npm run demo`, que escolhe uma porta livre automaticamente. A porta 39127 também pode estar ocupada em outro computador.

Reiniciar o servidor limpa as reservas em memória. Cada execução de `npm run demo` já começa com uma agenda própria vazia. Depois do ensaio manual, encerrar o servidor e, se desejarem voltar ao padrão 3000 naquele terminal, executar `Remove-Item Env:PORT`.

## Fechamento conjunto (1 minuto)

Slides 8 e 9. Comentar que dados pessoais e segredos não devem entrar nos logs. A demonstração não usa banco nem persiste reservas após reiniciar. Em um projeto real, adicionar o logger ao backend existente e configurar armazenamento e retenção dos registros. Mostrar o link do repositório compartilhado com a turma.

## Perguntas prováveis

**Por que Pino?** A configuração é curta e a saída JSON torna os campos visíveis. O trabalho pede Pino ou Winston; basta demonstrar um deles.

**Pino corrige o erro?** Não. Registra informações para investigação. O tratamento do erro é feito pelo aplicativo.

**Qual é a diferença entre warn e error?** Aqui, warn indica um conflito previsto; error indica uma falha que impediu a operação. Essa classificação é uma decisão do projeto.

**Onde os logs ficam?** Neste exemplo, na saída padrão do processo. É possível redirecionar para arquivo ou conectar um coletor. Pino não cria um painel de monitoramento sozinho.

**Por que a criação gera dois logs?** Um descreve o negócio (`agendamento_criado`) e outro resume o HTTP (`http_finalizado`). O `requestId` mostra que pertencem à mesma requisição. Nem toda chamada gera dois registros visíveis: em `/servicos`, o evento de consulta é `debug` e fica oculto no nível padrão `info`.

**Onde encontro o requestId da resposta?** No cabeçalho `X-Request-Id`. O script de demonstração lê esse cabeçalho e imprime o valor. Ele não faz parte do corpo JSON da resposta.

**Por que debug não aparece?** O nível padrão é `info`. No PowerShell, definir `$env:LOG_LEVEL = 'debug'` antes de iniciar permite os níveis debug e superiores. Depois de parar o processo, executar `Remove-Item Env:LOG_LEVEL` para voltar ao padrão nas próximas execuções.

**Por que o navegador mostra “Rota não encontrada” em /agendamentos?** A barra de endereço envia GET, mas a criação exige POST com um corpo JSON. Usar o comando PowerShell do roteiro ou `npm run demo`.

**Por que aparece “Horário já reservado”?** Uma chamada anterior já reservou esse horário no servidor atual. Usar outro horário permitido ou reiniciar o servidor para limpar a agenda.

## Conferência do enunciado

| Requisito | Material ou ação |
| --- | --- |
| Arquivo de apresentação Canva ou PPT | PPTX atualizado em `apresentacao/` |
| Código demonstrando o pacote | `src/` e `scripts/demo.js` |
| Explicar funcionamento do exemplo | Slides, README e este roteiro |
| Disponibilizar arquivos no Git | Pendente: publicar e compartilhar link |
| Projeto funcionando | Executar `npm test` e ensaiar no computador da aula |
| Participação nas apresentações | Responsabilidade da dupla |
| Apresentar no prazo | Confirmar 05/11/2026 ou 12/11/2026 com o professor |

## Publicar como projeto independente

Usar uma pasta de `trabalho-logging` independente de outros repositórios. Se ela estiver dentro de outro projeto Git, copiar para uma pasta separada antes de iniciar um novo repositório. Não incluir `node_modules`, `.build`, arquivos `.log` ou `.env`. Conferir se o PPTX da pasta `apresentacao/` é a versão com o slide 6 atualizado.

Se a pasta ainda não tiver um repositório próprio, criar um repositório vazio no GitHub e, dentro da pasta independente, executar:

```sh
git init
git add .
git commit -m "Adiciona exemplo de logging com Pino e apresentação"
git branch -M main
git remote add origin URL_DO_REPOSITORIO_CRIADO
git push -u origin main
```

Substituir `URL_DO_REPOSITORIO_CRIADO` pelo endereço real. Se o repositório e o remoto já estiverem configurados, apenas registrar e enviar as alterações, sem repetir a criação do remoto. Conferir o acesso ao link compartilhado e incluí-lo no README e no último slide.
