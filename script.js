let elements = [];
let selectedId = null;
let isDragging = false;
let background = { type: 'none', url: '' };

const canvas = document.getElementById('canvas');

function addElement(type) {
    const el = {
        id: Date.now(),
        type: type,
        text: type === 'text' ? 'Doble clic para editar' : '',
        x: 100, y: 100,
        w: 200, h: 60, // Altura inicial
        color: '#ffffff',
        size: 30 // Tamaño de fuente inicial
    };
    elements.push(el);
    selectedId = el.id;
    render();
}

function render() {
    canvas.innerHTML = '';
    
    // Renderizado de fondo (igual al anterior)
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
        div.style.width = el.w + 'px';
        div.style.height = el.h + 'px';
        div.style.color = el.color;
        div.style.fontSize = el.size + 'px';
        
        if (el.type === 'text') {
            div.innerText = el.text;
            // Doble clic para entrar en modo edición
            div.ondblclick = () => {
                div.contentEditable = true;
                div.focus();
                // Al entrar en edición, bloqueamos el arrastre
            };
            // Guardar al salir
            div.onblur = () => {
                div.contentEditable = false;
                el.text = div.innerText;
                exportCode();
            };
        }

        // --- LÓGICA DE MOVIMIENTO ---
        div.onmousedown = (e) => {
            if (e.target.classList.contains('resizer') || div.contentEditable === "true") return;
            
            selectedId = el.id;
            isDragging = true;
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
                isDragging = false;
                render(); 
            };
        };

        // --- LÓGICA DE AGRANDAR/ACHICAR (RESIZER) ---
        const r = document.createElement('div');
        r.className = 'resizer';
        r.onmousedown = (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            let startW = el.w;
            let startH = el.h;
            let startSize = el.size;
            let startX = e.clientX;

            document.onmousemove = (e2) => {
                let diff = e2.clientX - startX;
                el.w = startW + diff;
                el.h = startH + diff * (startH/startW); // Mantiene proporción
                
                // Si es texto, calculamos el nuevo tamaño de fuente basado en la altura
                if (el.type === 'text') {
                    el.size = startSize + (diff * 0.5); 
                    div.style.fontSize = el.size + 'px';
                }
                
                div.style.width = el.w + 'px';
                div.style.height = el.h + 'px';
                exportCode();
            };

            document.onmouseup = () => { document.onmousemove = null; };
        };
        div.appendChild(r);

        canvas.appendChild(div);
    });
    exportCode();
}

// Borrar con teclado
window.addEventListener('keydown', (e) => {
    if((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        if(document.activeElement.getAttribute('contenteditable') === "true") return;
        elements = elements.filter(el => el.id !== selectedId);
        selectedId = null;
        render();
    }
});

// Deseleccionar
canvas.onclick = (e) => { if(e.target === canvas) { selectedId = null; render(); } };
