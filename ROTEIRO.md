# Roteiro da dupla

Duração sugerida: 7 a 10 minutos. O PDF não determina duração. Ajustar se o professor orientar outro tempo.

## Antes da aula

1. Instalar Node.js 22+ e executar `npm ci` na pasta do projeto.
2. Executar `npm test` e `npm run demo` no computador da apresentação.
3. Abrir o PowerPoint e o VS Code com os três arquivos de `src`.
4. Aumentar a fonte do terminal e ensaiar a troca entre slides e código.
5. Publicar o projeto e o PPTX no GitHub, confirmar que a turma consegue acessar e levar uma cópia local.
6. Definir os nomes da dupla na apresentação, se desejarem. A capa usa apenas o tema para não inventar o nome do segundo integrante.

## Pessoa 1: conceito e configuração (3 a 4 minutos)

Slides 1 a 4. Explicar: um cliente relata que não conseguiu agendar. Os logs permitem identificar se houve conflito de horário ou falha interna.

Mostrar `logger.js`: criação do Pino, nível padrão `info`, timestamp e campos ocultados. Explicar que JSON separa informação em campos e permite filtragem por ferramentas.

Fala sugerida: “Usamos info para uma reserva criada, warn para uma tentativa de ocupar um horário já reservado e error para uma falha na operação. O nível mínimo controla o que aparece.”

## Pessoa 2: código e demonstração (3 a 4 minutos)

Slides 5 a 7. Mostrar `app.js`: logger filho com requestId, rota de criação e middleware de erro. Explicar que não é preciso criar um logger independente em cada rota.

Executar `npm run demo`. O script inicia uma API real em porta livre, faz chamadas HTTP e termina. Ler os resultados em ordem: 200, 201, 409 e 500. Procurar `agendamento_criado`, `horario_ocupado` e `falha_interna`.

Comparar o `requestId` da resposta com o evento de negócio e o evento `http_finalizado`. Na falha, mostrar que a stack fica no terminal, enquanto a resposta contém uma mensagem curta.

Opcional: iniciar `npm run dev`, abrir `/servicos` no navegador e mostrar o formato legível. Voltar a `npm start` para comparar com o JSON. Não executar ambos simultaneamente na porta 3000.

## Fechamento conjunto (1 minuto)

Slides 8 e 9. Comentar que dados pessoais e segredos não devem entrar nos logs. A demonstração não usa banco nem persiste reservas. Em um projeto real, adicionar o logger ao backend existente e configurar armazenamento e retenção dos registros.

## Perguntas prováveis

**Por que Pino?** A configuração é curta e a saída JSON torna os campos visíveis. O trabalho pede Pino ou Winston; basta demonstrar um deles.

**Pino corrige o erro?** Não. Registra informações para investigação. O tratamento do erro é feito pelo aplicativo.

**Qual é a diferença entre warn e error?** Aqui, warn indica um conflito previsto; error indica uma falha que impediu a operação. Essa classificação é uma decisão do projeto.

**Onde os logs ficam?** Na saída padrão do processo. É possível redirecionar para arquivo ou conectar um coletor. Pino não cria um painel de monitoramento sozinho.

**Por que existem dois logs por operação?** Um descreve o negócio e outro resume o HTTP. O requestId mostra que pertencem à mesma requisição.

**Por que debug não aparece?** O nível padrão é info. Definir LOG_LEVEL=debug permite os níveis debug e superiores.

## Conferência do enunciado

| Requisito | Material ou ação |
| --- | --- |
| Arquivo de apresentação Canva ou PPT | PPTX em `apresentacao/` |
| Código demonstrando o pacote | `src/` e `scripts/demo.js` |
| Explicar funcionamento do exemplo | Slides, README e este roteiro |
| Disponibilizar arquivos no Git | Pendente: publicar e compartilhar link |
| Projeto funcionando | Ensaiar no computador da aula |
| Participação nas apresentações | Responsabilidade da dupla |
| Apresentar no prazo | Confirmar 05/11 ou 12/11 com o professor |

## Publicar sem misturar com o UniBus

Esta pasta foi criada dentro do workspace atual, mas é um projeto independente. Copiem `trabalho-logging` para uma pasta fora do UniBus antes de iniciar um novo repositório. Não incluam `node_modules`, `.build`, arquivos `.log` ou `.env`.

Criem um repositório vazio no GitHub e, dentro da cópia independente, executem:

```sh
git init
git add .
git commit -m "Adiciona exemplo de logging com Pino e apresentação"
git branch -M main
git remote add origin URL_DO_REPOSITORIO_CRIADO
git push -u origin main
```

Substituir `URL_DO_REPOSITORIO_CRIADO` pelo endereço real. O arquivo ZIP entregue também pode ser extraído nessa nova pasta.
