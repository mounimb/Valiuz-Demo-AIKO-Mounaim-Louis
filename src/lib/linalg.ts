/**
 * Tiny linear algebra for the MMM: Gaussian elimination and ridge regression
 * via the normal equations. No external dependency.
 */

/** Solve A x = b by Gaussian elimination with partial pivoting. */
export function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (pivot !== col) {
      const tmp = M[col];
      M[col] = M[pivot];
      M[pivot] = tmp;
    }
    const d = M[col][col];
    if (Math.abs(d) < 1e-12) continue;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / d;
      if (f === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }

  const x = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    const d = M[i][i];
    x[i] = Math.abs(d) < 1e-12 ? 0 : M[i][n] / d;
  }
  return x;
}

/**
 * Ridge regression: solve (X'X + alpha I) beta = X'y.
 * Returns the coefficient vector (length = number of columns of X).
 */
export function ridgeRegression(X: number[][], y: number[], alpha: number): number[] {
  const n = X.length;
  const p = X[0].length;
  const XtX = Array.from({ length: p }, () => new Array<number>(p).fill(0));
  const Xty = new Array<number>(p).fill(0);

  for (let i = 0; i < n; i++) {
    const xi = X[i];
    const yi = y[i];
    for (let a = 0; a < p; a++) {
      Xty[a] += xi[a] * yi;
      for (let b = 0; b < p; b++) XtX[a][b] += xi[a] * xi[b];
    }
  }
  for (let a = 0; a < p; a++) XtX[a][a] += alpha;

  return solveLinearSystem(XtX, Xty);
}
