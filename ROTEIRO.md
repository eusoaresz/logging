# Roteiro da apresentação — Logging em Node.js com Pino

**Dupla:** Arthur Holz e Roger Soares.  
**Slides:** [logging-node-pino-atualizado.pptx](apresentacao/logging-node-pino-atualizado.pptx).  
**Material:** [github.com/eusoaresz/logging](https://github.com/eusoaresz/logging).

Duração sugerida: 8 a 10 minutos. Ajustar conforme a orientação do professor. A divisão abaixo usa Pessoa 1 e Pessoa 2 para que Arthur e Roger escolham suas partes. As explicações acompanham os nove slides; os trechos de código servem como apoio, sem necessidade de ler o arquivo inteiro.

## Preparação antes da aula

1. Com Node.js 22 ou superior, executar `npm ci`, `npm test` e `npm run demo` na pasta do projeto, no computador da apresentação.
2. Manter `LOG_LEVEL` no padrão `info`. Se houver um valor configurado no PowerShell, removê-lo com `Remove-Item Env:LOG_LEVEL` antes de iniciar, quando a variável existir.
3. Abrir o PPTX indicado acima e o VS Code com `src/logger.js`, `src/app.js` e `scripts/demo.js`. Aumentar a fonte do terminal.
4. Ensaiar a sequência esperada: **200, 201, 409 e 500**. O 500 é a falha planejada da demonstração.
5. Confirmar o compartilhamento do repositório com a turma e o acesso dos colegas. Levar uma cópia local com as dependências instaladas.
6. Confirmar com o professor a data da dupla entre 05/11/2026 e 12/11/2026. Os nomes de Arthur Holz e Roger Soares já aparecem no slide 1.

## Pessoa 1 — slides 1 a 4: conceito e níveis (3 minutos)

### Slide 1 — Logging em Node.js

Apresentar a dupla, o tema e a escolha do Pino. O exemplo é uma pequena API de agenda de barbearia, inspirada no domínio do Corte Fino, sem depender do sistema completo.

**Fala sugerida:** “Vamos mostrar como registrar o que acontece no backend. Nossa agenda permite observar uma reserva criada, uma tentativa de reservar o mesmo horário e uma falha simulada.”

### Slide 2 — Para que servem os logs?

Usar a situação de um cliente que não conseguiu agendar. O registro permite descobrir qual operação ocorreu, qual foi a resposta e se houve conflito ou falha interna. O exemplo também registra a duração de cada requisição.

**Fala sugerida:** “A mensagem do cliente informa o problema percebido. Os logs ajudam a localizar a requisição e entender o que aconteceu dentro da aplicação.”

### Slide 3 — Pino e os registros estruturados

Apontar os campos do JSON ilustrativo:

| Campo | Significado |
| --- | --- |
| `level` | Gravidade do registro; 30 corresponde a `info` |
| `evento` | Tipo de acontecimento, como `agendamento_criado` |
| `requestId` | Identificador que relaciona os registros da mesma requisição |
| `msg` | Mensagem para leitura humana |

**Fala sugerida:** “Cada informação fica em um campo. Isso permite buscar um evento ou filtrar todos os registros de uma requisição. O JSON do slide é ilustrativo e mostra apenas alguns campos.”

### Slide 4 — Níveis de log

| Nível | Uso no código |
| --- | --- |
| `debug` — 20 | Detalhe da consulta de serviços |
| `info` — 30 | Agendamento criado |
| `warn` — 40 | Horário ocupado ou entrada inválida |
| `error` — 50 | Falha interna simulada |

O padrão `info` permite `info`, `warn`, `error` e `fatal`; oculta `debug` e `trace`. Pino também oferece `trace` (10) e `fatal` (60). No projeto, `fatal` registra falha ao iniciar o servidor.

**Transição:** “Agora vamos ver onde esses registros são configurados e como acompanham uma requisição.”

## Pessoa 2 — slides 5 a 7: código e demonstração (4 a 5 minutos)

### Slide 5 — A estrutura do exemplo

Mostrar rapidamente os arquivos e explicar apenas as responsabilidades principais.

| Arquivo | Responsabilidade |
| --- | --- |
| `src/logger.js` | Cria e configura o logger Pino |
| `src/app.js` | Define middleware, rotas e tratamento de erros |
| `src/server.js` | Abre o servidor para uso manual |
| `scripts/demo.js` | Inicia uma API temporária e executa quatro requisições reais |
| `test/app.test.js` | Verifica respostas HTTP e conteúdo dos registros |

#### 1. Configuração do logger — `src/logger.js`

```js
level: process.env.LOG_LEVEL || 'info',
base: { app: 'corte-fino-demo' },
timestamp: pino.stdTimeFunctions.isoTime,
redact: ['senha', 'token', 'cliente.telefone', 'cliente.email'],
```

`LOG_LEVEL` permite mudar o nível mínimo sem editar o código. `base` identifica a aplicação nos registros e `timestamp` usa data e hora em formato ISO. `redact` oculta valores nos caminhos estruturados configurados, caso sejam registrados. A aplicação não registra automaticamente o corpo das requisições.

**Fala sugerida:** “Configuramos o logger uma vez. Ele acrescenta informações comuns aos registros e protege campos específicos. Essa proteção não identifica qualquer segredo escrito livremente em uma mensagem.”

#### 2. Criação da aplicação e agenda — `src/app.js`

`criarApp(logger)` recebe o logger e devolve a aplicação Express. A agenda é um `Map` criado dentro dessa função: cada aplicação tem suas próprias reservas. Reiniciar o servidor apaga os dados.

`express.json({ limit: '10kb' })` interpreta o corpo JSON e limita seu tamanho. Na rota POST `/agendamentos`, o código valida se `horario` pertence aos horários permitidos, verifica se já está reservado e só então salva a reserva.

```js
if (agendamentos.has(horario)) {
  req.log.warn({ evento: 'horario_ocupado', horario }, 'Tentativa de reservar horário ocupado');
  return res.status(409).json({ erro: 'Horário já reservado.' });
}
```

O `return` encerra esse caminho da rota, evitando que um horário ocupado seja salvo novamente. Uma reserva válida recebe um identificador, entra no `Map`, gera um registro `info` e retorna HTTP 201. Uma entrada inválida retorna 400 com `warn`.

**Fala sugerida:** “A regra de negócio decide o resultado da reserva. O logger registra essa decisão: criação normal usa info e conflito de horário usa warn.”

### Slide 6 — Uma requisição, um identificador

Mostrar o início do middleware em `src/app.js`:

```js
const inicio = performance.now();
const requestId = randomUUID();
req.log = logger.child({ requestId, metodo: req.method });
res.setHeader('X-Request-Id', requestId);
```

O middleware executa antes das rotas. `randomUUID()` gera um identificador para cada requisição. `logger.child` herda a configuração do logger principal e acrescenta `requestId` e método HTTP aos registros feitos com `req.log`. O cabeçalho devolve esse identificador ao cliente.

O slide abrevia a chamada para `logger.child({ requestId })`; o código também inclui `metodo`.

Mostrar em seguida o papel de `res.on('finish', ...)`: quando a resposta termina, o código registra `http_finalizado`, com status, rota e duração. A diferença entre `performance.now()` no início e no fim mede o tempo em milissegundos. O status define o nível desse registro: 500 ou superior usa `error`, 400 a 499 usa `warn` e os demais usam `info`.

Comparar os dois eventos do slide, referentes à reserva de **10:00**:

- `agendamento_criado`: descreve o resultado do negócio.
- `http_finalizado`, status 201: descreve a conclusão HTTP.

Ambos têm o mesmo `requestId`. O UUID mostrado no slide é um exemplo fixo; novos pedidos recebem outros valores. Duas tentativas de reservar o mesmo horário têm identificadores diferentes, porque são requisições diferentes.

**Fala sugerida:** “Os registros não são duplicados: cada um informa uma parte da operação. O requestId permite juntá-los e acompanhar uma requisição do começo ao resultado.”

### Slide 7 — Demonstração ao vivo

Executar:

```sh
npm run demo
```

| Etapa | Requisição | Resultado | O que mostrar no log |
| --- | --- | --- | --- |
| 1 | GET `/servicos` | 200 | `http_finalizado`; a consulta em `debug` fica oculta no padrão |
| 2 | POST `/agendamentos`, horário 09:00 | 201 | `agendamento_criado` em `info` e conclusão HTTP |
| 3 | Repetir a reserva de 09:00 | 409 | `horario_ocupado` em `warn` e conclusão HTTP |
| 4 | GET `/demo/erro` | 500 | `falha_interna` em `error`, com `err.stack`, e conclusão HTTP |

Na segunda etapa, comparar o `requestId` impresso pelo script com os dois registros da reserva. Na quarta, comparar o erro detalhado do log com a resposta curta enviada ao cliente.

#### 3. Tratamento central de erros — `src/app.js`

A rota `/demo/erro` lança um `Error` propositalmente. O Express encaminha a falha ao middleware com assinatura `(err, req, res, next)`.

```js
req.log.error({ err, evento: 'falha_interna' }, 'Não foi possível concluir a operação');
return res.status(500).json({ erro: 'Erro interno demonstrativo.' });
```

O objeto `err` permite ao Pino registrar os detalhes do erro, incluindo a stack trace, que indica por onde ele passou no código. A resposta não devolve essa stack. O mesmo middleware trata JSON malformado com 400 e corpo muito grande com 413.

**Fala sugerida:** “O logger registra os detalhes para investigar a falha. Quem define a resposta HTTP é o tratamento de erros da aplicação. O Pino não corrige o erro.”

#### 4. Como a demonstração funciona — `scripts/demo.js`

`listen(0, '127.0.0.1')` solicita uma porta livre ao sistema. Após o servidor iniciar, o script usa `fetch` para executar as quatro chamadas em sequência, mostra status, corpo e `X-Request-Id`, e confere o status esperado. O bloco `finally` encerra o servidor mesmo se uma etapa falhar. Por isso cada execução começa com uma agenda vazia e não exige abrir a API antes.

O script usa `console.error` para imprimir os resultados auxiliares na saída de erro; isso não significa que todas as etapas falharam. Os registros estruturados da API continuam sendo produzidos pelo Pino.

A demonstração usa **09:00** e o slide 6 mostra **10:00**. O comportamento é o mesmo; os valores não precisam coincidir.

## Fechamento conjunto — slides 8 e 9 (1 a 2 minutos)

### Slide 8 — Cuidados e limites

Reforçar três pontos:

1. Evitar senhas e dados pessoais. `redact` protege apenas os caminhos configurados; não sanitiza qualquer texto da mensagem.
2. Pino produz JSON na saída padrão. `pino-pretty`, usado por `npm run dev`, muda a formatação para facilitar a leitura. Armazenamento, rotação e retenção exigem configuração adicional.
3. O exemplo é didático: agenda em memória, horários fixos e falha simulada, sem persistência das reservas.

**Fala sugerida:** “Para usar esse padrão em um sistema real, precisamos escolher quais eventos registrar, proteger os dados e definir onde guardar e por quanto tempo manter os registros.”

### Slide 9 — Referências e material da turma

Apontar a documentação oficial do Pino e do Pino Pretty. Abrir ou mostrar o endereço do repositório, pois o slide menciona o material no Git sem exibir a URL completa:

**https://github.com/eusoaresz/logging**

**Fala sugerida:** “O repositório reúne o código, as instruções, o roteiro e a apresentação. Com esse exemplo, vimos como registrar eventos, classificar a gravidade e relacionar os registros de uma mesma requisição.”

## Apoio para perguntas — não precisa apresentar tudo

**O que o teste verifica?** `test/app.test.js` inicia uma API temporária e captura os logs em memória. Confere respostas HTTP, níveis de criação/conflito/erro, a correlação pelo `requestId`, a presença da stack no log e a ocultação de alguns campos sensíveis. Executar `npm test` antes da aula; a existência do arquivo não comprova uma execução bem-sucedida.

**Por que há log em uma consulta se debug está oculto?** O evento de negócio da consulta usa `debug`, mas a conclusão HTTP com status 200 usa `info`. O segundo continua visível.

**Onde encontro o requestId?** No campo dos registros e no cabeçalho `X-Request-Id` da resposta. Não faz parte do corpo JSON da resposta.

**Como mostrar debug?** No PowerShell:

```powershell
$env:LOG_LEVEL = 'debug'
npm run dev
Remove-Item Env:LOG_LEVEL
```

**Por que abrir /agendamentos no navegador dá 404?** A barra de endereço envia GET, mas a criação exige POST com JSON. Para consultar no navegador, abrir `/servicos`.

**Por que o 409 aparece como erro no PowerShell?** Respostas fora de 2xx são apresentadas dessa forma pela ferramenta. Aqui, o conflito é esperado.

## Demonstração manual opcional

Usar apenas se houver tempo ou se for necessário explicar melhor a correlação. No primeiro terminal PowerShell:

```powershell
$env:PORT = '39127'
npm start
```

No segundo terminal:

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:39127/agendamentos' -Method Post -ContentType 'application/json' -Body '{"horario":"10:00"}'
```

Voltar ao primeiro terminal e localizar os eventos da criação e da conclusão HTTP com o mesmo `requestId`. Repetir a chamada gera 409. Reiniciar a API limpa as reservas.

Se a porta estiver ocupada (`EADDRINUSE`), escolher outra e ajustar a URL ou usar `npm run demo`. Não abrir `npm start` e `npm run dev` simultaneamente na mesma porta. Ao terminar, encerrar com Ctrl+C e executar `Remove-Item Env:PORT` no terminal em que a variável foi definida.

## Entrega e atualização do repositório

O repositório já existe em [eusoaresz/logging](https://github.com/eusoaresz/logging). Não é necessário executar `git init` nem criar outro remoto. Confirmar o envio do link à turma, a execução no computador da aula e a presença nas apresentações dos colegas.

Para as correções combinadas, usar a mensagem de commit:

```text
Ajuste de Readme e conteúdo da apresentação
```

Revisar as alterações e confirmar antes de enviá-las ao GitHub. O acesso de escrita da integração é uma configuração da conta, não uma mudança no código. Este roteiro não pressupõe que essa permissão já foi concedida.
