const canvas = document.getElementById("canvas");

/* INPUTS */
const inputs = {
  text: document.getElementById("prop-text"),
  size: document.getElementById("prop-size"),
  color: document.getElementById("prop-color"),
  screen: document.getElementById("prop-screen")
};

const htmlOut = document.getElementById("html-code");
const cssOut = document.getElementById("css-code");

/* ESTADO */
let screens = [[]];
let currentScreen = 0;
let elements = screens[currentScreen];
let selectedId = null;

let background = { type: null, url: "" };
let snapEnabled = false;

/* HISTORIAL */
let history = [];
let historyIndex = -1;

function saveHistory() {
  history.push(JSON.stringify(screens));
  historyIndex++;
}

/* =========================
   PANTALLAS
========================= */
function addScreen() {
  screens.push([]);
  renderScreens();
}

function switchScreen(i) {
  currentScreen = i;
  elements = screens[currentScreen];
  selectedId = null;
  render();
}

function renderScreens() {
  const list = document.getElementById("screen-list");
  list.innerHTML = "";

  screens.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.innerText = "Pantalla " + i;
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
    text: "Texto",
    x: 100,
    y: 100,
    width: 150,
    height: 80,
    size: 20,
    color: "#000",
    targetScreen: null,
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

  if (background.type === "video") {
    const v = document.createElement("video");
    v.src = background.url;
    v.autoplay = true;
    v.loop = true;
    v.muted = true;
    v.className = "bg-video";
    canvas.appendChild(v);
  } else if (background.type === "image") {
    canvas.style.background = `url(${background.url}) center/cover`;
  } else {
    canvas.style.background = "white";
  }

  elements.forEach(el => {
    const div = document.createElement("div");
    div.className = "element " + el.type;
    div.innerText = el.text;

    div.style.left = el.x + "px";
    div.style.top = el.y + "px";

    if (el.type !== "panel") {
      div.style.fontSize = el.size + "px";
      div.style.color = el.color;
    }

    if (el.type === "panel") {
      div.style.width = el.width + "px";
      div.style.height = el.height + "px";
    }

    div.onclick = (e) => {
      e.stopPropagation();

      if (el.targetScreen !== null) {
        switchScreen(el.targetScreen);
        return;
      }

      selectedId = el.id;
      updatePanel();
      render();
    };

    canvas.appendChild(div);
  });

  generateCode();
}

/* =========================
   PROPIEDADES
========================= */
function updatePanel() {
  const el = elements.find(e => e.id === selectedId);
  if (!el) return;

  inputs.text.value = el.text;
  inputs.size.value = el.size;
  inputs.color.value = el.color;
  inputs.screen.value = el.targetScreen ?? "";
}

Object.keys(inputs).forEach(k => {
  inputs[k].oninput = () => {
    const el = elements.find(e => e.id === selectedId);
    if (!el) return;

    if (k === "screen") {
      el.targetScreen = inputs.screen.value === "" ? null : Number(inputs.screen.value);
    } else {
      el[k] = inputs[k].value;
    }

    saveHistory();
    render();
  };
});

/* =========================
   ELIMINAR
========================= */
function deleteElement() {
  elements = elements.filter(e => e.id !== selectedId);
  selectedId = null;
  render();
}

/* =========================
   GENERAR
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
  });

  htmlOut.textContent = html;
  cssOut.textContent = css;
}

/* INIT */
renderScreens();
render();
