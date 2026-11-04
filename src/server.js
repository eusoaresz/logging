import { criarApp } from './app.js';
import { criarLogger } from './logger.js';

const logger = criarLogger();
const porta = Number(process.env.PORT || 3000);
const server = criarApp(logger).listen(porta, '127.0.0.1', () => {
  logger.info({ porta }, 'API pronta em http://127.0.0.1:' + porta);
});
server.on('error', (err) => {
  logger.fatal({ err }, 'Não foi possível iniciar a API');
  process.exitCode = 1;
});
