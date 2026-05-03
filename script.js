// ============================================================
// STATE
// ============================================================
let selectedEl = null;
let panelOpen = false;
let gridVisible = false;
let zCounter = 10;
let elementIdCounter = 0;
let isDragging = false;
let isResizing = false;
let dragData = null;
let resizeData = null;

// ============================================================
// DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  init();
});

// ============================================================
// TOAST
// ============================================================
function toast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(function() {
    t.classList.remove('show');
  }, 2200);
}

// ============================================================
// PANEL
// ============================================================
function togglePanel() {
  panelOpen = !panelOpen;
  document.getElementById('sidepanel').classList.toggle('open', panelOpen);
  document.getElementById('sideToggle').classList.toggle('open', panelOpen);
}

// ============================================================
// ADD ELEMENTS
// ============================================================
function addElement(type) {
  var canvas = document.getElementById('canvas');
  var el = document.createElement('div');
  var id = 'el-' + (++elementIdCounter);
  el.className = 'ce';
  el.dataset.type = type;
  el.dataset.id = id;
  el.style.zIndex = ++zCounter;
  
  // Posicion aleatoria
  var cw = canvas.offsetWidth || 900;
  var ch = canvas.offsetHeight || 600;
  var left = 60 + Math.random() * Math.max(100, cw - 300);
  var top = 40 + Math.random() * Math.max(100, ch - 200);
  
  el.style.left = left + 'px';
  el.style.top = top + 'px';
  
  // Resize handles
  var dirs = ['nw','n','ne','e','se','s','sw','w'];
  for (var i = 0; i < dirs.length; i++) {
    var h = document.createElement('div');
    h.className = 'rh rh-' + dirs[i];
    el.appendChild(h);
  }
  
  // Delete button
  var del = document.createElement('button');
  del.className = 'del-btn';
  del.innerHTML = '✕';
  del.onclick = function(e) {
    e.stopPropagation();
    deleteElement(el);
  };
  el.appendChild(del);
  
  // Type-specific
  if (type === 'text') {
    el.classList.add('text-el');
    el.contentEditable = 'true';
    el.textContent = 'Texto aquí...';
    el.style.fontSize = '16px';
    el.style.color = '#ffffff';
    el.style.background = 'rgba(255,255,255,0.08)';
  } else if (type === 'panel') {
    el.classList.add('panel-el');
    el.style.background = 'rgba(255,255,255,0.12)';
    el.style.width = '200px';
    el.style.height = '160px';
    el.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.5);font-size:13px;padding:20px;">Panel de vidrio</div>';
  } else if (type === 'link') {
    el.classList.add('link-el');
    el.style.background = 'rgba(108,92,231,0.25)';
    var a = document.createElement('a');
    a.href = '#';
    a.textContent = '🔗 Enlace';
    a.target = '_blank';
    a.style.color = '#a29bfe';
    a.onclick = function(e) { e.stopPropagation(); };
    el.appendChild(a);
    el.dataset.linkUrl = 'https://example.com';
  } else if (type === 'image') {
    el.classList.add('image-el');
    el.style.width = '160px';
    el.style.height = '120px';
    var img = document.createElement('img');
    img.src = 'https://picsum.photos/300/200?random=' + id;
    img.alt = 'Imagen';
    img.draggable = false;
    el.appendChild(img);
    el.dataset.mediaUrl = img.src;
  } else if (type === 'video') {
    el.classList.add('video-el');
    el.style.width = '240px';
    el.style.height = '160px';
    var vid = document.createElement('video');
    vid.src = 'https://www.w3schools.com/html/mov_bbb.mp4';
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.style.width = '100%';
    vid.style.height = '100%';
    vid.style.objectFit = 'cover';
    el.appendChild(vid);
    el.dataset.mediaUrl = vid.src;
  }
  
  el.addEventListener('mousedown', function(e) { onElementMouseDown(e); });
  el.addEventListener('click', function() { selectElement(el); });
  
  canvas.appendChild(el);
  selectElement(el);
  toast(type === 'link' ? '🔗 Enlace creado' : '✨ ' + type.charAt(0).toUpperCase() + type.slice(1) + ' creado');
  
  if (!panelOpen) togglePanel();
  return el;
}

// ============================================================
// SELECTION
// ============================================================
function selectElement(el) {
  if (selectedEl === el) return;
  if (selectedEl) {
    selectedEl.classList.remove('selected');
    if (selectedEl.dataset.type === 'text' && selectedEl.contentEditable === 'true') {
      selectedEl.contentEditable = 'false';
    }
  }
  selectedEl = el;
  if (el) {
    el.classList.add('selected');
    el.style.zIndex = ++zCounter;
    refreshProps();
  } else {
    var noSel = document.getElementById('noSelection');
    var selProps = document.getElementById('selProps');
    if (noSel) noSel.style.display = 'block';
    if (selProps) selProps.style.display = 'none';
  }
}

function deselectAll() {
  if (selectedEl) {
    selectedEl.classList.remove('selected');
    if (selectedEl.dataset.type === 'text' && selectedEl.contentEditable === 'true') {
      selectedEl.contentEditable = 'false';
    }
  }
  selectedEl = null;
  var noSel = document.getElementById('noSelection');
  var selProps = document.getElementById('selProps');
  if (noSel) noSel.style.display = 'block';
  if (selProps) selProps.style.display = 'none';
}

// Click en canvas vacio
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('canvas').addEventListener('mousedown', function(e) {
    if (e.target === e.currentTarget) deselectAll();
  });
});

// ============================================================
// PROPS REFRESH
// ============================================================
function refreshProps() {
  var el = selectedEl;
  if (!el) { deselectAll(); return; }
  
  var noSel = document.getElementById('noSelection');
  var selProps = document.getElementById('selProps');
  if (noSel) noSel.style.display = 'none';
  if (selProps) selProps.style.display = 'block';
  
  document.getElementById('selType').textContent = el.dataset.type;
  document.getElementById('propX').value = Math.round(parseFloat(el.style.left) || 0);
  document.getElementById('propY').value = Math.round(parseFloat(el.style.top) || 0);
  document.getElementById('propW').value = Math.round(el.offsetWidth);
  document.getElementById('propH').value = Math.round(el.offsetHeight);
  
  var rot = parseFloat(el.dataset.rotation) || 0;
  document.getElementById('propRot').value = rot;
  document.getElementById('rotVal').textContent = rot + '°';
  
  var bgColor = el.dataset.bgColor || 'rgba(255,255,255,0.12)';
  document.getElementById('propBgColor').value = colorToHex(bgColor);
  
  var tc = el.style.color || '#ffffff';
  document.getElementById('propTextColor').value = colorToHex(tc);
  
  var op = parseFloat(el.style.opacity) || 1;
  document.getElementById('propOpacity').value = op * 100;
  document.getElementById('opacityVal').textContent = Math.round(op * 100) + '%';
  
  var br = parseFloat(el.style.borderRadius) || 12;
  document.getElementById('propRadius').value = br;
  document.getElementById('radiusVal').textContent = Math.round(br) + 'px';
  
  var bf = el.dataset.blur || '12';
  document.getElementById('propBlur').value = bf;
  document.getElementById('blurVal').textContent = bf + 'px';
  
  // Text
  var isText = el.dataset.type === 'text';
  document.getElementById('textProps').style.display = isText ? 'block' : 'none';
  if (isText) {
    var fs = parseFloat(el.style.fontSize) || 16;
    document.getElementById('propFontSize').value = fs;
  }
  
  // Link
  document.getElementById('linkProps').style.display = el.dataset.type === 'link' ? 'block' : 'none';
  if (el.dataset.type === 'link') {
    document.getElementById('propLinkUrl').value = el.dataset.linkUrl || '';
  }
  
  // Media
  var isMedia = el.dataset.type === 'image' || el.dataset.type === 'video';
  document.getElementById('mediaProps').style.display = isMedia ? 'block' : 'none';
  if (isMedia) {
    document.getElementById('propMediaUrl').value = el.dataset.mediaUrl || '';
  }
}

function updateProp(prop, val) {
  var el = selectedEl;
  if (!el) return;
  
  switch(prop) {
    case 'x': el.style.left = val + 'px'; break;
    case 'y': el.style.top = val + 'px'; break;
    case 'w': el.style.width = val + 'px'; break;
    case 'h': el.style.height = val + 'px'; break;
    case 'rot':
      el.dataset.rotation = val;
      el.style.transform = 'rotate(' + val + 'deg)';
      document.getElementById('rotVal').textContent = val + '°';
      break;
    case 'bg':
      el.dataset.bgColor = val;
      el.style.background = val;
      break;
    case 'textColor':
      el.style.color = val;
      if (el.dataset.type === 'link') {
        var a = el.querySelector('a');
        if (a) a.style.color = val;
      }
      break;
    case 'opacity':
      el.style.opacity = val / 100;
      document.getElementById('opacityVal').textContent = Math.round(val) + '%';
      break;
    case 'radius':
      el.style.borderRadius = val + 'px';
      document.getElementById('radiusVal').textContent = Math.round(val) + 'px';
      break;
    case 'blur':
      el.dataset.blur = val;
      el.style.backdropFilter = 'blur(' + val + 'px)';
      el.style.WebkitBackdropFilter = 'blur(' + val + 'px)';
      document.getElementById('blurVal').textContent = val + 'px';
      break;
    case 'fontSize':
      el.style.fontSize = val + 'px';
      break;
    case 'linkUrl':
      el.dataset.linkUrl = val;
      var a = el.querySelector('a');
      if (a) {
        a.href = val;
        var short = val.replace(/^https?:\/\//, '').substring(0, 25);
        a.textContent = '🔗 ' + (short || 'Enlace');
      }
      break;
    case 'mediaUrl':
      el.dataset.mediaUrl = val;
      if (el.dataset.type === 'image') {
        var img = el.querySelector('img');
        if (img) img.src = val;
      } else if (el.dataset.type === 'video') {
        var vid = el.querySelector('video');
        if (vid) vid.src = val;
      }
      break;
  }
}

function colorToHex(c) {
  if (!c || c === 'transparent' || c === 'rgba(0,0,0,0)') return '#ffffff';
  // Simple approach
  var s = document.createElement('span');
  s.style.color = c;
  document.body.appendChild(s);
  var computed = getComputedStyle(s).color;
  document.body.removeChild(s);
  // Convert rgb to hex
  var match = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    var r = parseInt(match[1]);
    var g = parseInt(match[2]);
    var b = parseInt(match[3]);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  return '#ffffff';
}

function quickColor(target, color) {
  updateProp(target === 'bg' ? 'bg' : 'textColor', color);
}

// ============================================================
// DRAG
// ============================================================
function onElementMouseDown(e) {
  var el = e.currentTarget;
  if (e.target.classList.contains('rh')) {
    startResize(e, el);
    return;
  }
  if (e.target.classList.contains('del-btn')) return;
  if (e.target.tagName === 'A' || e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') return;
  
  startDrag(e, el);
}

function startDrag(e, el) {
  if (e.button !== 0) return;
  isDragging = true;
  var rect = el.getBoundingClientRect();
  var parentRect = el.parentElement.getBoundingClientRect();
  
  dragData = {
    el: el,
    startX: e.clientX,
    startY: e.clientY,
    elLeft: parseFloat(el.style.left) || (rect.left - parentRect.left),
    elTop: parseFloat(el.style.top) || (rect.top - parentRect.top)
  };
  
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault();
}

function onDrag(e) {
  if (!isDragging || !dragData) return;
  var data = dragData;
  var dx = e.clientX - data.startX;
  var dy = e.clientY - data.startY;
  
  var snap = document.getElementById('snapToggle').checked;
  var gridSize = parseInt(document.getElementById('gridSize').value) || 20;
  
  var newX = data.elLeft + dx;
  var newY = data.elTop + dy;
  
  if (snap) {
    newX = Math.round(newX / gridSize) * gridSize;
    newY = Math.round(newY / gridSize) * gridSize;
  }
  
  data.el.style.left = Math.max(0, newX) + 'px';
  data.el.style.top = Math.max(0, newY) + 'px';
}

function stopDrag() {
  isDragging = false;
  dragData = null;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
  if (selectedEl) refreshProps();
}

// ============================================================
// RESIZE
// ============================================================
function startResize(e, el) {
  e.stopPropagation();
  isResizing = true;
  var handle = e.target;
  var rect = el.getBoundingClientRect();
  var parentRect = el.parentElement.getBoundingClientRect();
  
  var dirClass = '';
  var classList = handle.classList;
  for (var i = 0; i < classList.length; i++) {
    if (classList[i].startsWith('rh-')) {
      dirClass = classList[i].replace('rh-', '');
      break;
    }
  }
  
  resizeData = {
    el: el,
    handle: handle,
    startX: e.clientX,
    startY: e.clientY,
    elLeft: parseFloat(el.style.left) || (rect.left - parentRect.left),
    elTop: parseFloat(el.style.top) || (rect.top - parentRect.top),
    elW: el.offsetWidth,
    elH: el.offsetHeight,
    dir: dirClass
  };
  
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
  e.preventDefault();
}

function onResize(e) {
  if (!isResizing || !resizeData) return;
  var data = resizeData;
  var dx = e.clientX - data.startX;
  var dy = e.clientY - data.startY;
  
  var newW = data.elW;
  var newH = data.elH;
  var newX = data.elLeft;
  var newY = data.elTop;
  
  var snap = document.getElementById('snapToggle').checked;
  var gridSize = parseInt(document.getElementById('gridSize').value) || 20;
  
  var snapVal = function(v) {
    return snap ? Math.round(v / gridSize) * gridSize : v;
  };
  
  if (data.dir.indexOf('e') !== -1) { newW = Math.max(40, data.elW + dx); }
  if (data.dir.indexOf('w') !== -1) { newW = Math.max(40, data.elW - dx); newX = data.elLeft + (data.elW - newW); }
  if (data.dir.indexOf('s') !== -1) { newH = Math.max(28, data.elH + dy); }
  if (data.dir.indexOf('n') !== -1) { newH = Math.max(28, data.elH - dy); newY = data.elTop + (data.elH - newH); }
  
  data.el.style.left = snapVal(newX) + 'px';
  data.el.style.top = snapVal(newY) + 'px';
  data.el.style.width = snapVal(newW) + 'px';
  data.el.style.height = snapVal(newH) + 'px';
}

function stopResize() {
  isResizing = false;
  resizeData = null;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
  if (selectedEl) refreshProps();
}

// ============================================================
// DELETE / DUPLICATE
// ============================================================
function deleteElement(el) {
  if (selectedEl === el) deselectAll();
  el.remove();
  toast('🗑 Eliminado');
}

function deleteSelected() {
  if (!selectedEl) { toast('Selecciona un elemento primero'); return; }
  var el = selectedEl;
  deselectAll();
  el.remove();
  toast('🗑 Eliminado');
}

function duplicateSelected() {
  if (!selectedEl) { toast('Selecciona un elemento primero'); return; }
  var orig = selectedEl;
  var type = orig.dataset.type;
  var el = addElement(type);
  
  el.style.left = (parseFloat(orig.style.left) + 30) + 'px';
  el.style.top = (parseFloat(orig.style.top) + 30) + 'px';
  el.style.width = orig.style.width;
  el.style.height = orig.style.height;
  el.style.background = orig.style.background;
  el.style.color = orig.style.color;
  el.style.fontSize = orig.style.fontSize;
  el.style.transform = orig.style.transform;
  el.style.opacity = orig.style.opacity;
  el.style.borderRadius = orig.style.borderRadius;
  el.style.backdropFilter = orig.style.backdropFilter;
  el.dataset.blur = orig.dataset.blur;
  el.dataset.bgColor = orig.dataset.bgColor;
  el.dataset.rotation = orig.dataset.rotation;
  
  if (type === 'text') {
    el.textContent = orig.textContent;
  }
  if (type === 'link') {
    var a = el.querySelector('a');
    var oa = orig.querySelector('a');
    if (a && oa) { a.href = oa.href; a.textContent = oa.textContent; a.style.color = oa.style.color; }
    el.dataset.linkUrl = orig.dataset.linkUrl;
  }
  if (type === 'image' || type === 'video') {
    el.dataset.mediaUrl = orig.dataset.mediaUrl;
    if (type === 'image') { var img = el.querySelector('img'); if(img) img.src = orig.dataset.mediaUrl; }
    if (type === 'video') { var vid = el.querySelector('video'); if(vid) vid.src = orig.dataset.mediaUrl; }
  }
  
  selectElement(el);
  toast('📋 Duplicado');
}

// ============================================================
// Z-INDEX
// ============================================================
function moveZIndex(dir) {
  if (!selectedEl) return;
  var cur = parseInt(selectedEl.style.zIndex) || 1;
  var newZ = dir > 0 ? Math.max(zCounter + 1, cur + 1) : Math.max(1, cur - 1);
  selectedEl.style.zIndex = newZ;
  if (dir > 0) zCounter = Math.max(zCounter, newZ);
  toast(dir > 0 ? '⬆ Al frente' : '⬇ Al fondo');
}

// ============================================================
// ALIGNMENT
// ============================================================
function alignElements(align) {
  var allSelected = document.querySelectorAll('.ce.selected');
  var targets = allSelected.length > 0 ? Array.from(allSelected) : (selectedEl ? [selectedEl] : []);
  if (targets.length === 0) { toast('Selecciona al menos un elemento'); return; }
  
  var parent = document.getElementById('canvas');
  
  targets.forEach(function(el) {
    var elW = el.offsetWidth;
    var elH = el.offsetHeight;
    
    switch(align) {
      case 'left':
        el.style.left = '20px';
        break;
      case 'centerH':
        el.style.left = ((parent.offsetWidth - elW) / 2) + 'px';
        break;
      case 'right':
        el.style.left = (parent.offsetWidth - elW - 20) + 'px';
        break;
      case 'top':
        el.style.top = '20px';
        break;
      case 'centerV':
        el.style.top = ((parent.offsetHeight - elH) / 2) + 'px';
        break;
      case 'bottom':
        el.style.top = (parent.offsetHeight - elH - 20) + 'px';
        break;
    }
  });
  
  if (selectedEl) refreshProps();
  toast('📐 Alineado');
}

function distributeElements(dir) {
  var els = Array.from(document.querySelectorAll('.ce'));
  if (els.length < 2) { toast('Se necesitan al menos 2 elementos'); return; }
  
  if (dir === 'h') {
    var sorted = els.sort(function(a,b) {
      return (parseFloat(a.style.left) || 0) - (parseFloat(b.style.left) || 0);
    });
    var first = parseFloat(sorted[0].style.left) || 0;
    var last = parseFloat(sorted[sorted.length-1].style.left) || 0;
    var gap = (last - first) / (sorted.length - 1);
    sorted.forEach(function(el, i) {
      el.style.left = (first + gap * i) + 'px';
    });
  } else {
    var sorted = els.sort(function(a,b) {
      return (parseFloat(a.style.top) || 0) - (parseFloat(b.style.top) || 0);
    });
    var first = parseFloat(sorted[0].style.top) || 0;
    var last = parseFloat(sorted[sorted.length-1].style.top) || 0;
    var gap = (last - first) / (sorted.length - 1);
    sorted.forEach(function(el, i) {
      el.style.top = (first + gap * i) + 'px';
    });
  }
  if (selectedEl) refreshProps();
  toast('📏 Distribuido');
}

// ============================================================
// TEXT FORMATTING
// ============================================================
function execFormat(cmd) {
  if (!selectedEl || selectedEl.dataset.type !== 'text') { toast('Selecciona un elemento de texto'); return; }
  selectedEl.contentEditable = 'true';
  selectedEl.focus();
  
  var range = document.createRange();
  range.selectNodeContents(selectedEl);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  
  document.execCommand(cmd, false, null);
  
  sel.removeAllRanges();
  toast('✏️ Formato aplicado');
}

// ============================================================
// BACKGROUND
// ============================================================
function setCanvasBg(type, value) {
  var wrap = document.getElementById('canvasWrap');
  wrap.querySelectorAll('.bg-el').forEach(function(el) { el.remove(); });
  
  if (type === 'color') {
    wrap.style.background = value;
    document.getElementById('bgColor').value = colorToHex(value
