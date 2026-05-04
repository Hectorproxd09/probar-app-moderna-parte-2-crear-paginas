const canvas = document.getElementById("canvas");

/* INPUTS */
const inputs = {
  text: document.getElementById("prop-text"),
  size: document.getElementById("prop-size"),
  color: document.getElementById("prop-color"),
  link: document.getElementById("prop-link")
};

const htmlOut = document.getElementById("html-code");
const cssOut = document.getElementById("css-code");

/* ESTADO */
let elements = [];
let selectedId = null;
let snapEnabled = false;

/* HISTORIAL */
let history = [];
let historyIndex = -1;

function saveHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(JSON.stringify(elements));
  historyIndex++;
}

/* =========================
   DESELECCIÓN
========================= */
canvas.addEventListener("click", (e) => {
  if (e.target === canvas) {
    selectedId = null;
    updatePanel();
    render();
  }
});

/* =========================
   CREAR
========================= */
function addElement(type) {
  elements.push({
    id: Date.now(),
    type,
    text: type === "button" ? "Botón" : "Texto",
    x: 100,
    y: 100,
    width: 150,
    height: 80,
    size: 20,
    color: "#000",
    link: "",
    z: elements.length
  });

  saveHistory();
  render();
}

/* =========================
   RENDER
========================= */
function render() {
  canvas.innerHTML = "";

  elements.sort((a,b)=>a.z-b.z);

  elements.forEach(el => {
    let d = document.createElement("div");
    d.className = "element " + el.type;

    d.innerText = el.text;

    d.style.left = el.x + "px";
    d.style.top = el.y + "px";
    d.style.zIndex = el.z;

    /* TEXTO */
    if (el.type === "text" || el.type === "button") {
      d.style.fontSize = el.size + "px";
      d.style.color = el.color;
    }

    /* PANEL */
    if (el.type === "panel") {
      d.style.width = el.width + "px";
      d.style.height = el.height + "px";
    }

    /* LINK */
    if (el.link) {
      d.style.cursor = "pointer";
      d.onclick = (e) => {
        e.stopPropagation();
        window.open(el.link, "_blank");
      };
    }

    /* SELECCIÓN */
    d.onclick = (e) => {
      e.stopPropagation();
      selectedId = el.id;
      el.z = Math.max(...elements.map(e=>e.z)) + 1;
      updatePanel();
      render();
    };

    /* EDIT INLINE (SIN CARTEL) */
    d.ondblclick = (e) => {
      e.stopPropagation();

      d.contentEditable = true;
      d.focus();

      function save() {
        el.text = d.innerText;
        d.contentEditable = false;
        updatePanel();
        saveHistory();
        render();
      }

      d.onblur = save;

      d.onkeydown = (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          save();
        }
      };
    };

    /* DRAG */
    d.onmousedown = (e) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - el.x;
      const offsetY = e.clientY - rect.top - el.y;

      function move(ev) {
        el.x = ev.clientX - rect.left - offsetX;
        el.y = ev.clientY - rect.top - offsetY;
        render();
      }

      function stop() {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", stop);
        saveHistory();
      }

      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", stop);
    };

    /* RESIZE DESDE ESQUINA */
    if (el.id === selectedId) {
      d.classList.add("selected");

      const handle = document.createElement("div");
      handle.className = "handle";

      handle.onmousedown = (e) => {
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;

        const startW = el.width;
        const startH = el.height;
        const startSize = el.size;

        function resize(ev) {
          let dx = ev.clientX - startX;
          let dy = ev.clientY - startY;

          if (el.type === "panel") {
            el.width = startW + dx;
            el.height = startH + dy;
          } else {
            el.size = Math.max(10, startSize + dx * 0.3);
          }

          render();
        }

        function stop() {
          document.removeEventListener("mousemove", resize);
          document.removeEventListener("mouseup", stop);
          saveHistory();
        }

        document.addEventListener("mousemove", resize);
        document.addEventListener("mouseup", stop);
      };

      d.appendChild(handle);
    }

    canvas.appendChild(d);
  });

  generateCode();
}

/* =========================
   PROPIEDADES DINÁMICAS
========================= */
function updatePanel() {
  const el = elements.find(e => e.id === selectedId);

  if (!el) {
    inputs.text.value = "";
    inputs.size.value = "";
    inputs.color.value = "#000000";
    inputs.link.value = "";
    return;
  }

  /* TEXTO */
  if (el.type === "text") {
    inputs.text.style.display = "block";
    inputs.size.style.display = "block";
    inputs.color.style.display = "block";
    inputs.link.style.display = "block";
  }

  /* BOTÓN */
  if (el.type === "button") {
    inputs.text.style.display = "block";
    inputs.size.style.display = "block";
    inputs.color.style.display = "block";
    inputs.link.style.display = "block";
  }

  /* PANEL */
  if (el.type === "panel") {
    inputs.text.style.display = "none";
    inputs.size.style.display = "none";
    inputs.color.style.display = "block";
    inputs.link.style.display = "none";
  }

  inputs.text.value = el.text || "";
  inputs.size.value = el.size || "";
  inputs.color.value = el.color || "#000";
  inputs.link.value = el.link || "";
}

/* INPUTS */
Object.keys(inputs).forEach(k => {
  inputs[k].oninput = () => {
    const el = elements.find(e => e.id === selectedId);
    if (!el) return;

    el[k] = inputs[k].value;
    saveHistory();
    render();
  };
});

/* =========================
   DELETE
========================= */
function deleteElement() {
  elements = elements.filter(e => e.id !== selectedId);
  selectedId = null;
  saveHistory();
  render();
}

/* =========================
   UNDO / REDO
========================= */
function undo() {
  if (historyIndex <= 0) return;
  historyIndex--;
  elements = JSON.parse(history[historyIndex]);
  render();
}

function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex++;
  elements = JSON.parse(history[historyIndex]);
  render();
}

/* =========================
   EXPORT
========================= */
function generateCode() {
  let html = "";
  let css = "";

  elements.forEach((el, i) => {
    const c = "el" + i;

    html += `<div class="${c}">${el.text}</div>\n`;

    css += `.${c}{
  position:absolute;
  left:${el.x}px;
  top:${el.y}px;
}\n`;

    if (el.type === "panel") {
      css += `.${c}{
  width:${el.width}px;
  height:${el.height}px;
  background:${el.color};
}\n`;
    } else {
      css += `.${c}{
  font-size:${el.size}px;
  color:${el.color};
}\n`;
    }
  });

  htmlOut.textContent = html;
  cssOut.textContent = css;
}

/* INIT */
saveHistory();
render();
