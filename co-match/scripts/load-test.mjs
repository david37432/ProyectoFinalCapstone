#!/usr/bin/env node
/**
 * Prueba de carga básica (sin dependencias): lanza N usuarios virtuales concurrentes
 * contra varias rutas durante X segundos y reporta latencias y errores.
 *
 * Uso:
 *   node scripts/load-test.mjs https://tu-app.vercel.app [usuarios=20] [segundos=20]
 *
 * Criterio de aceptación (falla con exit 1 si no se cumple):
 *   - tasa de error < 1 %
 *   - p95 < 1500 ms
 * Se pueden ajustar con MAX_ERROR_RATE y MAX_P95_MS.
 */
const [baseArg, usersArg = '20', secondsArg = '20'] = process.argv.slice(2);
if (!baseArg) {
  console.error('Uso: node scripts/load-test.mjs <url-base> [usuarios] [segundos]');
  process.exit(2);
}

const base = baseArg.replace(/\/+$/, '');
const users = Number(usersArg);
const durationMs = Number(secondsArg) * 1000;
const maxErrorRate = Number(process.env.MAX_ERROR_RATE ?? 0.01);
const maxP95 = Number(process.env.MAX_P95_MS ?? 1500);

// Rutas públicas; las del dashboard redirigen al login (también cuenta como respuesta válida)
const paths = ['/', '/auth/login', '/auth/register', '/privacidad', '/terminos', '/reportar', '/dashboard/estudiante/explorar'];

const latencies = [];
let errors = 0;
const byStatus = {};
const deadline = Date.now() + durationMs;

async function worker(id) {
  let i = id;
  while (Date.now() < deadline) {
    const path = paths[i++ % paths.length];
    const t0 = performance.now();
    try {
      const res = await fetch(base + path, { redirect: 'follow' });
      await res.arrayBuffer();
      latencies.push(performance.now() - t0);
      byStatus[res.status] = (byStatus[res.status] ?? 0) + 1;
      if (res.status >= 500) errors++;
    } catch {
      latencies.push(performance.now() - t0);
      errors++;
      byStatus.network = (byStatus.network ?? 0) + 1;
    }
  }
}

console.log(`Carga: ${users} usuarios x ${durationMs / 1000}s contra ${base}`);
const t0 = performance.now();
await Promise.all(Array.from({ length: users }, (_, i) => worker(i)));
const elapsed = (performance.now() - t0) / 1000;

latencies.sort((a, b) => a - b);
const pct = (p) => latencies[Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length))] ?? 0;
const total = latencies.length;
const errorRate = total ? errors / total : 1;

console.log(`Peticiones: ${total} (${(total / elapsed).toFixed(1)} req/s)`);
console.log(`Estados:`, byStatus);
console.log(`Latencia ms -> p50 ${pct(50).toFixed(0)} | p95 ${pct(95).toFixed(0)} | p99 ${pct(99).toFixed(0)} | max ${(latencies.at(-1) ?? 0).toFixed(0)}`);
console.log(`Errores: ${errors} (${(errorRate * 100).toFixed(2)} %)`);

const ok = errorRate <= maxErrorRate && pct(95) <= maxP95;
console.log(ok ? 'RESULTADO: OK' : `RESULTADO: FALLÓ (límites: error ${maxErrorRate * 100} %, p95 ${maxP95} ms)`);
process.exit(ok ? 0 : 1);
