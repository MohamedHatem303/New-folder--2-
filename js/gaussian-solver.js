// gaussian-solver.js
import { cloneMatrix, fmtNumberNoTrailing, approxZero } from './matrix-utils.js';

// Gaussian elimination (medium verbosity) returning steps, echelon form and singular flag
export function gaussianEliminationMedium(inputMat) {
    const mat = inputMat.map(r => r.slice());
    const rows = mat.length;
    const cols = mat[0].length;
    const vars = cols - 1;

    const steps = [];

    let singular = false;
    let pivotRow = 1;

    for (let col = 0; col < vars && pivotRow <= rows; col++) {
        let sel0 = pivotRow - 1;
        while (sel0 < rows && Math.abs(mat[sel0][col]) < 1e-12) sel0++;
        if (sel0 === rows) {
            continue;
        }
        const sel = sel0 + 1;

        if (sel !== pivotRow) {
            const tmp = mat[sel0];
            mat[sel0] = mat[pivotRow - 1];
            mat[pivotRow - 1] = tmp;

            steps.push({
                desc: `Swap rows to bring pivot into row ${pivotRow}.`,
                matrix: cloneMatrix(mat),
                math: `(R${pivotRow} <=> R${sel})`
            });
        }

        let pivotVal = mat[pivotRow - 1][col];

        if (Math.abs(pivotVal - 1) > 1e-12) {
            const factor = pivotVal;
            for (let c = col; c < cols; c++) {
                mat[pivotRow - 1][c] = mat[pivotRow - 1][c] / factor;
                if (Math.abs(mat[pivotRow - 1][c]) < 1e-12) mat[pivotRow - 1][c] = 0;
            }
            steps.push({
                desc: `Normalize pivot at row ${pivotRow} (make pivot = 1).`,
                matrix: cloneMatrix(mat),
                math: `(R${pivotRow} => (1/${fmtNumberNoTrailing(factor)}) * R${pivotRow})`
            });
            pivotVal = mat[pivotRow - 1][col];
        }

        for (let r0 = pivotRow; r0 < rows; r0++) {
            if (Math.abs(mat[r0][col]) < 1e-12) continue;
            const factor = mat[r0][col] / pivotVal;
            for (let c = col; c < cols; c++) {
                mat[r0][c] = mat[r0][c] - factor * mat[pivotRow - 1][c];
                if (Math.abs(mat[r0][c]) < 1e-12) mat[r0][c] = 0;
            }

            // format elimination string simplified for k=±1
            const k = -factor;
            let mathStr;
            if (Math.abs(k - 1) < 1e-12) mathStr = `(R${r0+1} + R${pivotRow} => R${r0+1})`;
            else if (Math.abs(k + 1) < 1e-12) mathStr = `(R${r0+1} - R${pivotRow} => R${r0+1})`;
            else mathStr = `(R${r0+1} + (${fmtNumberNoTrailing(k)}) * R${pivotRow} => R${r0+1})`;

            steps.push({
                desc: `Eliminate entry in row ${r0+1}, column ${col+1}.`,
                matrix: cloneMatrix(mat),
                math: mathStr
            });
        }

        pivotRow++;
    }

    for (let r0 = 0; r0 < rows; r0++) {
        let allZero = true;
        for (let c = 0; c < vars; c++) if (Math.abs(mat[r0][c]) > 1e-12) { allZero = false; break; }
        if (allZero && Math.abs(mat[r0][vars]) > 1e-12) {
            steps.push({
                desc: `Inconsistent row detected at row ${r0+1}: no solution.`,
                matrix: cloneMatrix(mat),
                math: `(0 => ${fmtNumberNoTrailing(mat[r0][vars])})`
            });
            singular = true;
            break;
        }
    }

    return {steps, echelon: mat, singular};
}

// back substitution
export function backSubstitute(mat) {
    const rows = mat.length;
    const cols = mat[0].length;
    const vars = cols - 1;

    const x = new Array(vars).fill(0);

    for (let i = rows - 1; i >= 0; i--) {
        let lead = -1;
        for (let c = 0; c < vars; c++) {
            if (Math.abs(mat[i][c]) > 1e-12) { lead = c; break; }
        }
        if (lead === -1) continue;

        let sum = 0;
        for (let c = lead + 1; c < vars; c++) sum += mat[i][c] * x[c];

        const coeff = mat[i][lead];
        if (Math.abs(coeff) < 1e-12) continue;

        x[lead] = (mat[i][vars] - sum) / coeff;
    }

    return x.map(v => {
        if (v === null || v === undefined) return '';
        if (typeof v === 'string') return v;
        if (Number.isInteger(v)) return v.toString();
        return parseFloat(v.toFixed(6)).toString();
    });
}
