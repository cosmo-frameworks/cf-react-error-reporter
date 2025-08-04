const fs = require('fs');
const path = require('path');

const COVERAGE_PATH = path.join(__dirname, 'coverage', 'coverage-final.json');
const THRESHOLD = 80;

if (!fs.existsSync(COVERAGE_PATH)) {
  console.error('❌ No se encontró coverage-final.json. Asegúrate de ejecutar primero los tests con cobertura.');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(COVERAGE_PATH, 'utf-8'));

let totals = {
  lines: { total: 0, covered: 0 },
  functions: { total: 0, covered: 0 },
  statements: { total: 0, covered: 0 },
  branches: { total: 0, covered: 0 },
};

//Sumar cobertura global desde todos los archivos
for (const file in raw) {
  const data = raw[file];
  if (!data) continue;

  totals.statements.total += Object.keys(data.statementMap || {}).length;
  totals.statements.covered += Object.values(data.s || {}).filter(Boolean).length;

  totals.functions.total += Object.keys(data.fnMap || {}).length;
  totals.functions.covered += Object.values(data.f || {}).filter(Boolean).length;

  totals.branches.total += Object.values(data.branchMap || {}).reduce((acc, b) => acc + b.locations.length, 0);
  totals.branches.covered += Object.values(data.b || {}).flat().filter(Boolean).length;

  totals.lines.total += Object.keys(data.statementMap || {}).length; // Approximation
  totals.lines.covered += Object.values(data.s || {}).filter(Boolean).length;
}

//Calcular porcentaje por tipo
const percentages = Object.fromEntries(
  Object.entries(totals).map(([metric, { total, covered }]) => [
    metric,
    total > 0 ? (covered / total) * 100 : 100,
  ])
);

//Revisar si alguna métrica está por debajo del 80%
const failed = Object.entries(percentages).filter(([, pct]) => pct < THRESHOLD);

if (failed.length > 0) {
  console.error(`❌ La cobertura no cumple con el umbral del ${THRESHOLD}%:`);
  failed.forEach(([metric, pct]) => {
    console.log(`   - ${metric}: ${pct.toFixed(2)}%`);
  });
  process.exit(1);
}

console.log('✅ Cobertura mínima alcanzada. Se permite publicar.');
