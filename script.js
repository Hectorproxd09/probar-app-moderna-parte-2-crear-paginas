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
let currentScreen = 1;

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

/* =========================
   PANTALLAS
========================= */
function changeScreen(screen) {
  currentScreen = screen;
  selectedId = null;
  render();
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
  let targetScreen = 0;

  if (type === "button") {
    const s = prompt("Ir a pantalla (0 = ninguna):", "0");
    targetScreen = parseInt(s) || 0;
  }

  elements.push({
    id: Date.now(),
    type,
    text: type === "button" ? "Botón" : "Texto",
    x: 100,
    y: 100,
    width: 150,
    height: 80,
    size: 20,
    color: "#000000",
    link: "",
    targetScreen,
    screen: currentScreen, // 🔥 clave
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

  /* BACKGROUND */
  if (background.type === "video") {
    const video = document.createElement("video");
    video.src = background.url;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.className = "bg-video";
    canvas.appendChild(video);
  } else if (background.type === "image") {
    canvas.style.background = `url(${background.url}) center/cover no-repeat`;
  } else {
    canvas.style.background = "white";
  }

  /* 🔥 FILTRAR SOLO PANTALLA ACTUAL */
  const visible = elements.filter(el => el.screen === currentScreen);

  visible.sort((a,b)=>a.z-b.z);

  visible.forEach(el => {
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

      // 🔥 SOLO botones cambian pantalla
      if (el.type === "button" && el.targetScreen !== 0) {
        changeScreen(el.targetScreen);
        return;
      }

      selectedId = el.id;
      el.z = Math.max(...elements.map(e=>e.z)) + 1;

      updatePanel();
      render();
    };

    /* EDIT INLINE (NO BUG) */
    div.ondblclick = (e) => {
      e.stopPropagation();

      div.contentEditable = true;
      div.focus();

      function save() {
        el.text = div.innerText;
        div.contentEditable = false;
        saveHistory();
        updatePanel();
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

    /* DRAG (ESTABLE) */
    div.onmousedown = (e) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - el.x;
      const offsetY = e.clientY - rect.top - el.y;

      function move(ev) {
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

    /* SELECCIÓN */
    if (el.id === selectedId) {
      div.classList.add("selected");
    }

    canvas.appendChild(div);
  });

  generateCode();
}

/* =========================
   PROPIEDADES
========================= */
function updatePanel() {
  const el = elements.find(e => e.id === selectedId);

  if (!el) {
    inputs.text.value = "";
    inputs.size.value = "";
    inputs.color.value = "#000000";
    return;
  }

  inputs.text.value = el.text;
  inputs.size.value = el.size;
  inputs.color.value = el.color;
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
   DELETE
========================= */
function deleteElement() {
  elements = elements.filter(e => e.id !== selectedId);
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
saveHistory();
render();
