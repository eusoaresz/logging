import express from 'express';
import { randomUUID } from 'node:crypto';

export function criarApp(logger) {
  const app = express();
  const agendamentos = new Map();

  app.use((req, res, next) => {
    const inicio = performance.now();
    const requestId = randomUUID();
    req.log = logger.child({ requestId, metodo: req.method });
    res.setHeader('X-Request-Id', requestId);
    res.on('finish', () => {
      const nivel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
      req.log[nivel]({
        evento: 'http_finalizado',
        rota: req.route?.path || 'rota_nao_encontrada',
        status: res.statusCode,
        duracaoMs: Number((performance.now() - inicio).toFixed(2)),
      }, 'Requisição finalizada');
    });
    next();
  });

  app.use(express.json({ limit: '10kb' }));

  app.get('/servicos', (req, res) => {
    req.log.debug({ evento: 'consulta_servicos' }, 'Consultando serviços em memória');
    res.json([{ id: 1, nome: 'Corte de cabelo', preco: 35 }]);
  });

  app.post('/agendamentos', (req, res) => {
    const { horario } = req.body || {};
    if (typeof horario !== 'string' || !/^(09|10|11|14|15|16):00$/.test(horario)) {
      req.log.warn({ evento: 'dados_invalidos' }, 'Horário inválido');
      return res.status(400).json({ erro: 'Use 09:00, 10:00, 11:00, 14:00, 15:00 ou 16:00.' });
    }
    if (agendamentos.has(horario)) {
      req.log.warn({ evento: 'horario_ocupado', horario }, 'Tentativa de reservar horário ocupado');
      return res.status(409).json({ erro: 'Horário já reservado.' });
    }
    const agendamento = { id: randomUUID(), horario, servicoId: 1 };
    agendamentos.set(horario, agendamento);
    req.log.info({ evento: 'agendamento_criado', agendamentoId: agendamento.id, horario }, 'Agendamento criado');
    return res.status(201).json(agendamento);
  });

  app.get('/demo/erro', () => {
    throw new Error('Falha simulada ao consultar a agenda');
  });

  app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      req.log.warn({ evento: 'json_invalido' }, 'Corpo JSON inválido');
      return res.status(400).json({ erro: 'JSON inválido.' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ erro: 'Corpo da requisição muito grande.' });
    }
    req.log.error({ err, evento: 'falha_interna' }, 'Não foi possível concluir a operação');
    return res.status(500).json({ erro: 'Erro interno demonstrativo.' });
  });
  return app;
}
