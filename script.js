const canvas = document.getElementById("canvas");

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

let background = {
  type: null,
  url: ""
};

let snapEnabled = false;

/* HISTORIAL */
let history = [];
let historyIndex = -1;

function saveHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(JSON.stringify(elements));
  historyIndex++;
}

/* SNAP TOGGLE */
function toggleSnap() {
  snapEnabled = !snapEnabled;
  const btn = event.target;
  btn.style.borderColor = snapEnabled ? "var(--accent)" : "";
}

/* BACKGROUND */
function setBackground() {
  const url = document.getElementById("bg-url").value.trim();
  if (!url) return;

  background.type = url.match(/\.(mp4|webm|ogg)$/i) ? "video" : "image";
  background.url = url;

  render();
}

/* DESELECCIÓN */
canvas.addEventListener("click", (e) => {
  if (e.target === canvas) {
    selectedId = null;
    render();
  }
});

/* CREAR */
function addElement(type) {
  let link = "";
  if (type === "button") {
    link = prompt("Link del botón:", "https://") || "";
  }

  elements.push({
    id: Date.now(),
    type,
    text: type === "button" ? "Botón" : (type === "panel" ? "" : "Nuevo Texto"),
    x: 100,
    y: 100,
    width: 200,
    height: 120,
    size: 20,
    color: "#ffffff",
    link,
    z: elements.length
  });

  saveHistory();
  render();
}

/* RENDER */
function render() {
  canvas.innerHTML = "";

  /* APLICAR FONDO */
  if (background.type === "video") {
    const video = document.createElement("video");
    video.src = background.url;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.className = "bg-video";
    canvas.appendChild(video);
    canvas.style.backgroundImage = "none";
  } else if (background.type === "image") {
    canvas.style.backgroundImage = `url(${background.url})`;
    canvas.style.backgroundSize = "cover";
    canvas.style.backgroundPosition = "center";
  }

  elements.sort((a, b) => a.z - b.z);

  elements.forEach(el => {
    let div;
    if (el.type === "button") {
      div = document.createElement("a");
      div.href = el.link || "#";
      div.className = "element button";
    } else {
      div = document.createElement("div");
      div.className = "element " + el.type;
    }

    div.innerText = el.text;
    div.style.left = el.x + "px";
    div.style.top = el.y + "px";
    div.style.zIndex = el.z;

    if (el.type === "panel") {
      div.style.width = el.width + "px";
      div.style.height = el.height + "px";
    } else {
      div.style.fontSize = el.size + "px";
      div.style.color = el.color;
    }

    if (el.id === selectedId) {
      div.classList.add("selected");
      addHandles(div, el);
    }

    /* EVENTOS */
    div.ondblclick = (e) => {
      e.stopPropagation();
      const txt = prompt("Editar texto:", el.text);
      if (txt !== null) {
        el.text = txt;
        saveHistory();
        render();
      }
    };

    div.onclick = (e) => {
      e.stopPropagation();
      selectedId = el.id;
      // Traer al frente al hacer click
      el.z = Math.max(0, ...elements.map(e => e.z)) + 1;
      updatePanel();
      render();
    };

    div.onmousedown = (e) => {
      if (e.target.classList.contains('handle')) return;
      e.preventDefault();
      
      const offsetX = e.clientX - div.getBoundingClientRect().left;
      const offsetY = e.clientY - div.getBoundingClientRect().top;

      function move(e2) {
        let newX = e2.clientX - canvas.offsetLeft - offsetX;
        let newY = e2.clientY - canvas.offsetTop - offsetY;

        if (snapEnabled) {
          const snap = 15;
          elements.forEach(other => {
            if (other.id !== el.id) {
              if (Math.abs(newX - other.x) < snap) newX = other.x;
              if (Math.abs(newY - other.y) < snap) newY = other.y;
            }
          });
        }
        el.x = newX;
        el.y = newY;
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

    canvas.appendChild(div);
  });

  generateCode();
}

/* HANDLES REDIMENSIÓN */
function addHandles(div, el) {
  const positions = ["br", "tr", "bl", "tl", "r", "l", "t", "b"];
  positions.forEach(pos => {
    const h = document.createElement("div");
    h.className = "handle " + pos;
    h.onmousedown = (e) => {
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = el.width;
      const startH = el.height;
      const startXPos = el.x;
      const startYPos = el.y;
      const startSize = el.size;

      function resize(e2) {
        let dx = e2.clientX - startX;
        let dy = e2.clientY - startY;

        if (el.type === "panel") {
          if (pos.includes("r")) el.width = Math.max(20, startW + dx);
          if (pos.includes("b")) el.height = Math.max(20, startH + dy);
          if (pos.includes("l")) {
             const newW = Math.max(20, startW - dx);
             if (newW > 20) { el.width = newW; el.x = startXPos + dx; }
          }
          if (pos.includes("t")) {
             const newH = Math.max(20, startH - dy);
             if (newH > 20) { el.height = newH; el.y = startYPos + dy; }
          }
        } else {
          el.size = Math.max(8, startSize + dx * 0.2);
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
    div.appendChild(h);
  });
}

/* UI PANEL */
function updatePanel() {
  const el = elements.find(e => e.id === selectedId);
  if (!el) return;
  inputs.text.value = el.text;
  inputs.size.value = el.size;
  inputs.color.value = el.color;
  inputs.link.value = el.link;
}

Object.keys(inputs).forEach(k => {
  inputs[k].oninput = () => {
    const el = elements.find(e => e.id === selectedId);
    if (!el) return;
    el[k] = k === "size" ? parseInt(inputs[k].value) : inputs[k].value;
    render();
  };
});

function deleteElement() {
  if (!selectedId) return;
  elements = elements.filter(e => e.id !== selectedId);
  selectedId = null;
  saveHistory();
  render();
}

/* UNDO / REDO */
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

/* EXPORTAR */
function generateCode() {
  let html = "";
  let css = "";
  elements.forEach((el, i) => {
    const c = "el-" + i;
    if (el.type === "button") {
      html += `<a class="${c}" href="${el.link}">${el.text}</a>\n`;
    } else {
      html += `<div class="${c}">${el.text}</div>\n`;
    }

    css += `.${c} {\n  position: absolute;\n  left: ${el.x}px;\n  top: ${el.y}px;\n  z-index: ${el.z};\n`;
    if (el.type === "panel") {
      css += `  width: ${el.width}px;\n  height: ${el.height}px;\n  background: rgba(255,255,255,0.1);\n  backdrop-filter: blur(10px);\n  border-radius: 12px;\n`;
    } else {
      css += `  font-size: ${el.size}px;\n  color: ${el.color};\n`;
      if (el.type === "button") css += `  background: #00f0ff; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 8px;\n`;
    }
    css += `}\n\n`;
  });
  htmlOut.textContent = html;
  cssOut.textContent = css;
}

saveHistory();
render();
