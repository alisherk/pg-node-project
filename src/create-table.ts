import type { PoolClient } from 'pg';
import R from 'ramda';

type ColumnOptions = {
  id?: boolean;
  name: string;
  type?: string;
  required: boolean;
  relation?: {
    tableName: string;
    column: string;
  };
};

type InsertOptions = {
  tableName: string;
  columns: ColumnOptions[];
};

export async function createTable(
  client: PoolClient,
  { tableName, columns }: InsertOptions
) {
  const createColumns = columns
    .flatMap(({ id, name, type, required, relation }) => {
      const column = R.unnest([
        [name],
        type ? [type] : [],
        id ? ['SERIAL PRIMARY KEY'] : [],
        required ? ['NOT NULL'] : [],
      ]).join(' ');

      return relation
        ? [
            //convention for creating a foreign key in sql
            //fk__ForeignKeyTable__PrimaryKeyTable
            column,
            `CONSTRAINT ${relation.tableName}_${tableName}_fkey FOREIGN KEY (${name}) REFERENCES ${relation.tableName}(${relation.column}) ON DELETE CASCADE ON UPDATE CASCADE`,
          ]
        : column;
    })
    .join();
  await client.query(`CREATE TABLE ${tableName} (${createColumns});`);
}
