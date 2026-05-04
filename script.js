const canvas = document.getElementById("canvas");

const inputs = {
  text: document.getElementById("prop-text"),
  size: document.getElementById("prop-size"),
  color: document.getElementById("prop-color"),
  screen: document.getElementById("prop-screen")
};

const htmlOut = document.getElementById("html-code");
const cssOut = document.getElementById("css-code");
const jsOut = document.getElementById("js-code");

/* =========================
   ESTADO
========================= */
let screens = [[]];
let currentScreen = 0;

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
  history.push(JSON.stringify(screens));
  historyIndex++;
}

/* =========================
   PANTALLAS
========================= */
function addScreen() {
  screens.push([]);
  updateScreenUI();
}

function switchScreen(index) {
  currentScreen = index;
  selectedId = null;
  updatePanel();
  render();
}

function updateScreenUI() {
  const list = document.getElementById("screen-list");
  list.innerHTML = "";

  screens.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.innerText = "Pantalla " + (i + 1);
    btn.onclick = () => switchScreen(i);
    list.appendChild(btn);
  });
}

/* =========================
   SNAP
========================= */
function toggleSnap() {
  snapEnabled = !snapEnabled;
}

/* =========================
   BACKGROUND
========================= */
function setBackground() {
  const url = document.getElementById("bg-url").value.trim();
  if (!url) return;

  background.type = url.match(/\.(mp4|webm|ogg)$/i) ? "video" : "image";
  background.url = url;

  render();
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
  screens[currentScreen].push({
    id: Date.now(),
    type,
    text: type === "button" ? "Botón" : "Texto",
    x: 100,
    y: 100,
    width: 150,
    height: 80,
    size: 20,
    color: "#000000",
    targetScreen: null,
    z: screens[currentScreen].length
  });

  saveHistory();
  render();
}

/* =========================
   RENDER
========================= */
function render() {
  canvas.innerHTML = "";

  /* BACKGROUND */
  if (background.type === "video") {
    const video = document.createElement("video");
    video.src = background.url;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.className = "bg-video";
    canvas.appendChild(video);
    canvas.style.background = "none";
  } else if (background.type === "image") {
    canvas.style.background = `url(${background.url}) center/cover no-repeat`;
  } else {
    canvas.style.background = "white";
  }

  const elements = screens[currentScreen];
  elements.sort((a,b) => a.z - b.z);

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

    let isDragging = false;

    /* CLICK (🔥 AHORA FUNCIONA BIEN) */
    div.onclick = (e) => {
      e.stopPropagation();

      if (isDragging) return; // evita conflicto drag

      if (el.targetScreen !== null) {
        switchScreen(el.targetScreen);
        return;
      }

      selectedId = el.id;
      el.z = Math.max(...elements.map(e => e.z)) + 1;
      updatePanel();
      render();
    };

    /* DRAG */
    div.onmousedown = (e) => {
      e.preventDefault();
      isDragging = false;

      const rect = canvas.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - el.x;
      const offsetY = e.clientY - rect.top - el.y;

      function move(ev) {
        isDragging = true;

        let nx = ev.clientX - rect.left - offsetX;
        let ny = ev.clientY - rect.top - offsetY;

        el.x = nx;
        el.y = ny;

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

    /* HANDLE */
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

      const del = document.createElement("div");
      del.innerText = "✕";
      del.style.position = "absolute";
      del.style.top = "-10px";
      del.style.right = "-10px";
      del.style.background = "red";
      del.style.color = "white";
      del.style.cursor = "pointer";

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

/* =========================
   PROPIEDADES
========================= */
function updatePanel() {
  const el = screens[currentScreen].find(e => e.id === selectedId);
  if (!el) return;

  inputs.text.value = el.text;
  inputs.size.value = el.size;
  inputs.color.value = el.color;
  inputs.screen.value = el.targetScreen ?? "";
}

Object.keys(inputs).forEach(k => {
  inputs[k].oninput = () => {
    const el = screens[currentScreen].find(e => e.id === selectedId);
    if (!el) return;

    if (k === "screen") {
      el.targetScreen = inputs[k].value === "" ? null : Number(inputs[k].value);
    } else {
      el[k] = inputs[k].value;
    }

    saveHistory();
    render();
  };
});

/* =========================
   DELETE
========================= */
function deleteElement() {
  screens[currentScreen] = screens[currentScreen].filter(e => e.id !== selectedId);
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
  screens = JSON.parse(history[historyIndex]);
  render();
}

function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex++;
  screens = JSON.parse(history[historyIndex]);
  render();
}

/* =========================
   EXPORT
========================= */
function generateCode() {
  let html = "";
  let css = "";
  let js = "";

  html += `<div id="app">\n`;

  screens.forEach((screen, sIndex) => {

    html += `<div class="screen" id="screen-${sIndex}" style="display:${sIndex === 0 ? 'block':'none'}">\n`;

    screen.forEach((el, i) => {
      const c = `el_${sIndex}_${i}`;

      html += `<div class="${c}"`;

      if (el.targetScreen !== null) {
        html += ` onclick="goToScreen(${el.targetScreen})"`;
      }

      html += `>${el.text}</div>\n`;

      css += `.${c}{
  position:absolute;
  left:${el.x}px;
  top:${el.y}px;
}\n`;

      if (el.type === "panel") {
        css += `.${c}{
  width:${el.width}px;
  height:${el.height}px;
  background: rgba(255,255,255,0.2);
}\n`;
      } else {
        css += `.${c}{
  font-size:${el.size}px;
  color:${el.color};
}\n`;
      }
    });

    html += `</div>\n`;
  });

  html += `</div>`;

  css += `
.screen {
  position: relative;
  width: 100%;
  height: 100vh;
}
`;

  js += `
function goToScreen(n){
  document.querySelectorAll('.screen').forEach(s => s.style.display='none');
  document.getElementById('screen-' + n).style.display='block';
}
`;

  htmlOut.textContent = html;
  cssOut.textContent = css;
  jsOut.textContent = js;
}

/* INIT */
updateScreenUI();
saveHistory();
render();
