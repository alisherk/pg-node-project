import { PoolClient } from "pg";
import * as R from "ramda";


interface RelationOptions {
  table: string;
  column: string;
}

interface ColumnOptions {
  name: string; // column name in postgres
  type: string; // text, float8, etc.
  required?: boolean; // NOT NULL
  default?: string; // DEFAULT false
  id?: boolean; // PRIMARY KEY
  relation?: RelationOptions;
  key?: string; // when {name} does not match with name from sheet
  validate?: (value: string) => boolean; // skip row when at least one column is not valid
  transform?: (value: string) => any; // when value from sheet should be modified
}

interface InsertOptions {
  name: string;
  tableName: string;
  columns: ColumnOptions[];
}

async function insert(
  client: PoolClient,
  { name, tableName, columns }: InsertOptions
) {
  const createColumns = columns
    .flatMap(
      ({ name, type, required, default: defaultValue, id, relation }) => {
        const column = R.unnest([
          [`"${name}"`],
          [type],
          required ? ["NOT NULL"] : [],
          defaultValue ? [`DEFAULT ${defaultValue}`] : [],
          id ? ["PRIMARY KEY"] : [],
        ]).join(" ");
        return relation
          ? [
              column,
              `CONSTRAINT "${tableName}_${name}_fkey" FOREIGN KEY ("${name}") REFERENCES "${relation.table}"("${relation.column}") ON DELETE CASCADE ON UPDATE CASCADE`,
            ]
          : column;
      }
    )
    .join();
    
  await client.query(`CREATE TABLE "${tableName}" (${createColumns});`);

  const tempTableName = `${tableName}Raw`;

  await client.query(`CREATE TABLE "${tempTableName}" (LIKE "${tableName}");`);

  const validates = R.chain(
    ({ name, key, validate }: any) =>
      validate ? [[key ?? name, validate] as const] : [],
    columns
  );

  
  console.timeEnd("COPY");

  console.time("clean");
  for (const { name, relation } of columns) {
    if (relation) {
      await client.query(
        `DELETE FROM "${tempTableName}" WHERE NOT EXISTS (SELECT FROM "${relation.table}" r WHERE r."${relation.column}" = "${name}")`
      );
    }
  }
  console.timeEnd("clean");

  console.time("TRUNCATE TABLE");
  await client.query(`TRUNCATE TABLE "${tableName}" CASCADE;`);
  console.timeEnd("TRUNCATE TABLE");

  console.time("INSERT INTO");
  await client.query(
    `INSERT INTO "${tableName}" SELECT * FROM "${tempTableName}" ON CONFLICT DO NOTHING;`
  );
  console.timeEnd("INSERT INTO");

  await client.query(`DROP TABLE "${tempTableName}"`);

  return () => client.query(`DROP TABLE "${tableName}" CASCADE`);
}

export default insert;