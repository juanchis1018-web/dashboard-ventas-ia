// CONSOLA: registra ventas y las guarda en data/ventas.json
// Ejecutar con:  node cli.js
const readline = require('readline');
const fs = require('fs');

const ARCHIVO = __dirname + '/data/ventas.json';
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const preguntar = (texto) => new Promise((resolver) => rl.question(texto, resolver));

async function main() {
  console.log('=== REGISTRO DE VENTAS ===');
  let seguir = 's';
  while (seguir.toLowerCase() === 's') {
    const venta = {
      fecha: await preguntar('Mes (AAAA-MM, ej. 2026-10): '),
      producto: await preguntar('Producto (Electrónica / Ropa / Hogar): '),
      region: await preguntar('Región (Norte / Sur / Este / Oeste): '),
      unidades: Number(await preguntar('Unidades vendidas: ')),
      precio: Number(await preguntar('Precio unitario: ')),
    };

    if (!/^\d{4}-\d{2}$/.test(venta.fecha) || !venta.unidades || !venta.precio) {
      console.log('❌ Datos inválidos, intente de nuevo.\n');
      continue;
    }

    const ventas = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8'));
    ventas.push(venta);
    fs.writeFileSync(ARCHIVO, JSON.stringify(ventas, null, 1));
    console.log(`✅ Venta guardada. Total: $${venta.unidades * venta.precio}\n`);

    seguir = await preguntar('¿Registrar otra venta? (s/n): ');
  }
  rl.close();
}

main();
