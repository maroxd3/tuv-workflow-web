import { getDb, getPGlite } from "./client";
import {
  fahrzeug,
  halter,
  mangel,
  mangelKategorie,
  pruefart,
  pruefer,
  status,
  termin,
} from "./schema";
import * as q from "./queries";

async function allTables() {
  const db = await getDb();
  return {
    halter: await db.select().from(halter),
    fahrzeug: await db.select().from(fahrzeug),
    termin: await db.select().from(termin),
    mangel: await db.select().from(mangel),
    status: await db.select().from(status),
    pruefart: await db.select().from(pruefart),
    pruefer: await db.select().from(pruefer),
    mangelKategorie: await db.select().from(mangelKategorie),
  };
}

async function table(name: keyof Awaited<ReturnType<typeof allTables>>) {
  const tables = await allTables();
  console.table(tables[name]);
  return tables[name];
}

async function sql(query: string, params: unknown[] = []) {
  const pg = await getPGlite();
  const result = await pg.query(query, params);
  console.table(result.rows);
  return result;
}

export function installDbDebug() {
  const api = {
    all: allTables,
    table,
    sql,
    halter: q.listHalter,
    fahrzeuge: q.listFahrzeuge,
    termine: q.listTermine,
    maengelByTermin: q.listMangelByTermin,
  };

  Object.defineProperty(window, "tuvdb", {
    configurable: true,
    value: api,
  });

  console.info(
    "TUV DB debug ready. Try: await tuvdb.table('fahrzeug'), await tuvdb.all(), await tuvdb.sql('SELECT * FROM fahrzeug')",
  );
}

