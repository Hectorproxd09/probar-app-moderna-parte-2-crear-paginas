let elements = [];
let selectedId = null;
let bg = { url: '', type: '' };

const canvas = document.getElementById('canvas');

// LOGÍSTICA: Crear objetos
function add(type) {
    const el = {
        id: Date.now(),
        type: type,
        x: 150, y: 150,
        w: 200, h: type === 'text' ? 50 : 200,
        size: 32,
        color: '#ffffff',
        text: type === 'text' ? 'Doble clic para editar' : ''
    };
    elements.push(el);
    selectedId = el.id;
    render();
}

// LOGÍSTICA: Teclado (Borrar)
window.addEventListener('keydown', (e) => {
    // Si el foco está en un texto editable, no borramos el objeto
    if (document.activeElement.isContentEditable) return;

    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        elements = elements.filter(el => el.id !== selectedId);
        selectedId = null;
        render();
    }
});

// LOGÍSTICA: Renderizado y Eventos
function render() {
    canvas.innerHTML = '';

    // Aplicar Fondo
    if (bg.type === 'video') {
        const v = document.createElement('video');
        v.src = bg.url; v.autoplay = v.loop = v.muted = true;
        v.style = "position:absolute; width:100%; height:100%; object-fit:cover; pointer-events:none; z-index:0;";
        canvas.appendChild(v);
    } else if (bg.url) {
        canvas.style.backgroundImage = `url(${bg.url})`;
    }

    elements.forEach(el => {
        const div = document.createElement('div');
        div.className = `element ${el.type} ${el.id === selectedId ? 'selected' : ''}`;
        div.style = `left:${el.x}px; top:${el.y}px; width:${el.w}px; height:${el.h}px; color:${el.color}; font-size:${el.size}px; z-index:5;`;

        if (el.type === 'text') {
            div.innerText = el.text;
            // Edición "In-place"
            div.ondblclick = () => { div.contentEditable = true; div.focus(); };
            div.onblur = () => { div.contentEditable = false; el.text = div.innerText; exportCode(); };
        }

        // Lógica de Arrastre
        div.onmousedown = (e) => {
            if (div.contentEditable === "true" || e.target.classList.contains('resizer')) return;
            selectedId = el.id;
            render(); 

            let startX = e.clientX - el.x;
            let startY = e.clientY - el.y;

            document.onmousemove = (e2) => {
                el.x = e2.clientX - startX;
                el.y = e2.clientY - startY;
                div.style.left = el.x + 'px';
                div.style.top = el.y + 'px';
                exportCode();
            };
            document.onmouseup = () => { document.onmousemove = null; };
        };

        // Lógica de Redimensión (Agrandar/Achicar manualmente)
        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        resizer.onmousedown = (e) => {
            e.stopPropagation();
            let startW = el.w;
            let startSize = el.size;
            let startX = e.clientX;

            document.onmousemove = (e2) => {
                let diff = e2.clientX - startX;
                el.w = Math.max(50, startW + diff);
                
                if (el.type === 'text') {
                    el.size = Math.max(12, startSize + (diff * 0.5));
                    div.style.fontSize = el.size + 'px';
                } else {
                    el.h = Math.max(50, el.h + (diff * 0.3));
                    div.style.height = el.h + 'px';
                }
                div.style.width = el.w + 'px';
                exportCode();
            };
            document.onmouseup = () => { document.onmousemove = null; };
        };
        div.appendChild(resizer);
        canvas.appendChild(div);
    });
    exportCode();
}

function updateBg() {
    const url = document.getElementById('bg-url').value;
    bg.url = url;
    bg.type = url.match(/\.(mp4|webm)$/i) ? 'video' : 'image';
    render();
}

function applyColor() {
    const el = elements.find(e => e.id === selectedId);
    if(el) { el.color = document.getElementById('main-color').value; render(); }
}

function exportCode() {
    let code = elements.map((el, i) => `.item-${i} { left: ${el.x}px; size: ${el.size}px; }`).join('\n');
    document.getElementById('html-code').innerText = code || "Esperando elementos...";
}

// Deseleccionar al clickear el fondo
canvas.onclick = (e) => { if(e.target === canvas) { selectedId = null; render(); } };

render();
