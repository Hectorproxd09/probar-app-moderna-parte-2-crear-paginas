document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace');
    let selectedElement = null;

    // --- SISTEMA DE DRAG & DROP ---
    let isDragging = false;
    let startX, startY, initialX, initialY;

    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !selectedElement) return;
        // Evitar mover si se está redimensionando (esquina inferior derecha del panel)
        if (e.target === selectedElement && e.offsetX > selectedElement.clientWidth - 15 && e.offsetY > selectedElement.clientHeight - 15) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        selectedElement.style.left = `${initialX + dx}px`;
        selectedElement.style.top = `${initialY + dy}px`;
    });

    document.addEventListener('mouseup', () => { isDragging = false; });

    function makeDraggableAndSelectable(el) {
        el.addEventListener('mousedown', (e) => {
            if (e.offsetX > el.clientWidth - 15 && e.offsetY > el.clientHeight - 15) return;
            
            e.stopPropagation();
            selectElement(el);
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = el.offsetLeft;
            initialY = el.offsetTop;
        });

        // Edición de texto con doble clic
        el.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if(el.classList.contains('canvas-text') || el.classList.contains('canvas-link')) {
                const newText = prompt("Edita el texto:", el.innerText);
                if(newText) el.innerText = newText;
            }
        });
    }

    // --- SELECCIÓN Y PROPIEDADES ---
    function selectElement(el) {
        deselectAll();
        selectedElement = el;
        el.classList.add('selected');
    }

    function deselectAll(e) {
        if(e && e.target !== workspace) return;
        if (selectedElement) {
            selectedElement.classList.remove('selected');
            selectedElement = null;
        }
    }

    workspace.addEventListener('click', deselectAll);

    // Actualizar estilos del elemento seleccionado
    function updateStyle(prop, val) {
        if (!selectedElement) return alert("Selecciona un elemento primero");
        
        if (prop === 'backgroundColor') {
            const hex = val.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            selectedElement.style.background = `rgba(${r},${g},${b},0.3)`;
        } else {
            selectedElement.style[prop] = val;
        }
    }

    // Listeners de los inputs de propiedades
    document.getElementById('elem-color').addEventListener('input', (e) => updateStyle('color', e.target.value));
    document.getElementById('elem-bg').addEventListener('input', (e) => updateStyle('backgroundColor', e.target.value));
    document.getElementById('elem-size').addEventListener('input', (e) => updateStyle('fontSize', e.target.value + 'px'));
    
    document.querySelectorAll('.align-btn').forEach(btn => {
        btn.addEventListener('click', (e) => updateStyle('textAlign', e.target.getAttribute('data-align')));
    });

    document.getElementById('btn-delete').addEventListener('click', () => {
        if (selectedElement) {
            selectedElement.remove();
            selectedElement = null;
        }
    });

    // --- CREACIÓN DE ELEMENTOS ---
    document.getElementById('btn-add-panel').addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'canvas-element glass glass-panel';
        makeDraggableAndSelectable(div);
        workspace.appendChild(div);
        selectElement(div);
    });

    document.getElementById('btn-add-text').addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'canvas-element canvas-text';
        div.innerText = 'Doble clic para editar texto';
        div.style.color = '#ffffff';
        div.style.fontSize = '24px';
        makeDraggableAndSelectable(div);
        workspace.appendChild(div);
        selectElement(div);
    });

    document.getElementById('btn-add-link').addEventListener('click', () => {
        const url = prompt("Introduce la URL de redirección:", "https://");
        if (!url) return;
        const a = document.createElement('a');
        a.className = 'canvas-element canvas-link glass';
        a.innerText = 'Enlace / Botón';
        a.href = url;
        a.target = '_blank';
        a.onclick = (e) => e.preventDefault(); // Evita redirección en modo edición
        makeDraggableAndSelectable(a);
        workspace.appendChild(a);
        selectElement(a);
    });

    // Fondo
    document.getElementById('bg-url').addEventListener('change', (e) => {
        workspace.style.backgroundImage = `url('${e.target.value}')`;
    });

    // --- EXPORTACIÓN DE CÓDIGO ---
    document.getElementById('toggle-code').addEventListener('click', () => {
        const panel = document.getElementById('code-panel');
        panel.classList.toggle('active');
        if(panel.classList.contains('active')) generateCode();
    });

    function generateCode() {
        deselectAll(); // Quitar bordes de selección antes de exportar
        
        const clone = workspace.cloneNode(true);
        const elements = clone.querySelectorAll('.canvas-element');
        elements.forEach(el => {
            el.classList.remove('canvas-element', 'selected');
            if(el.tagName === 'A') el.removeAttribute('onclick'); 
        });

        const htmlContent = clone.innerHTML.trim();
        const bgImage = workspace.style.backgroundImage;

        const finalCode = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
    body { 
        margin: 0; 
        height: 100vh; 
        background-color: #121212;
        ${bgImage ? `background-image: ${bgImage}; background-size: cover; background-position: center;` : ''}
        font-family: sans-serif;
        overflow: hidden;
        position: relative;
    }
    .glass {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    }
    .glass-panel { border-radius: 15px; }
    .canvas-link { text-decoration: none; padding: 10px 20px; border-radius: 8px; color: #00f0ff; display: inline-block; }
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;

        document.getElementById('code-output').value = finalCode;
    }
});
