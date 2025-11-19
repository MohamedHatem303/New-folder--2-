// main.js (final) - complete file
// - parentheses restored
// - skip "*1" display
// - elimination displayed as Rr +/- Rp => Rr (simplified for k=±1)
// - swaps shown as (R1 <=> R2)
// - medium verbosity
// - Start button override (works with Bootstrap bg-black via setProperty('background-color',..., 'important'))
// - modal keyboard helpers: ArrowUp/ArrowDown to move between Equations/Variables, Enter submits (Switch)

// ----------------- CONFIG -----------------
const MAX = 15;

const main = document.getElementById("main");
const model = document.getElementById("model");

const variableNames = [
  "X","Y","Z","W","V",
  "U","T","S","R","Q",
  "P","O","N","M","L"
];

// ----------------- Switch -----------------
function Switch() {
    const eqInput = document.getElementById("Equations");
    const varInput = document.getElementById("Variables");

    const eq = Number(eqInput.value);
    const vars = Number(varInput.value);

    resetError(eqInput);
    resetError(varInput);

    let error = false;

    if (!Number.isInteger(eq) || eq <= 0 || eq > MAX) {
        markError(eqInput);
        error = true;
    }

    if (!Number.isInteger(vars) || vars <= 0 || vars > MAX) {
        markError(varInput);
        error = true;
    }

    if (error) return;

    // hide modal and show main
    if (model && main) {
        model.classList.replace("d-block", "d-none");
        main.classList.replace("d-none", "d-block");
    }

    generateMatrix(eq, vars);
    fillStepMatrices(eq, vars);

    const stepsContainer = document.getElementById("stepsContainer");
    if (stepsContainer) stepsContainer.classList.add("d-none");
    const finalSection = document.getElementById("finalSection");
    if (finalSection) finalSection.classList.add("d-none");
}

// ----------------- Back -----------------
function back() {
    if (model && main) {
        model.classList.replace("d-none", "d-block");
        main.classList.replace("d-block", "d-none");
    }

    const stepsContainer = document.getElementById("stepsContainer");
    if (stepsContainer) stepsContainer.classList.add("d-none");
    const finalSection = document.getElementById("finalSection");
    if (finalSection) finalSection.classList.add("d-none");
    const varsList = document.getElementById("variablesList");
    if (varsList) varsList.innerHTML = "";
}

// ----------------- Error Helpers -----------------
function markError(el) { if (el) el.classList.add("error-border"); }
function resetError(el) { if (el) el.classList.remove("error-border"); }

// ----------------- Matrix Generation -----------------
function generateMatrix(rows, vars) {
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

            inp.addEventListener("keydown", matrixInputKeydown);

            li.appendChild(inp);
        }

        matrix.appendChild(li);
    }

    matrix.removeEventListener("input", matrixInputHandler);
    matrix.addEventListener("input", matrixInputHandler);
}

function matrixInputHandler() {
    const matrix = document.getElementById("matrix");
    if (!matrix) return;

    const rowsEls = matrix.querySelectorAll("li");
    if (!rowsEls || rowsEls.length === 0) return;

    const rows = rowsEls.length;
    const cols = rowsEls[0].querySelectorAll("input").length;

    fillStepMatrices(rows, cols - 1);
}

// ----------------- Keyboard Navigation inside matrix inputs -----------------
function matrixInputKeydown(e) {
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
        startSolve();
        return;
    }

    if (next) {
        next.focus();
        try { next.select(); } catch {}
    }
}

// ----------------- Fill Step Previews + Final (NO step 0) -----------------
function fillStepMatrices(rows, vars) {
    const mainMatrix = document.getElementById("matrix");
    if (!mainMatrix) return;
    const mainRows = Array.from(mainMatrix.querySelectorAll("li"));

    const stepsContainer = document.getElementById("stepsContainer");
    if (stepsContainer) stepsContainer.innerHTML = "";

    // do not show unmodified initial matrix (user requested)
    const finalContainer = document.getElementById("finalMatrix");
    if (!finalContainer) return;
    finalContainer.innerHTML = "";

    for (let i = 0; i < rows; i++) {
        const li = document.createElement("li");
        li.className = "d-flex justify-content-center mb-2";
        for (let j = 0; j < vars + 1; j++) {
            const inp = document.createElement("input");
            inp.type = "number";
            inp.disabled = true;
            inp.className = "border border-2 border-black rounded-2 mx-1 p-1 text-center";

            const mainInp = mainRows[i].querySelectorAll("input")[j];
            if (mainInp && mainInp.value !== "") inp.value = mainInp.value;

            li.appendChild(inp);
        }
        finalContainer.appendChild(li);
    }
}

// ----------------- Start Solve -----------------
function startSolve() {
    const matrix = readMainMatrix();
    if (!matrix) return;

    // lock inputs so user cannot edit while solving
    setMatrixInputsDisabled(true);

    // disable and grey the Start button (use important to override bootstrap bg-black)
    const startBtn = findStartButton();
    if (startBtn) {
        startBtn.disabled = true;
        // store original inline background if any
        if (!startBtn.dataset._origBg) startBtn.dataset._origBg = startBtn.style.getPropertyValue('background-color') || "";
        // override with important so bg-black doesn't dominate
        startBtn.style.setProperty('background-color', '#d3d3d3', 'important');
        startBtn.style.setProperty('pointer-events', 'none', 'important');
        startBtn.style.setProperty('opacity', '0.8', 'important');
    }

    // perform Gaussian elimination with medium verbosity
    const {steps, echelon, singular} = gaussianEliminationMedium(matrix);

    renderVerboseSteps(steps);
    renderFinalMatrix(echelon);

    if (singular) {
        generateVariablesList(null, "The system may be singular or inconsistent.");
        const stepsContainer = document.getElementById("stepsContainer");
        if (stepsContainer) stepsContainer.classList.remove("d-none");
        const finalSection = document.getElementById("finalSection");
        if (finalSection) finalSection.classList.remove("d-none");
        return;
    }

    // back substitution
    const values = backSubstitute(echelon);
    generateVariablesList(values, "");

    const stepsContainer = document.getElementById("stepsContainer");
    if (stepsContainer) stepsContainer.classList.remove("d-none");
    const finalSection = document.getElementById("finalSection");
    if (finalSection) finalSection.classList.remove("d-none");
}

// ----------------- Read Matrix -----------------
function readMainMatrix() {
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

            // remove any previous red border
            inp.classList.remove("error-border");

            if (v === "") {
                // just mark red border — NO ALERT
                inp.classList.add("error-border");
                errorFound = true;
            } else {
                mat[i][j] = parseFloat(v);
            }
        }
    }

    if (errorFound) {
        // allow user to edit again
        setMatrixInputsDisabled(false);
        restoreStartButton();
        return null;
    }

    return mat;
}


// ----------------- Formatting helpers for math strings -----------------
function fmtNumberNoTrailing(x) {
    if (x === null || x === undefined) return '';
    if (typeof x === 'string') return x;
    if (Number.isInteger(x)) return x.toString();
    return parseFloat(x.toFixed(6)).toString();
}

// Format normalization math string, skip *1
function formatNormalization(rowIndex, factor) {
    // factor is the old pivot value; if factor==1 then skip normalization display (caller should avoid calling)
    if (Math.abs(factor - 1) < 1e-12) return '';
    return `(R${rowIndex} => (1/${fmtNumberNoTrailing(factor)}) * R${rowIndex})`;
}

// Format elimination: we perform Rr <- Rr - factor * Rp
// We'll display as Rr => Rr + (k) * Rp where k = -factor
// If k == 1 => "Rr + Rp => Rr"
// If k == -1 => "Rr - Rp => Rr"
// Else => "Rr + (k) * Rp => Rr"
function formatElimination(rIndex, pIndex, factor) {
    const k = -factor;
    const r = rIndex, p = pIndex;
    if (Math.abs(k - 1) < 1e-12) {
        return `(R${r} + R${p} => R${r})`;
    }
    if (Math.abs(k + 1) < 1e-12) {
        return `(R${r} - R${p} => R${r})`;
    }
    return `(R${r} + (${fmtNumberNoTrailing(k)}) * R${p} => R${r})`;
}

// ----------------- Gaussian elimination (MEDIUM verbosity, using '<=>' swaps and formatted ops) -----------------
function gaussianEliminationMedium(inputMat) {
    const mat = inputMat.map(r => r.slice());
    const rows = mat.length;
    const cols = mat[0].length;
    const vars = cols - 1;

    const steps = [];

    let singular = false;
    let pivotRow = 1; // use 1-based index for display convenience in formulas

    for (let col = 0; col < vars && pivotRow <= rows; col++) {
        // find pivot row (use 1-based in selection logic for math strings)
        let sel0 = pivotRow - 1;
        while (sel0 < rows && Math.abs(mat[sel0][col]) < 1e-12) sel0++;
        if (sel0 === rows) {
            // no pivot in this column -> skip
            continue;
        }
        const sel = sel0 + 1; // 1-based

        // swap if needed (log) — use '<=>'
        if (sel !== pivotRow) {
            swapRows(mat, sel0, pivotRow - 1);
            steps.push({
                desc: `Swap rows to bring pivot into row ${pivotRow}.`,
                matrix: cloneMatrix(mat),
                math: `(R${pivotRow} <=> R${sel})`
            });
        }

        // pivot value (after possible swap)
        let pivotVal = mat[pivotRow - 1][col];

        // normalize if necessary (log only when change happens) — show (1/factor)*R
        if (Math.abs(pivotVal - 1) > 1e-12) {
            const factor = pivotVal;
            for (let c = col; c < cols; c++) {
                mat[pivotRow - 1][c] = mat[pivotRow - 1][c] / factor;
                if (Math.abs(mat[pivotRow - 1][c]) < 1e-12) mat[pivotRow - 1][c] = 0;
            }
            steps.push({
                desc: `Normalize pivot at row ${pivotRow} (make pivot = 1).`,
                matrix: cloneMatrix(mat),
                math: formatNormalization(pivotRow, factor)
            });
            pivotVal = mat[pivotRow - 1][col];
        }

        // eliminate rows below pivot — log only for rows that change
        for (let r0 = pivotRow; r0 < rows; r0++) {
            if (Math.abs(mat[r0][col]) < 1e-12) continue;
            const factor = mat[r0][col] / pivotVal; // pivotVal should be 1
            for (let c = col; c < cols; c++) {
                mat[r0][c] = mat[r0][c] - factor * mat[pivotRow - 1][c];
                if (Math.abs(mat[r0][c]) < 1e-12) mat[r0][c] = 0;
            }
            // format elimination using 1-based indices
            steps.push({
                desc: `Eliminate entry in row ${r0+1}, column ${col+1}.`,
                matrix: cloneMatrix(mat),
                math: formatElimination(r0+1, pivotRow, factor)
            });
        }

        pivotRow++;
    }

    // check for inconsistent rows
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

// ----------------- Render verbose steps (Step X restored, math top-left using parentheses) -----------------
function renderVerboseSteps(steps) {
    const container = document.getElementById("stepsContainer");
    if (!container) return;
    container.innerHTML = "";

    steps.forEach((s, idx) => {
        const section = document.createElement("section");
        section.className = "my-3 border border-2 border-black rounded-2 p-3";

        // Step label top-left (RESTORED)
        const stepLabel = document.createElement("div");
        stepLabel.style.textAlign = "left";
        stepLabel.style.fontWeight = "700";
        stepLabel.style.marginBottom = "6px";
        stepLabel.innerText = `Step ${idx+1}:`; // show 1-based step number
        section.appendChild(stepLabel);

        // 1) Math expression top-left (monospace) — bigger & bold
        const mathBlock = document.createElement("div");
        mathBlock.style.textAlign = "left";
        mathBlock.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Courier New', monospace";
        mathBlock.style.fontSize = "18px";
        mathBlock.style.fontWeight = "700";
        mathBlock.style.whiteSpace = "pre";
        mathBlock.style.marginBottom = "8px";
        // Use math string (which uses formatted parentheses and skips *1) or fallback to desc
        mathBlock.innerText = s.math && s.math.length ? s.math : s.desc;
        section.appendChild(mathBlock);

        // 2) Centered caption below math: "Matrix after step X"
        const caption = document.createElement("div");
        caption.style.textAlign = "center";
        caption.style.marginBottom = "6px";
        caption.innerHTML = `<strong>Matrix after step ${idx+1}</strong>`;
        section.appendChild(caption);

        // 3) Matrix centered
        const wrapper = document.createElement("div");
        wrapper.className = "d-flex justify-content-center";
        wrapper.style.marginTop = "6px";

        const ul = document.createElement("ul");
        ul.className = "list-unstyled";

        s.matrix.forEach(row => {
            const li = document.createElement("li");
            li.className = "d-flex justify-content-center mb-2";
            row.forEach(v => {
                const inp = document.createElement("input");
                inp.type = "text";
                inp.disabled = true;
                inp.className = "border border-2 border-black rounded-2 mx-1 p-1 text-center";
                inp.value = fmtNumberNoTrailing(v);
                li.appendChild(inp);
            });
            ul.appendChild(li);
        });

        wrapper.appendChild(ul);
        section.appendChild(wrapper);

        container.appendChild(section);
    });
}

// ----------------- Render final matrix (no caption) -----------------
function renderFinalMatrix(mat) {
    const finalContainer = document.getElementById("finalMatrix");
    if (!finalContainer) return;
    finalContainer.innerHTML = "";

    // removed the header/caption as requested

    mat.forEach(row => {
        const li = document.createElement("li");
        li.className = "d-flex justify-content-center mb-2";
        row.forEach(v => {
            const inp = document.createElement("input");
            inp.type = "text";
            inp.disabled = true;
            inp.className = "border border-2 border-black rounded-2 mx-1 p-1 text-center";
            inp.value = fmtNumberNoTrailing(v);
            li.appendChild(inp);
        });
        finalContainer.appendChild(li);
    });
}

// ----------------- Back substitution -----------------
function backSubstitute(mat) {
    const rows = mat.length;
    const cols = mat[0].length;
    const vars = cols - 1;

    const x = new Array(vars).fill(0);

    // back substitution
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

    return x.map(v => fmtNumberNoTrailing(v));
}

// ----------------- Variables List -----------------
function generateVariablesList(valuesArray, note) {
    const list = document.getElementById("variablesList");
    if (!list) return;
    list.innerHTML = "";

    const ul = document.createElement("ul");

    if (valuesArray === null) {
        const li = document.createElement("li");
        li.innerHTML = `<h4>${note}</h4>`;
        ul.appendChild(li);
    } else {
        for (let i = 0; i < valuesArray.length; i++) {
            const li = document.createElement("li");
            li.innerHTML = `<h2>${variableNames[i]} = ${valuesArray[i]}</h2>`;
            ul.appendChild(li);
        }
    }

    list.appendChild(ul);
}

// ----------------- Helpers -----------------
function swapRows(mat, i, j) {
    const tmp = mat[i];
    mat[i] = mat[j];
    mat[j] = tmp;
}

function cloneMatrix(mat) {
    return mat.map(r => r.slice());
}

function roundNumber(x) {
    if (x === null || x === undefined) return '';
    if (typeof x === 'string') return x;
    if (Number.isInteger(x)) return x.toString();
    return parseFloat(x.toFixed(6)).toString();
}

// Disable or enable the matrix input fields
function setMatrixInputsDisabled(disabled) {
    const matrix = document.getElementById("matrix");
    if (!matrix) return;
    const inputs = matrix.querySelectorAll("input");
    inputs.forEach(inp => {
        // Only enable/disable the actual data inputs (type=number or visible text)
        if (inp.type === "number" || inp.type === "text") {
            inp.disabled = disabled;
        }
    });
}

// try to find the Start Solve button in the DOM
function findStartButton() {
    // common selectors tried in order
    let btn = document.querySelector('button[onclick="startSolve()"]');
    if (!btn) btn = document.getElementById("startButton");
    if (!btn) btn = document.querySelector('button.start-solve, button#startSolve, input[type="button"][value="Start Solve"]');
    return btn;
}

// restore start button to original appearance
function restoreStartButton() {
    const startBtn = findStartButton();
    if (!startBtn) return;
    startBtn.disabled = false;
    // restore original background if we stored one
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

// ----------------- Clear Values (unlock + reset start button) -----------------
function clearValues() {
    const matrix = document.getElementById("matrix");
    if (matrix) matrix.querySelectorAll("input").forEach(i => i.value = "");

    // re-enable editing
    setMatrixInputsDisabled(false);

    // reset start button appearance
    restoreStartButton();

    const stepsContainer = document.getElementById("stepsContainer");
    if (stepsContainer) stepsContainer.classList.add("d-none");
    const finalSection = document.getElementById("finalSection");
    if (finalSection) finalSection.classList.add("d-none");
    const varsList = document.getElementById("variablesList");
    if (varsList) varsList.innerHTML = "";
}

// expose clearValues under old name too (if UI calls clearValues via different name)
window.clearValues = clearValues;

// ----------------- Modal keyboard helpers (move between inputs with ↑/↓ and Enter to submit) ----------
function setupModelKeyboard() {
  const eq = document.getElementById('Equations');
  const vars = document.getElementById('Variables');

  if (!eq || !vars) return;

  function onKey(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (document.activeElement === eq) {
        vars.focus();
        try { vars.select(); } catch {}
      } else {
        eq.focus();
        try { eq.select(); } catch {}
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (document.activeElement === vars) {
        eq.focus();
        try { eq.select(); } catch {}
      } else {
        vars.focus();
        try { vars.select(); } catch {}
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      try { Switch(); } catch (err) { console.error(err); }
    }
  }

  eq.addEventListener('keydown', onKey);
  vars.addEventListener('keydown', onKey);
}

// auto-setup on DOMContentLoaded (if modal inputs exist)
document.addEventListener('DOMContentLoaded', setupModelKeyboard);

// ----------------- Expose main functions -----------------
window.Switch = Switch;
window.back = back;
window.startSolve = startSolve;
window.clearValues = clearValues;
