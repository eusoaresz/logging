# Logging em Node.js com Pino

Trabalho 2 de Programação Full Stack, tema 11. Exemplo pequeno de uma agenda de barbearia, inspirado no domínio do [Corte Fino](https://github.com/eusoaresz/corte_fino). O código desta demonstração foi escrito do zero: não é uma cópia do sistema completo.

## Executar

Requisito: Node.js 22 ou superior e npm. Na pasta deste projeto:

```sh
npm ci
npm run demo
```

Esse comando abre uma API temporária em uma porta livre, executa quatro requisições e encerra. Não precisa de banco, Docker, conta ou servidor já aberto. A internet só é necessária para instalar as dependências.

Para testar manualmente, inicie a API:

```sh
npm run dev
```

O terminal mostra logs formatados pelo `pino-pretty`. Acesse `http://127.0.0.1:3000/servicos` ou envie as chamadas de `requisicoes.http` com a extensão REST Client do VS Code. Também pode usar Postman ou os comandos abaixo em outro PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/servicos
Invoke-RestMethod http://127.0.0.1:3000/agendamentos -Method Post -ContentType 'application/json' -Body '{"horario":"09:00"}'
```

Repetir o segundo comando gera HTTP 409. O PowerShell apresenta essa resposta como erro porque o status não é 2xx. Abrir `http://127.0.0.1:3000/demo/erro` gera HTTP 500 intencional.

Para JSON original: `npm start`. Para salvar logs JSON, use `node src/server.js > exemplo.log`. Pare com Ctrl+C. O log escrito em arquivo não tem rotação automática neste exemplo.

Para mostrar `debug` no PowerShell:

```powershell
$env:LOG_LEVEL = 'debug'
npm run dev
# Depois de encerrar com Ctrl+C:
Remove-Item Env:LOG_LEVEL
```

Se a porta 3000 estiver ocupada, use `$env:PORT = '3001'` antes de iniciar a API. A demonstração automática escolhe uma porta livre sozinha.

## O que o exemplo ensina

Logging é registrar eventos da execução para entender o que aconteceu e investigar falhas. `console.log` é útil para depuração simples; Pino oferece níveis, registros estruturados, contexto compartilhado e ocultação de campos.

| Cenário | HTTP | Log de negócio |
| --- | --- | --- |
| Listar serviços | 200 | `debug` para a consulta, oculto no nível padrão |
| Criar agendamento | 201 | `info`: operação normal |
| Repetir horário | 409 | `warn`: conflito esperado |
| Informar horário inválido | 400 | `warn`: entrada inválida |
| Simular falha | 500 | `error`: erro com stack trace |

Além desses eventos, o middleware registra a conclusão de cada requisição com status e duração. Um agendamento bem-sucedido gera dois registros com o mesmo `requestId`: o evento de negócio e a conclusão HTTP. São eventos diferentes da mesma chamada.

Níveis Pino: `trace` 10, `debug` 20, `info` 30, `warn` 40, `error` 50 e `fatal` 60. Com `LOG_LEVEL=info`, entram os níveis de 30 para cima. `fatal` é usado se o servidor não conseguir iniciar. Não é necessário demonstrar todos os níveis para explicar o funcionamento básico.

## Leitura do código

1. `src/logger.js`: cria Pino, define nível, data ISO e campos que devem ser ocultados.
2. `src/app.js`: middleware cria `requestId` e `logger.child`; rotas registram eventos; tratamento central registra erros.
3. `src/server.js`: inicia o servidor local.
4. `scripts/demo.js`: faz as quatro chamadas reais à API em sequência.
5. `test/app.test.js`: confere respostas, níveis, correlação e ocultação de dados.

Exemplo central:

```js
req.log.info({ evento: 'agendamento_criado', agendamentoId, horario }, 'Agendamento criado');
```

O primeiro argumento contém campos pesquisáveis. O segundo é a mensagem para leitura humana. O exemplo acima é uma versão abreviada; veja a chamada completa na rota.

Pino gera JSON no terminal. `pino-pretty` apenas muda a apresentação no desenvolvimento. Guardar, centralizar, buscar e definir retenção dos registros depende da infraestrutura escolhida.

Não registramos corpos, cabeçalhos, nomes ou telefones de clientes. `redact` é uma proteção extra para os caminhos configurados, não um detector geral de segredos. Nunca escreva senhas dentro da mensagem de texto.

## Escopo didático

Uma agenda, um serviço e seis horários fixos, sem data ou barbeiros diferentes. Os dados ficam em memória e somem ao reiniciar. A rota de falha existe somente para a aula. Este exemplo não é um sistema de agendamento pronto para produção.

Optamos pelo exemplo independente para concentrar a apresentação no pacote. Transferbid e Corte Fino podem receber o mesmo padrão de logger e middleware posteriormente, mas exigem suas configurações de banco e autenticação para executar o sistema completo.

## Verificar

```sh
npm test
npm run demo
```

## Entrega e apresentação

- Apresentação: `apresentacao/logging-node-pino.pptx`.
- Roteiro com divisão da dupla: `ROTEIRO.md`.
- Código e instruções: esta pasta, sem `node_modules`.
- Publicar os arquivos em um repositório e enviar o link para a turma.
- Confirmar a data da dupla entre 05/11/2026 e 12/11/2026 e participar das apresentações dos colegas.

A publicação no GitHub e a participação em aula dependem da dupla. O repositório público desta entrega ainda não foi criado.

## Fontes

- [Pino: documentação e instalação](https://github.com/pinojs/pino)
- [API: níveis, child logger e serialização](https://github.com/pinojs/pino/blob/main/docs/api.md)
- [Ocultação de campos](https://github.com/pinojs/pino/blob/main/docs/redaction.md)
- [Pino Pretty](https://github.com/pinojs/pino-pretty)
- [Express: tratamento de erros](https://expressjs.com/en/guide/error-handling.html)
- [Corte Fino: referência de domínio](https://github.com/eusoaresz/corte_fino)
- [Transferbid: alternativa avaliada](https://github.com/arthurhlzt/transferbid)

Requisitos conferidos no enunciado `trab2_262.pdf`, fornecido pelo aluno.
