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
let currentScreen = "home";

let background = { type: null, url: "" };

/* HISTORIAL */
let history = [];
let historyIndex = -1;

function saveHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(JSON.stringify(elements));
  historyIndex++;
}

/* SNAP */
function toggleSnap() {
  snapEnabled = !snapEnabled;
  document.querySelector(".topbar button:nth-child(6)").textContent =
    snapEnabled ? "☑ Snap" : "☐ Snap";
}

/* CAMBIAR PANTALLA */
function goToScreen(name) {
  currentScreen = name;
  selectedId = null;
  render();
}

/* BACKGROUND */
function setBackground() {
  const url = document.getElementById("bg-url").value.trim();
  if (!url) return;

  background.type = url.match(/\.(mp4|webm|ogg)$/i) ? "video" : "image";
  background.url = url;

  render();
}

/* CREAR */
function addElement(type) {
  let link = "";

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
    font: "Arial",
    glass: true,
    link,
    z: elements.length,
    screen: currentScreen
  });

  saveHistory();
  render();
}

/* RENDER */
function render() {
  canvas.innerHTML = "";

  /* FILTRO POR PANTALLA */
  let visible = elements.filter(e => e.screen === currentScreen);

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

  visible.sort((a,b)=>a.z-b.z);

  visible.forEach(el => {
    let d = document.createElement("div");
    d.className = "element";

    d.innerText = el.text;
    d.style.left = el.x+"px";
    d.style.top = el.y+"px";
    d.style.zIndex = el.z;

    /* TEXTO */
    if (el.type === "text") {
      d.style.fontSize = el.size+"px";
      d.style.color = el.color;
      d.style.fontFamily = el.font;
    }

    /* PANEL */
    if (el.type === "panel") {
      d.style.width = el.width+"px";
      d.style.height = el.height+"px";

      if (el.glass) {
        d.style.background = "rgba(255,255,255,0.1)";
        d.style.backdropFilter = "blur(10px)";
      } else {
        d.style.background = el.color;
      }
    }

    /* LINK (cualquier elemento) */
    if (el.link) {
      d.style.cursor = "pointer";

      d.onclick = (e) => {
        e.stopPropagation();

        if (el.link.startsWith("screen:")) {
          goToScreen(el.link.replace("screen:", ""));
        } else {
          window.open(el.link, "_blank");
        }
      };
    }

    /* SELECCIÓN */
    d.onclick = (e) => {
      e.stopPropagation();
      selectedId = el.id;
      updatePanel();
      render();
    };

    /* EDIT INLINE */
    d.ondblclick = (e) => {
      e.stopPropagation();
      d.contentEditable = true;
      d.focus();

      d.onblur = () => {
        el.text = d.innerText;
        updatePanel();
        saveHistory();
        render();
      };
    };

    /* DRAG */
    d.onmousedown = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const ox = e.clientX - el.x - rect.left;
      const oy = e.clientY - el.y - rect.top;

      function move(ev) {
        let nx = ev.clientX - rect.left - ox;
        let ny = ev.clientY - rect.top - oy;

        if (snapEnabled) {
          elements.forEach(o => {
            if (o.id !== el.id) {
              if (Math.abs(nx - o.x) < 8) nx = o.x;
              if (Math.abs(ny - o.y) < 8) ny = o.y;
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

    if (el.id === selectedId) {
      d.classList.add("selected");
    }

    canvas.appendChild(d);
  });

  generateCode();
}

/* PANEL DINÁMICO */
function updatePanel() {
  const el = elements.find(e => e.id === selectedId);
  if (!el) return;

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

/* DELETE */
function deleteElement() {
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

/* EXPORT */
function generateCode() {
  let html = "";
  let css = "body{margin:0;position:relative;}";

  elements.forEach((el,i)=>{
    const c="el"+i;

    html += `<div class="${c}">${el.text}</div>\n`;

    css += `.${c}{position:absolute;left:${el.x}px;top:${el.y}px;z-index:${el.z};}`;

    if (el.type === "text") {
      css += `.${c}{font-size:${el.size}px;color:${el.color};font-family:${el.font};}`;
    }

    if (el.type === "panel") {
      css += `.${c}{width:${el.width}px;height:${el.height}px;background:${el.glass?"rgba(255,255,255,0.1)":el.color};}`;
    }
  });

  htmlOut.textContent = html;
  cssOut.textContent = css;
}

saveHistory();
render();
