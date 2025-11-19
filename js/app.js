// app.js - entry point controller
import { MAX } from './constants.js';
import { generateMatrix, matrixInputHandler, matrixInputKeydown, readMainMatrix } from './input-parser.js';
import { setMatrixInputsDisabled, findStartButton, restoreStartButton } from './matrix-utils.js';
import { gaussianEliminationMedium, backSubstitute } from './gaussian-solver.js';
import { renderVerboseSteps, renderFinalMatrix, generateVariablesList, markError, resetError } from './dom-renderer.js';

// expose functions to preserve old API and onclick compatibility
window.generateMatrix = generateMatrix;
window.fillStepMatrices = function(rows, vars) {
    // create final matrix UI snapshot (same behavior as original fillStepMatrices)
    const mainMatrix = document.getElementById("matrix");
    if (!mainMatrix) return;
    const mainRows = Array.from(mainMatrix.querySelectorAll("li"));

    const stepsContainer = document.getElementById("stepsContainer");
    if (stepsContainer) stepsContainer.innerHTML = "";

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
};

window.startSolve = startSolve;
window.clearValues = clearValues;
window.Switch = Switch;
window.back = back;

// expose internal restore to input-parser if needed
window.__restoreStartButton = restoreStartButton;
window.__fillStepMatrices = window.fillStepMatrices;

export function startSolve() {
    const matrix = readMainMatrix();
    if (!matrix) return;

    setMatrixInputsDisabled(true);

    const startBtn = findStartButton();
    if (startBtn) {
        startBtn.disabled = true;
        if (!startBtn.dataset._origBg) startBtn.dataset._origBg = startBtn.style.getPropertyValue('background-color') || "";
        startBtn.style.setProperty('background-color', '#d3d3d3', 'important');
        startBtn.style.setProperty('pointer-events', 'none', 'important');
        startBtn.style.setProperty('opacity', '0.8', 'important');
    }

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

    const values = backSubstitute(echelon);
    generateVariablesList(values, "");

    const stepsContainer = document.getElementById("stepsContainer");
    if (stepsContainer) stepsContainer.classList.remove("d-none");
    const finalSection = document.getElementById("finalSection");
    if (finalSection) finalSection.classList.remove("d-none");
}

export function clearValues() {
    const matrix = document.getElementById("matrix");
    if (matrix) matrix.querySelectorAll("input").forEach(i => i.value = "");

    setMatrixInputsDisabled(false);
    restoreStartButton();

    const stepsContainer = document.getElementById("stepsContainer");
    if (stepsContainer) stepsContainer.classList.add("d-none");
    const finalSection = document.getElementById("finalSection");
    if (finalSection) finalSection.classList.add("d-none");
    const varsList = document.getElementById("variablesList");
    if (varsList) varsList.innerHTML = "";
}

// Switch (modal -> main) and back
export function Switch() {
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

    const mainEl = document.getElementById("main");
    const model = document.getElementById("model");

    if (model && mainEl) {
        model.classList.replace("d-block", "d-none");
        mainEl.classList.replace("d-none", "d-block");
    }

    generateMatrix(eq, vars);
    window.fillStepMatrices(eq, vars);

    const stepsContainer = document.getElementById("stepsContainer");
    if (stepsContainer) stepsContainer.classList.add("d-none");
    const finalSection = document.getElementById("finalSection");
    if (finalSection) finalSection.classList.add("d-none");
}

export function back() {
    const mainEl = document.getElementById("main");
    const model = document.getElementById("model");
    if (model && mainEl) {
        model.classList.replace("d-none", "d-block");
        mainEl.classList.replace("d-block", "d-none");
    }

    const stepsContainer = document.getElementById("stepsContainer");
    if (stepsContainer) stepsContainer.classList.add("d-none");
    const finalSection = document.getElementById("finalSection");
    if (finalSection) finalSection.classList.add("d-none");
    const varsList = document.getElementById("variablesList");
    if (varsList) varsList.innerHTML = "";
}

// modal keyboard helpers
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

document.addEventListener('DOMContentLoaded', setupModelKeyboard);
