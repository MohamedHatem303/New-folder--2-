// matrix-utils.js
export function swapRows(mat, i, j) {
    const tmp = mat[i];
    mat[i] = mat[j];
    mat[j] = tmp;
}

export function cloneMatrix(mat) {
    return mat.map(r => r.slice());
}

export function approxZero(x, eps = 1e-12) {
    return Math.abs(x) < eps;
}

export function fmtNumberNoTrailing(x) {
    if (x === null || x === undefined) return '';
    if (typeof x === 'string') return x;
    if (Number.isInteger(x)) return x.toString();
    return parseFloat(x.toFixed(6)).toString();
}

// DOM-related small helpers — kept here so other modules can import
export function setMatrixInputsDisabled(disabled) {
    const matrix = document.getElementById("matrix");
    if (!matrix) return;
    const inputs = matrix.querySelectorAll("input");
    inputs.forEach(inp => {
        if (inp.type === "number" || inp.type === "text") {
            inp.disabled = disabled;
        }
    });
}

// try to find the Start Solve button in the DOM
export function findStartButton() {
    let btn = document.querySelector('button[onclick="startSolve()"]');
    if (!btn) btn = document.getElementById("startButton");
    if (!btn) btn = document.querySelector('button.start-solve, button#startSolve, input[type="button"][value="Start Solve"]');
    return btn;
}

export function restoreStartButton(startBtn) {
    if (!startBtn) {
        startBtn = findStartButton();
        if (!startBtn) return;
    }
    startBtn.disabled = false;
    if (startBtn.dataset._origBg !== undefined) {
        const orig = startBtn.dataset._origBg || "";
        startBtn.style.setProperty('background-color', orig, 'important');
        startBtn.style.removeProperty('pointer-events');
        startBtn.style.removeProperty('opacity');
        delete startBtn.dataset._origBg;
    } else {
        startBtn.style.removeProperty('background-color');
        startBtn.style.removeProperty('pointer-events');
        startBtn.style.removeProperty('opacity');
    }
}
