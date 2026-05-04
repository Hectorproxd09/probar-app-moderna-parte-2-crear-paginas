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

/* HISTORIAL */
let history = [];
let historyIndex = -1;

function saveHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(JSON.stringify(elements));
  historyIndex++;
}

/* ======================
   CREAR ELEMENTO
====================== */
function addElement(type) {
  elements.push({
    id: Date.now(),
    type,
    text: "Texto",
    x: 100,
    y: 100,
    width: 150,
    height: 80,
    size: 20,
    color: "#000000",
    link: "",
    z: elements.length
  });

  saveHistory();
  render();
}

/* ======================
   DESELECCIONAR
====================== */
canvas.addEventListener("click", (e) => {
  if (e.target === canvas) {
    selectedId = null;
    updatePanel();
    render();
  }
});

/* ======================
   RENDER
====================== */
function render() {
  canvas.innerHTML = "";

  elements.sort((a,b)=>a.z-b.z);

  elements.forEach(el => {
    const div = document.createElement("div");
    div.className = "element " + el.type;

    div.innerText = el.text;

    div.style.left = el.x + "px";
    div.style.top = el.y + "px";
    div.style.zIndex = el.z;

    if (el.type !== "panel") {
      div.style.fontSize = el.size + "px";
      div.style.color = el.color;
    }

    if (el.type === "panel") {
      div.style.width = el.width + "px";
      div.style.height = el.height + "px";
    }

    /* LINK */
    if (el.link) {
      div.onclick = (e) => {
        e.stopPropagation();
        window.open(el.link, "_blank");
      };
    }

    /* SELECCIÓN */
    div.onclick = (e) => {
      e.stopPropagation();
      selectedId = el.id;
      el.z = Math.max(...elements.map(e=>e.z)) + 1;
      updatePanel();
      render();
    };

    /* EDIT INLINE */
    div.ondblclick = (e) => {
      e.stopPropagation();
      div.contentEditable = true;
      div.focus();

      function save() {
        el.text = div.innerText;
        div.contentEditable = false;
        updatePanel();
        saveHistory();
        render();
      }

      div.onblur = save;

      div.onkeydown = (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          save();
        }
      };
    };

    /* DRAG */
    div.onmousedown = (e) => {
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

    /* RESIZE */
    if (el.id === selectedId) {
      div.classList.add("selected");

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
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;

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

      div.appendChild(handle);
    }

    canvas.appendChild(div);
  });

  generateCode();
}

/* ======================
   PROPIEDADES
====================== */
function updatePanel() {
  const el = elements.find(e => e.id === selectedId);

  if (!el) {
    inputs.text.value = "";
    inputs.size.value = "";
    inputs.color.value = "#000000";
    inputs.link.value = "";
    return;
  }

  inputs.text.value = el.text;
  inputs.size.value = el.size;
  inputs.color.value = el.color;
  inputs.link.value = el.link;
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

/* ======================
   DELETE
====================== */
function deleteElement() {
  elements = elements.filter(e => e.id !== selectedId);
  selectedId = null;
  saveHistory();
  render();
}

/* ======================
   UNDO / REDO
====================== */
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

/* ======================
   EXPORT
====================== */
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
