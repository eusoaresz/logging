import pino from 'pino';

export function criarLogger(destination) {
  return pino({
    level: process.env.LOG_LEVEL || 'info',
    base: { app: 'corte-fino-demo' },
    timestamp: pino.stdTimeFunctions.isoTime,
    // Proteção extra para campos estruturados. Nunca colocar segredos na mensagem.
    redact: ['senha', 'token', 'cliente.telefone', 'cliente.email'],
  }, destination);
}
