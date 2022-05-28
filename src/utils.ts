import R from 'ramda';

//function produces this ($1, $2), ($3, $4) based on row columns and length of array
export function expand(rowCount: number, columnCount: number) {
  let index = 0
  
  return Array(rowCount)
    .fill(0)
    .map(
      (v) =>
        `(${Array(columnCount)
          .fill(0)
          .map((v) => `$${index++}`)
          .join(', ')})`
    )
    .join(', ');
}

export const flatten = (authors: string[][]) => authors.reduce((acc, a) => acc.concat([R.head(a), R.last(a)]), [] as any) 
