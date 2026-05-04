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
let selectedId = null;

let background = { type: null, url: "" };
let snapEnabled = false;

/* HISTORIAL */
let history = [];
let historyIndex = -1;

function getElements() {
  return screens[currentScreen];
}

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
    updatePanel();
    render();
  }
});

/* =========================
   CREAR
========================= */
function addElement(type) {
  const elements = getElements();

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
  const elements = getElements();

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
    canvas.style.background = `url(${background.url}) center/cover`;
  } else {
    canvas.style.background = "white";
  }

  elements.sort((a,b)=>a.z-b.z);

  elements.forEach(el => {
    let div;

    if (el.type === "button") {
      div = document.createElement("div");
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
    }

    if (el.type === "panel") {
      div.style.width = el.width + "px";
      div.style.height = el.height + "px";
    }

    /* CLICK */
    div.onclick = (e) => {
      e.stopPropagation();

      if (el.targetScreen !== null) {
        switchScreen(el.targetScreen);
        return;
      }

      selectedId = el.id;
      el.z = Math.max(...elements.map(e=>e.z)) + 1;

      updatePanel();
      render();
    };

    /* DOBLE CLICK EDIT */
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

      selectedId = el.id;

      function move(ev) {
        let nx = ev.clientX - rect.left - offsetX;
        let ny = ev.clientY - rect.top - offsetY;

        if (snapEnabled) {
          getElements().forEach(o => {
            if (o.id !== el.id) {
              if (Math.abs(nx - o.x) < 6) nx = o.x;
              if (Math.abs(ny - o.y) < 6) ny = o.y;
            }
          });
        }

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

    /* RESIZE */
    if (el.id === selectedId) {
      div.classList.add("selected");

      const handle = document.createElement("div");
      handle.className = "handle br";

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

      /* DELETE BUTTON */
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

/* =========================
   PROPIEDADES
========================= */
function updatePanel() {
  const el = getElements().find(e => e.id === selectedId);
  if (!el) return;

  inputs.text.value = el.text;
  inputs.size.value = el.size;
  inputs.color.value = el.color;
  inputs.screen.value = el.targetScreen ?? "";
}

Object.keys(inputs).forEach(k => {
  inputs[k].oninput = () => {
    const el = getElements().find(e => e.id === selectedId);
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
   DELETE
========================= */
function deleteElement() {
  let elements = getElements();
  elements = elements.filter(e => e.id !== selectedId);
  screens[currentScreen] = elements;
  selectedId = null;

  saveHistory();
  render();
}

/* =========================
   EXPORT
========================= */
function generateCode() {
  let html = "";
  let css = "";

  getElements().forEach((el, i) => {
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
