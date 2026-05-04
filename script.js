const canvas = document.getElementById("canvas");

const inputs = {
  text: document.getElementById("prop-text"),
  size: document.getElementById("prop-size"),
  color: document.getElementById("prop-color"),
  link: document.getElementById("prop-link"),
  targetScreen: document.getElementById("prop-target-screen")
};

const htmlOut = document.getElementById("html-code");
const cssOut = document.getElementById("css-code");
const screenSelect = document.getElementById("screen-select");

/* ESTADO MULTI-PANTALLA */
let screens = [
  { id: 'screen-1', name: 'Inicio', bg: { type: null, url: "" } }
];
let currentScreenId = 'screen-1';
let screenCounter = 1;

let elements = [];
let selectedId = null;
let snapEnabled = false;

/* HISTORIAL */
let history = [];
let historyIndex = -1;

function saveHistory() {
  history = history.slice(0, historyIndex + 1);
  // Guardamos tanto pantallas como elementos para deshacer cambios profundos
  history.push(JSON.stringify({ screens, elements, currentScreenId }));
  historyIndex++;
}

/* =========================
   PANTALLAS
========================= */
function updateScreenUI() {
  // Actualizar selector principal
  screenSelect.innerHTML = "";
  screens.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    if (s.id === currentScreenId) opt.selected = true;
    screenSelect.appendChild(opt);
  });

  // Actualizar selector de destino (propiedades)
  const currentTarget = inputs.targetScreen.value;
  inputs.targetScreen.innerHTML = '<option value="">-- No ir a ninguna --</option>';
  screens.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `Ir a: ${s.name}`;
    inputs.targetScreen.appendChild(opt);
  });
  inputs.targetScreen.value = currentTarget; // restaurar selección si existía
}

function addScreen() {
  screenCounter++;
  const newId = `screen-${screenCounter}`;
  screens.push({ id: newId, name: `Pantalla ${screenCounter}`, bg: { type: null, url: "" } });
  switchScreen(newId);
}

function switchScreen(id) {
  currentScreenId = id;
  selectedId = null; // Deseleccionar al cambiar de pantalla
  
  // Actualizar input de fondo con el fondo de la pantalla actual
  const currentScreen = screens.find(s => s.id === id);
  document.getElementById("bg-url").value = currentScreen.bg.url || "";
  
  updateScreenUI();
  saveHistory();
  render();
}

function deleteScreen() {
  if (screens.length <= 1) {
    alert("No puedes eliminar la única pantalla.");
    return;
  }
  
  // Eliminar elementos de esta pantalla
  elements = elements.filter(e => e.screenId !== currentScreenId);
  // Eliminar pantalla
  screens = screens.filter(s => s.id !== currentScreenId);
  
  // Cambiar a la primera que quede
  switchScreen(screens[0].id);
}

/* =========================
   SNAP TOGGLE
========================= */
function toggleSnap() {
  snapEnabled = !snapEnabled;
}

/* =========================
   BACKGROUND
========================= */
function setBackground() {
  const url = document.getElementById("bg-url").value.trim();
  const currentScreen = screens.find(s => s.id === currentScreenId);
  
  if (!url) {
    currentScreen.bg = { type: null, url: "" };
  } else {
    currentScreen.bg.type = url.match(/\.(mp4|webm|ogg)$/i) ? "video" : "image";
    currentScreen.bg.url = url;
  }

  saveHistory();
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
  elements.push({
    id: Date.now(),
    screenId: currentScreenId, // 🔥 Se asigna a la pantalla actual
    type,
    text: type === "button" ? "Botón" : "Texto",
    x: 100,
    y: 100,
    width: 150,
    height: 80,
    size: 20,
    color: "#000000",
    link: "",
    targetScreen: "", // 🔥 Nueva propiedad para navegación
    z: elements.filter(e => e.screenId === currentScreenId).length
  });

  saveHistory();
  render();
}

/* =========================
   RENDER
========================= */
function render() {
  updateScreenUI();
  canvas.innerHTML = "";
  
  const currentScreen = screens.find(s => s.id === currentScreenId);

  /* BACKGROUND */
  if (currentScreen.bg.type === "video") {
    const video = document.createElement("video");
    video.src = currentScreen.bg.url;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.className = "bg-video";
    canvas.appendChild(video);
    canvas.style.background = "none";
  } else if (currentScreen.bg.type === "image") {
    const img = new Image();
    img.src = currentScreen.bg.url;
    img.onload = () => {
      const mode = (img.width / img.height) > (canvas.clientWidth / canvas.clientHeight) ? "contain" : "cover";
      canvas.style.background = `url('${currentScreen.bg.url}') center/${mode} no-repeat`;
    };
  } else {
    canvas.style.background = "white";
  }

  /* ORDEN DE LA PANTALLA ACTUAL */
  let currentElements = elements.filter(e => e.screenId === currentScreenId);
  currentElements.sort((a,b) => a.z - b.z);

  currentElements.forEach(el => {
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

    if (el.type !== "panel") {
      div.style.fontSize = el.size + "px";
      div.style.color = el.color;
      div.style.background = "transparent";
    } else {
      div.style.width = el.width + "px";
      div.style.height = el.height + "px";
    }

    if (el.id === selectedId) {
      div.classList.add("selected");
      addHandles(div, el);
    }

    /* EDIT */
    div.ondblclick = (e) => {
      e.stopPropagation();
      const txt = prompt("Editar texto:", el.text);
      if (txt !== null) {
        el.text = txt;
        saveHistory();
        render();
      }
    };

    /* CLICK */
    div.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault(); // Evitar saltar de links en el editor
      selectedId = el.id;
      el.z = Math.max(...currentElements.map(e => e.z)) + 1;
      updatePanel();
      saveHistory();
      render();
    };

    /* DRAG */
    div.onmousedown = (e) => {
      e.preventDefault();
      const offsetX = e.offsetX;
      const offsetY = e.offsetY;
      selectedId = el.id;
      updatePanel();

      function move(e2) {
        let newX = e2.clientX - canvas.offsetLeft - offsetX;
        let newY = e2.clientY - canvas.offsetTop - offsetY;

        if (snapEnabled) {
          const snap = 10;
          currentElements.forEach(other => {
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

/* =========================
   HANDLES
========================= */
function addHandles(div, el) {
  const positions = ["br","tr","bl","tl","r","l","t","b"];

  positions.forEach(pos => {
    const h = document.createElement("div");
    h.className = "handle " + pos;

    h.onmousedown = (e) => {
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = el.width;
      const startH = el.height;
      const startSize = el.size;

      function resize(e2) {
        let dx = e2.clientX - startX;
        let dy = e2.clientY - startY;

        if (el.type === "panel") {
          if (pos.includes("r")) el.width = startW + dx;
          if (pos.includes("l")) el.width = startW - dx;
          if (pos.includes("b")) el.height = startH + dy;
          if (pos.includes("t")) el.height = startH - dy;
        }

        if (el.type !== "panel") {
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

    div.appendChild(h);
  });
}

/* =========================
   PROPIEDADES
========================= */
function updatePanel() {
  const el = elements.find(e => e.id === selectedId);
  if (!el) {
    Object.keys(inputs).forEach(k => inputs[k].value = "");
    return;
  }

  inputs.text.value = el.text || "";
  inputs.size.value = el.size || "";
  inputs.color.value = el.color || "#000000";
  inputs.link.value = el.link || "";
  inputs.targetScreen.value = el.targetScreen || "";
}

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
   ELIMINAR
========================= */
function deleteElement() {
  if (!selectedId) return;
  elements = elements.filter(e => e.id !== selectedId);
  selectedId = null;
  updatePanel();
  saveHistory();
  render();
}

/* =========================
   UNDO / REDO
========================= */
function undo() {
  if (historyIndex <= 0) return;
  historyIndex--;
  const state = JSON.parse(history[historyIndex]);
  screens = state.screens;
  elements = state.elements;
  currentScreenId = state.currentScreenId;
  updatePanel();
  render();
}

function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex++;
  const state = JSON.parse(history[historyIndex]);
  screens = state.screens;
  elements = state.elements;
  currentScreenId = state.currentScreenId;
  updatePanel();
  render();
}

/* =========================
   GENERAR CÓDIGO 🔥 (MULTIPLE SCREENS)
========================= */
function generateCode() {
  // Inyectamos un poco de JS y CSS en el HTML generado para que las pantallas cambien solas
  let html = `<style>
  body { margin: 0; font-family: sans-serif; overflow-x: hidden; }
  .screen { display: none; width: 100vw; height: 100vh; position: relative; overflow: hidden; }
  .screen.active { display: block; }
  .bg-video { position: absolute; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
</style>\n\n`;

  let jsCode = `<script>
  function goToScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
  }
</script>\n`;

  let css = "";

  screens.forEach((screen, sIdx) => {
    const isActive = sIdx === 0 ? " active" : "";
    let bgStyle = "";
    let videoHtml = "";

    if (screen.bg.type === "image") {
      bgStyle = ` style="background: url('${screen.bg.url}') center/cover no-repeat;"`;
    } else if (screen.bg.type === "video") {
      videoHtml = `  <video class="bg-video" autoplay loop muted><source src="${screen.bg.url}"></video>\n`;
    }

    html += `<div id="${screen.id}" class="screen${isActive}"${bgStyle}>\n`;
    html += videoHtml;

    const screenEls = elements.filter(e => e.screenId === screen.id);
    
    screenEls.forEach(el => {
      const c = "el_" + el.id;
      
      // Lógica de navegación
      let clickAction = "";
      let cursorStyle = "";
      if (el.targetScreen) {
        clickAction = ` onclick="goToScreen('${el.targetScreen}')"`;
        cursorStyle = ` cursor: pointer;`;
      } else if (el.link) {
        clickAction = ` href="${el.link}"`;
      }

      if (el.type === "button" || el.link) {
        html += `  <a class="${c}"${clickAction} style="text-decoration:none;">${el.text}</a>\n`;
      } else {
        html += `  <div class="${c}"${clickAction}>${el.type === "text" ? el.text : ""}</div>\n`;
      }

      css += `.${c} {
  position: absolute;
  left: ${el.x}px;
  top: ${el.y}px;
  z-index: ${el.z};${cursorStyle}
}\n`;

      if (el.type === "panel") {
        css += `.${c} {
  width: ${el.width}px;
  height: ${el.height}px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  border: 1px solid rgba(255,255,255,0.2);
}\n`;
      }

      if (el.type !== "panel") {
        css += `.${c} {
  font-size: ${el.size}px;
  color: ${el.color};
  display: flex;
  align-items: center;
  justify-content: center;
}\n`;
      }
      
      if (el.type === "button") {
         css += `.${c} {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.2);
  backdrop-filter: blur(4px);
}\n`;
      }
    });

    html += `</div>\n\n`;
  });

  // Juntamos todo el HTML
  htmlOut.textContent = html + jsCode;
  cssOut.textContent = css;
}

/* INIT */
saveHistory();
render();
