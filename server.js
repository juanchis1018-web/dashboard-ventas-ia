// SERVIDOR: procesa los datos, aplica IA y los envía al dashboard
// Ejecutar con:  node server.js   y abrir http://localhost:3000
const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.static(__dirname + '/public'));

// Suma un valor agrupando por un campo (mes, producto o región)
function agrupar(ventas, campo) {
  const resultado = {};
  ventas.forEach((v) => {
    resultado[v[campo]] = (resultado[v[campo]] || 0) + v.unidades * v.precio;
  });
  return resultado;
}

// IA: regresión lineal (mínimos cuadrados) para pronosticar los próximos meses
function pronosticar(valores, meses = 3) {
  const n = valores.length;
  const x = valores.map((_, i) => i);
  const promX = x.reduce((a, b) => a + b, 0) / n;
  const promY = valores.reduce((a, b) => a + b, 0) / n;
  let arriba = 0, abajo = 0;
  x.forEach((xi, i) => {
    arriba += (xi - promX) * (valores[i] - promY);
    abajo += (xi - promX) ** 2;
  });
  const pendiente = arriba / abajo;
  const intercepto = promY - pendiente * promX;
  const futuro = [];
  for (let i = n; i < n + meses; i++) futuro.push(Math.round(intercepto + pendiente * i));
  return { futuro, pendiente };
}

app.get('/api/dashboard', (req, res) => {
  const ventas = JSON.parse(fs.readFileSync(__dirname + '/data/ventas.json', 'utf8'));

  const porMes = agrupar(ventas, 'fecha');
  const meses = Object.keys(porMes).sort();
  const valoresMes = meses.map((m) => porMes[m]);
  const porProducto = agrupar(ventas, 'producto');
  const porRegion = agrupar(ventas, 'region');

  const total = valoresMes.reduce((a, b) => a + b, 0);
  const ia = pronosticar(valoresMes);

  // IA: recomendaciones automáticas a partir de los datos
  const mejorProducto = Object.keys(porProducto).sort((a, b) => porProducto[b] - porProducto[a])[0];
  const peorRegion = Object.keys(porRegion).sort((a, b) => porRegion[a] - porRegion[b])[0];
  const recomendaciones = [
    ia.pendiente > 0
      ? `Las ventas crecen unos $${Math.round(ia.pendiente).toLocaleString()} por mes. Prepare más inventario.`
      : 'Las ventas están bajando. Revise precios y haga promociones.',
    `"${mejorProducto}" es el producto que más vende: priorícelo en campañas.`,
    `La región ${peorRegion} es la que menos vende: es una oportunidad de expansión.`,
  ];

  res.json({
    total,
    numVentas: ventas.length,
    promedioMes: Math.round(total / meses.length),
    meses, valoresMes,
    pronostico: ia.futuro,
    porProducto, porRegion,
    recomendaciones,
  });
});

app.listen(process.env.PORT || 3000, () => console.log('Dashboard en http://localhost:3000'));
