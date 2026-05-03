let elements = [];
let selectedId = null;
let background = { type: 'none', url: '' };

const canvas = document.getElementById('canvas');

// AGREGAR ELEMENTO
function addElement(type) {
    const el = {
        id: Date.now(),
        type: type,
        text: type === 'text' ? 'Escribe aquí...' : '',
        x: 150, y: 150,
        w: 200, h: 150,
        color: '#ffffff',
        size: 24
    };
    elements.push(el);
    selectedId = el.id;
    render();
}

// FONDO
function applyBackground() {
    const url = document.getElementById('bg-input').value;
    if(!url) return;
    background.url = url;
    background.type = url.match(/\.(mp4|webm)$/i) ? 'video' : 'image';
    render();
}

// BORRAR CON TECLA DELETE O BACKSPACE
window.addEventListener('keydown', (e) => {
    if((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // No borrar si el usuario está escribiendo dentro de un elemento
        if(document.activeElement.isContentEditable) return;
        elements = elements.filter(el => el.id !== selectedId);
        selectedId = null;
        render();
    }
});

// ACTUALIZAR ESTILOS DESDE INPUTS
function updateStyle() {
    const el = elements.find(e => e.id === selectedId);
    if(!el) return;
    el.color = document.getElementById('style-color').value;
    el.size = document.getElementById('style-size').value;
    render();
}

// RENDERIZAR LIENZO
function render() {
    canvas.innerHTML = '';

    // Aplicar Fondo
    if(background.type === 'video') {
        const video = document.createElement('video');
        video.src = background.url; video.autoplay = video.loop = video.muted = true;
        video.className = 'bg-video';
        canvas.appendChild(video);
    } else if(background.type === 'image') {
        canvas.style.backgroundImage = `url(${background.url})`;
    }

    elements.forEach(el => {
        const div = document.createElement('div');
        div.className = `element ${el.type} ${el.id === selectedId ? 'selected' : ''}`;
        div.style.left = el.x + 'px';
        div.style.top = el.y + 'px';

        if(el.type === 'panel') {
            div.style.width = el.w + 'px';
            div.style.height = el.h + 'px';
        } else {
            div.style.color = el.color;
            div.style.fontSize = el.size + 'px';
            div.contentEditable = (el.id === selectedId);
            div.innerText = el.text;
            
            // Guardar texto al perder el foco
            div.onblur = () => { el.text = div.innerText; exportCode(); };
        }

        // Movimiento (Drag)
        div.onmousedown = (e) => {
            if(e.target.classList.contains('resizer')) return;
            selectedId = el.id;
            
            let startX = e.clientX - el.x;
            let startY = e.clientY - el.y;

            document.onmousemove = (e2) => {
                el.x = e2.clientX - startX;
                el.y = e2.clientY - startY;
                div.style.left = el.x + 'px';
                div.style.top = el.y + 'px';
                exportCode();
            };

            document.onmouseup = () => {
                document.onmousemove = null;
                // No llamamos a render aquí para no perder el foco si estamos editando texto
                exportCode();
            };
        };

        // Redimensionar Paneles
        if(el.type === 'panel') {
            const r = document.createElement('div');
            r.className = 'resizer';
            r.onmousedown = (e) => {
                e.stopPropagation();
                let startW = el.w;
                let startH = el.h;
                let startX = e.clientX;
                let startY = e.clientY;

                document.onmousemove = (e2) => {
                    el.w = startW + (e2.clientX - startX);
                    el.h = startH + (e2.clientY - startY);
                    div.style.width = el.w + 'px';
                    div.style.height = el.h + 'px';
                    exportCode();
                };
                document.onmouseup = () => { document.onmousemove = null; };
            };
            div.appendChild(r);
        }

        canvas.appendChild(div);
    });
    exportCode();
}

// EXPORTAR CÓDIGO HTML/CSS
function exportCode() {
    let html = "";
    let css = "/* Estilos */\nbody { margin: 0; min-height: 100vh; " + 
              (background.type === 'image' ? `background: url('${background.url}') center/cover;` : "background: #000;") + "}\n";

    if(background.type === 'video') {
        html += `<video src="${background.url}" autoplay loop muted style="position:fixed;width:100%;height:100%;object-fit:cover;z-index:-1;"></video>\n`;
    }

    elements.forEach((el, i) => {
        html += `<div class="obj-${i}">${el.type === 'text' ? el.text : ''}</div>\n`;
        css += `.obj-${i} {\n  position: absolute;\n  left: ${el.x}px; top: ${el.y}px;\n`;
        if(el.type === 'panel') {
            css += `  width: ${el.w}px; height: ${el.h}px;\n  background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 15px; border: 1px solid rgba(255,255,255,0.2);\n`;
        } else {
            css += `  color: ${el.color}; font-size: ${el.size}px;\n`;
        }
        css += "}\n\n";
    });

    document.getElementById('html-code').innerText = html || "Crea algo...";
    document.getElementById('css-code').innerText = css;
}

// Deseleccionar al hacer clic en el lienzo vacío
canvas.onclick = (e) => { if(e.target === canvas) { selectedId = null; render(); } };

render();
