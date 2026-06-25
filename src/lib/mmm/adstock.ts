/** Geometric adstock: carry-over of media pressure across days. */

export function geometricAdstock(spend: number[], lambda: number): number[] {
  const out = new Array<number>(spend.length);
  let carry = 0;
  for (let t = 0; t < spend.length; t++) {
    carry = spend[t] + lambda * carry;
    out[t] = carry;
  }
  return out;
}
