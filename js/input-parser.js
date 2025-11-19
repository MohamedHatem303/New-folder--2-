// input-parser.js
import { setMatrixInputsDisabled } from './matrix-utils.js';

// generates the editable matrix inputs (rows x (vars+1))
export function generateMatrix(rows, vars) {
    const matrix = document.getElementById("matrix");
    if (!matrix) return;
    matrix.innerHTML = "";

    for (let i = 0; i < rows; i++) {
        const li = document.createElement("li");
        li.className = "d-flex justify-content-center mb-2";

        for (let j = 0; j < vars + 1; j++) {
            const inp = document.createElement("input");
            inp.type = "number";
            inp.className = "border border-2 border-black rounded-2 mx-1 p-1 text-center";
            inp.dataset.r = i;
            inp.dataset.c = j;

            // placeholder: a_ij for coefficient columns, b_i for RHS column
            if (j < vars) {
                inp.placeholder = `a${i+1}${j+1}`; // a11, a12, ...
            } else {
                inp.placeholder = `b${i+1}`; // b1, b2, ...
            }

            // keyboard navigation and prevent arrow-up/down from changing value
            inp.addEventListener("keydown", matrixInputKeydown);
            inp.addEventListener("keydown", function(e) {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    // prevent the default number increment/decrement on arrow keys
                    e.preventDefault();
                }
            });

            li.appendChild(inp);
        }

        matrix.appendChild(li);
    }

    matrix.removeEventListener("input", matrixInputHandler);
    matrix.addEventListener("input", matrixInputHandler);
}

// handler that updates step matrices and keeps UI in sync
export function matrixInputHandler() {
    const matrix = document.getElementById("matrix");
    if (!matrix) return;

    const rowsEls = matrix.querySelectorAll("li");
    if (!rowsEls || rowsEls.length === 0) return;

    const rows = rowsEls.length;
    const cols = rowsEls[0].querySelectorAll("input").length;

    // global hook that app.js will provide
    if (typeof window.__fillStepMatrices === 'function') {
        window.__fillStepMatrices(rows, cols - 1);
    }
}

// keyboard navigation attached to each matrix input
export function matrixInputKeydown(e) {
    const key = e.key;
    const target = e.target;
    if (!target) return;
    const r = Number(target.dataset.r);
    const c = Number(target.dataset.c);

    const matrix = document.getElementById("matrix");
    if (!matrix) return;
    const rows = matrix.querySelectorAll("li").length;
    const cols = matrix.querySelectorAll("li")[0].querySelectorAll("input").length;

    let next = null;

    if (key === "ArrowRight") {
        e.preventDefault();
        next = matrix.querySelector(`input[data-r='${r}'][data-c='${Math.min(c+1, cols-1)}']`);
    }
    else if (key === "ArrowLeft") {
        e.preventDefault();
        next = matrix.querySelector(`input[data-r='${r}'][data-c='${Math.max(c-1, 0)}']`);
    }
    else if (key === "ArrowDown") {
        e.preventDefault();
        next = matrix.querySelector(`input[data-r='${Math.min(r+1, rows-1)}'][data-c='${c}']`);
    }
    else if (key === "ArrowUp") {
        e.preventDefault();
        next = matrix.querySelector(`input[data-r='${Math.max(r-1, 0)}'][data-c='${c}']`);
    }
    else if (key === "Enter") {
        e.preventDefault();
        if (typeof window.startSolve === 'function') window.startSolve();
        return;
    }

    if (next) {
        next.focus();
        try { next.select(); } catch {}
    }
}

// read the main matrix inputs and return numeric matrix or null if invalid
export function readMainMatrix() {
    const matrixEl = document.getElementById("matrix");
    if (!matrixEl) return null;
    const rowsEls = Array.from(matrixEl.querySelectorAll("li"));
    if (rowsEls.length === 0) return null;

    const cols = rowsEls[0].querySelectorAll("input").length;
    const rows = rowsEls.length;

    const mat = new Array(rows);

    let errorFound = false;

    for (let i = 0; i < rows; i++) {
        mat[i] = new Array(cols);
        const inputs = rowsEls[i].querySelectorAll("input");

        for (let j = 0; j < cols; j++) {
            const inp = inputs[j];
            const v = inp.value;

            inp.classList.remove("error-border");

            if (v === "") {
                inp.classList.add("error-border");
                errorFound = true;
            } else {
                mat[i][j] = parseFloat(v);
            }
        }
    }

    if (errorFound) {
        setMatrixInputsDisabled(false);
        if (typeof window.__restoreStartButton === 'function') window.__restoreStartButton();
        return null;
    }

    return mat;
}
