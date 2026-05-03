const canvas = document.getElementById("canvas");
const htmlOut = document.getElementById("html-code");
const cssOut = document.getElementById("css-code");

let elements = [];
let selectedId = null;
let background = { type: null, url: "" };

/* CREAR ELEMENTOS */
function addElement(type) {
    const el = {
        id: Date.now(),
        type: type,
        text: type === "panel" ? "" : "Haz doble clic",
        x: 100, y: 100,
        width: 150, height: 100,
        size: 20, color: "#ffffff",
        z: elements.length
    };
    elements.push(el);
    selectedId = el.id;
    render();
}

/* TECLA BORRAR */
window.addEventListener('keydown', (e) => {
    if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        // No borrar si estamos editando texto dentro de un div
        if (document.activeElement.isContentEditable) return;
        elements = elements.filter(el => el.id !== selectedId);
        selectedId = null;
        render();
    }
});

/* RENDERIZADO */
function render() {
    canvas.innerHTML = "";

    // Fondo
    if (background.url) {
        if (background.type === "video") {
            const v = document.createElement("video");
            v.src = background.url; v.autoplay = v.loop = v.muted = true;
            v.style = "position:absolute; width:100%; height:100%; object-fit:cover; pointer-events:none;";
            canvas.appendChild(v);
        } else {
            canvas.style.backgroundImage = `url(${background.url})`;
        }
    }

    elements.forEach(el => {
        const div = document.createElement("div");
        div.className = `element ${el.type} ${el.id === selectedId ? 'selected' : ''}`;
        div.style.left = el.x + "px";
        div.style.top = el.y + "px";
        div.style.zIndex = el.z;
        
        if (el.type === "panel") {
            div.style.width = el.width + "px";
            div.style.height = el.height + "px";
        } else {
            div.style.fontSize = el.size + "px";
            div.style.color = el.color;
            div.contentEditable = (el.id === selectedId); // Editable si está seleccionado
        }

        div.innerText = el.text;

        // Guardar texto al editarlo directamente
        div.oninput = () => { el.text = div.innerText; generateCode(); };

        // Drag and Drop
        div.onmousedown = (e) => {
            if (document.activeElement === div) return;
            selectedId = el.id;
            let startX = e.clientX - el.x;
            let startY = e.clientY - el.y;
            
            function move(e2) {
                el.x = e2.clientX - startX;
                el.y = e2.clientY - startY;
                render();
            }
            document.onmousemove = move;
            document.onmouseup = () => { document.onmousemove = null; generateCode(); };
            render();
        };

        if (el.id === selectedId && el.type === "panel") addResizeHandle(div, el);
        
        canvas.appendChild(div);
    });
    generateCode();
}

function addResizeHandle(div, el) {
    const h = document.createElement("div");
    h.className = "handle br";
    h.onmousedown = (e) => {
        e.stopPropagation();
        function resize(e2) {
            el.width = e2.clientX - div.getBoundingClientRect().left;
            el.height = e2.clientY - div.getBoundingClientRect().top;
            render();
        }
        document.onmousemove = resize;
        document.onmouseup = () => { document.onmousemove = null; generateCode(); };
    };
    div.appendChild(h);
}

/* FONDO */
function setBackground() {
    const url = document.getElementById("bg-url").value;
    background.url = url;
    background.type = url.match(/\.(mp4|webm)$/i) ? "video" : "image";
    render();
}

/* GENERAR CÓDIGO (EXPORTAR) */
function generateCode() {
    let html = "";
    let css = `body {\n  margin: 0; height: 100vh;\n`;
    
    if (background.url) {
        if (background.type === "image") css += `  background: url('${background.url}') center/cover;\n`;
    }
    css += `}\n`;

    if (background.type === "video") {
        html += `<video src="${background.url}" autoplay loop muted style="position:fixed; width:100%; height:100%; object-fit:cover; z-index:-1;"></video>\n`;
    }

    elements.forEach((el, i) => {
        html += `<div class="el-${i}">${el.text}</div>\n`;
        css += `.el-${i} {\n  position: absolute; left: ${el.x}px; top: ${el.y}px;\n`;
        if (el.type === "panel") {
            css += `  width: ${el.width}px; height: ${el.height}px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px;\n`;
        } else {
            css += `  font-size: ${el.size}px; color: ${el.color};\n`;
        }
        css += `}\n`;
    });

    htmlOut.innerText = html;
    cssOut.innerText = css;
}

canvas.onclick = (e) => { if (e.target === canvas) { selectedId = null; render(); } };
