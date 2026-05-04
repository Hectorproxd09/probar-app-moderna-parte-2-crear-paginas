const canvas = document.getElementById("canvas");

/* INPUTS */
const inputs = {
  text: document.getElementById("prop-text"),
  size: document.getElementById("prop-size"),
  color: document.getElementById("prop-color")
};

const htmlOut = document.getElementById("html-code");
const cssOut = document.getElementById("css-code");

/* ESTADO */
let elements = [];
let selectedId = null;
let snapEnabled = false;

/* BACKGROUND */
let background = { type: null, url: "" };

/* HISTORIAL */
let history = [];
let historyIndex = -1;

function saveHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(JSON.stringify(elements));
  historyIndex++;
}

/* ======================
   BACKGROUND
====================== */
function setBackground() {
  const url = document.getElementById("bg-url").value.trim();
  if (!url) return;

  background.type = url.match(/\.(mp4|webm|ogg)$/i) ? "video" : "image";
  background.url = url;

  render();
}

/* ======================
   SNAP TOGGLE
====================== */
function toggleSnap() {
  snapEnabled = !snapEnabled;
}

/* ======================
   DESELECCIÓN
====================== */
canvas.addEventListener("click", (e) => {
  if (e.target === canvas) {
    selectedId = null;
    updatePanel();
    render();
  }
});

/* ======================
   CREAR
====================== */
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
    z: elements.length
  });

  saveHistory();
  render();
}

/* ======================
   GUIAS SNAP
====================== */
let guides = [];

function clearGuides() {
  guides.forEach(g => g.remove());
  guides = [];
}

function createGuide(x, y, vertical) {
  const g = document.createElement("div");
  g.className = "guide";
  g.style.position = "absolute";
  g.style.background = "#3b82f6";
  g.style.zIndex = "999";

  if (vertical) {
    g.style.left = x + "px";
    g.style.top = "0";
    g.style.width = "1px";
    g.style.height = "100%";
  } else {
    g.style.top = y + "px";
    g.style.left = "0";
    g.style.height = "1px";
    g.style.width = "100%";
  }

  canvas.appendChild(g);
  guides.push(g);
}

/* ======================
   RENDER
====================== */
function render() {
  canvas.innerHTML = "";

  /* BACKGROUND */
  if (background.type === "video") {
    const v = document.createElement("video");
    v.src = background.url;
    v.autoplay = true;
    v.loop = true;
    v.muted = true;
    v.className = "bg-video";
    canvas.appendChild(v);
  } else if (background.type === "image") {
    canvas.style.background = `url(${background.url}) center/cover no-repeat`;
  } else {
    canvas.style.background = "white";
  }

  elements.sort((a,b)=>a.z-b.z);

  elements.forEach(el => {
    const div = document.createElement("div");
    div.className = "element " + el.type;

    div.innerText = el.text;

    div.style.left = el.x + "px";
    div.style.top = el.y + "px";
    div.style.zIndex = el.z;

    /* TEXTO */
    if (el.type !== "panel") {
      div.style.fontSize = el.size + "px";
      div.style.color = el.color;
    }

    /* PANEL */
    if (el.type === "panel") {
      div.style.width = el.width + "px";
      div.style.height = el.height + "px";
      div.style.background = "#ddd";
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
        clearGuides();

        let nx = ev.clientX - rect.left - offsetX;
        let ny = ev.clientY - rect.top - offsetY;

        if (snapEnabled) {
          elements.forEach(o => {
            if (o.id !== el.id) {

              const midX = o.x + o.width / 2;
              const midY = o.y + o.height / 2;

              if (Math.abs(nx - o.x) < 6) {
                nx = o.x;
                createGuide(o.x, 0, true);
              }

              if (Math.abs(ny - o.y) < 6) {
                ny = o.y;
                createGuide(0, o.y, false);
              }

              if (Math.abs(nx - midX) < 6) {
                nx = midX;
                createGuide(midX, 0, true);
              }

              if (Math.abs(ny - midY) < 6) {
                ny = midY;
                createGuide(0, midY, false);
              }
            }
          });
        }

        el.x = nx;
        el.y = ny;

        render();
      }

      function stop() {
        clearGuides();
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", stop);
        saveHistory();
      }

      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", stop);
    };

    /* RESIZE CORRECTO */
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
            el.width = Math.max(20, startW + dx);
            el.height = Math.max(20, startH + dy);
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

      /* BOTÓN ELIMINAR */
      const del = document.createElement("div");
      del.innerText = "✕";
      del.style.position = "absolute";
      del.style.top = "-10px";
      del.style.right = "-10px";
      del.style.background = "red";
      del.style.color = "white";
      del.style.cursor = "pointer";
      del.style.fontSize = "12px";
      del.style.padding = "2px 5px";

      del.onclick = (e) => {
        e.stopPropagation();
        deleteElement();
      };

      div.appendChild(del);
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
    return;
  }

  inputs.text.value = el.text || "";
  inputs.size.value = el.size || "";
  inputs.color.value = el.color || "#000";
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
  background:#ddd;
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
