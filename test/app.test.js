import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { Writable } from 'node:stream';
import { criarApp } from '../src/app.js';
import { criarLogger } from '../src/logger.js';

test('fluxo HTTP, níveis, correlação e proteção de campos sensíveis', async () => {
  let saida = '';
  const logger = criarLogger(new Writable({ write(chunk, encoding, callback) { saida += chunk; callback(); } }));
  const server = criarApp(logger).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = body => fetch(base + '/agendamentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.equal((await fetch(base + '/servicos')).status, 200);
    const criado = await post({ horario: '09:00' });
    assert.equal(criado.status, 201);
    const id = criado.headers.get('x-request-id');
    assert.ok(id);
    assert.equal((await post({ horario: '09:00' })).status, 409);
    assert.equal((await post({ horario: '99:00' })).status, 400);
    assert.equal((await post(null)).status, 400);
    const falha = await fetch(base + '/demo/erro');
    assert.equal(falha.status, 500);
    assert.deepEqual(await falha.json(), { erro: 'Erro interno demonstrativo.' });
    assert.equal((await fetch(base + '/inexistente')).status, 404);
    const invalido = await fetch(base + '/agendamentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    assert.equal(invalido.status, 400);
    logger.info({ senha: 'segredo123', cliente: { telefone: '51999999999', email: 'privado@example.com' } }, 'Exemplo de redação');
    const logs = saida.trim().split('\n').map(JSON.parse);
    assert.ok(logs.some(l => l.evento === 'agendamento_criado' && l.level === 30 && l.requestId === id));
    assert.ok(logs.some(l => l.evento === 'http_finalizado' && l.status === 201 && l.requestId === id));
    assert.ok(logs.some(l => l.evento === 'horario_ocupado' && l.level === 40));
    assert.ok(logs.some(l => l.evento === 'falha_interna' && l.level === 50 && l.err.stack));
    assert.ok(!saida.includes('segredo123') && !saida.includes('51999999999') && !saida.includes('privado@example.com'));
  } finally { await new Promise(resolve => server.close(resolve)); }
});
