const canvas = document.getElementById("canvas");

/* INPUTS */
const inputs = {
  text: document.getElementById("prop-text"),
  size: document.getElementById("prop-size"),
  color: document.getElementById("prop-color"),
  screen: document.getElementById("prop-screen")
};

const output = document.getElementById("html-code");

/* ESTADO */
let screens = [[]];
let currentScreen = 0;
let selectedId = null;

let background = { type: null, url: "" };

/* ======================
   PANTALLAS
====================== */
function getElements() {
  return screens[currentScreen];
}

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

/* ======================
   BACKGROUND
====================== */
function setBackground() {
  const url = document.getElementById("bg-url").value.trim();
  if (!url) return;

  background.url = url;
  render();
}

/* ======================
   CREAR
====================== */
function addElement(type) {
  const elements = getElements();

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
    targetScreen: null
  });

  render();
}

/* ======================
   RENDER
====================== */
function render() {
  const elements = getElements();
  canvas.innerHTML = "";

  if (background.url) {
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

    /* CLICK */
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

    /* EDIT */
    div.ondblclick = (e) => {
      e.stopPropagation();
      div.contentEditable = true;
      div.focus();

      div.onblur = () => {
        el.text = div.innerText;
        div.contentEditable = false;
        render();
      };
    };

    /* DRAG */
    div.onmousedown = (e) => {
      const offsetX = e.offsetX;
      const offsetY = e.offsetY;

      function move(ev) {
        el.x = ev.clientX - canvas.offsetLeft - offsetX;
        el.y = ev.clientY - canvas.offsetTop - offsetY;
        render();
      }

      function stop() {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", stop);
      }

      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", stop);
    };

    /* SELECCIÓN */
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

        function resize(ev) {
          el.width = startW + (ev.clientX - startX);
          el.height = startH + (ev.clientY - startY);
          render();
        }

        function stop() {
          document.removeEventListener("mousemove", resize);
          document.removeEventListener("mouseup", stop);
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

    render();
  };
});

/* ======================
   DELETE
====================== */
function deleteElement() {
  screens[currentScreen] = getElements().filter(e => e.id !== selectedId);
  selectedId = null;
  render();
}

/* ======================
   EXPORT (🔥 IMPORTANTE)
====================== */
function generateCode() {
  let code = "";

  code += `<div id="app">\n`;

  screens.forEach((screen, sIndex) => {

    code += `<div class="screen" id="screen-${sIndex}" style="display:${sIndex === 0 ? 'block':'none'}">\n`;

    screen.forEach(el => {
      code += `<div style="position:absolute;left:${el.x}px;top:${el.y}px;font-size:${el.size}px;color:${el.color};cursor:pointer;" onclick="goToScreen(${el.targetScreen})">${el.text}</div>\n`;
    });

    code += `</div>\n`;
  });

  code += `</div>\n`;

  code += `<script>
function goToScreen(n){
  document.querySelectorAll('.screen').forEach(s=>s.style.display='none');
  document.getElementById('screen-'+n).style.display='block';
}
<\/script>`;

  output.textContent = code;
}

/* INIT */
renderScreens();
render();
