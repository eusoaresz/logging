// Servidor temporário e isolado: cada execução começa com a agenda vazia.
import { once } from 'node:events';
import { criarApp } from '../src/app.js';
import { criarLogger } from '../src/logger.js';

const server = criarApp(criarLogger()).listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;
const etapas = [
  ['Listar serviços', '/servicos', undefined, 200],
  ['Reservar 09:00', '/agendamentos', { horario: '09:00' }, 201],
  ['Repetir 09:00', '/agendamentos', { horario: '09:00' }, 409],
  ['Simular falha', '/demo/erro', undefined, 500],
];
try {
  for (const [titulo, rota, body, esperado] of etapas) {
    const resposta = await fetch(base + rota, body ? {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    } : undefined);
    console.error(`\n${titulo}: HTTP ${resposta.status} (esperado ${esperado})`);
    console.error('requestId:', resposta.headers.get('x-request-id'));
    console.error(await resposta.text());
    if (resposta.status !== esperado) throw new Error('Resultado inesperado');
  }
} finally {
  await new Promise(resolve => server.close(resolve));
}
