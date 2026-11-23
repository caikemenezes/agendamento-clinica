import Database from "better-sqlite3";

// Caminho do arquivo do banco. Nos testes usamos ":memory:" (banco só em memória).
const DATABASE_PATH = process.env.DATABASE_PATH ?? "clinic.db";

export const db = new Database(DATABASE_PATH);

// Cria a tabela na primeira execução; nas seguintes não faz nada.
// date e time ficam no horário local da clínica (America/Sao_Paulo).
// UNIQUE (date, time) garante, no próprio banco, que um horário não seja
// reservado duas vezes, mesmo se duas pessoas confirmarem ao mesmo tempo.
db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name  TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    date          TEXT NOT NULL,
    time          TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE (date, time)
  )
`);
