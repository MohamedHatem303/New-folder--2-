// dom-renderer.js
import { fmtNumberNoTrailing } from './matrix-utils.js';
import { variableNames } from './constants.js';

// mark/unmark inputs with error class
export function markError(el) { if (el) el.classList.add("error-border"); }
export function resetError(el) { if (el) el.classList.remove("error-border"); }

export function renderVerboseSteps(steps) {
    const container = document.getElementById("stepsContainer");
    if (!container) return;
    container.innerHTML = "";

    steps.forEach((s, idx) => {
        const section = document.createElement("section");
        section.className = "my-3 border border-2 border-black rounded-2 p-3";

        const stepLabel = document.createElement("div");
        stepLabel.style.textAlign = "left";
        stepLabel.style.fontWeight = "700";
        stepLabel.style.marginBottom = "6px";
        stepLabel.innerText = `Step ${idx+1}:`;
        section.appendChild(stepLabel);

        const mathBlock = document.createElement("div");
        mathBlock.style.textAlign = "left";
        mathBlock.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Courier New', monospace";
        mathBlock.style.fontSize = "18px";
        mathBlock.style.fontWeight = "700";
        mathBlock.style.whiteSpace = "pre";
        mathBlock.style.marginBottom = "8px";
        mathBlock.innerText = s.math && s.math.length ? s.math : s.desc;
        section.appendChild(mathBlock);

        const caption = document.createElement("div");
        caption.style.textAlign = "center";
        caption.style.marginBottom = "6px";
        caption.innerHTML = `<strong>Matrix after step ${idx+1}</strong>`;
        section.appendChild(caption);

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
                const formatted = fmtNumberNoTrailing(v);
                if (formatted === '') {
                    inp.placeholder = '-';
                } else {
                    inp.value = formatted;
                }
                li.appendChild(inp);
            });
            ul.appendChild(li);
        });

        wrapper.appendChild(ul);
        section.appendChild(wrapper);

        container.appendChild(section);
    });
}

export function renderFinalMatrix(mat) {
    const finalContainer = document.getElementById("finalMatrix");
    if (!finalContainer) return;
    finalContainer.innerHTML = "";

    mat.forEach(row => {
        const li = document.createElement("li");
        li.className = "d-flex justify-content-center mb-2";
        row.forEach(v => {
            const inp = document.createElement("input");
            inp.type = "text";
            inp.disabled = true;
            inp.className = "border border-2 border-black rounded-2 mx-1 p-1 text-center";
            const formatted = fmtNumberNoTrailing(v);
            if (formatted === '') {
                inp.placeholder = '-';
            } else {
                inp.value = formatted;
            }
            li.appendChild(inp);
        });
        finalContainer.appendChild(li);
    });
}

export function generateVariablesList(valuesArray, note) {
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
