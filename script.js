const canvas = document.getElementById("canvas");

const inputs = {
  text: document.getElementById("prop-text"),
  size: document.getElementById("prop-size"),
  color: document.getElementById("prop-color"),
  link: document.getElementById("prop-link")
};

const htmlOut = document.getElementById("html-code");
const cssOut = document.getElementById("css-code");

let elements = [];
let selectedId = null;
let snapEnabled = false;

let background = { type: null, url: "" };

let history = [];
let historyIndex = -1;

function saveHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(JSON.stringify(elements));
  historyIndex++;
}

function toggleSnap() {
  snapEnabled = !snapEnabled;
  document.querySelector(".topbar button:nth-child(6)").textContent =
    snapEnabled ? "☑ Snap" : "☐ Snap";
}

function setBackground() {
  const url = document.getElementById("bg-url").value.trim();
  if (!url) return;

  background.type = url.match(/\.(mp4|webm|ogg)$/i) ? "video" : "image";
  background.url = url;

  render();
}

canvas.addEventListener("click", (e) => {
  if (e.target === canvas) {
    selectedId = null;
    render();
  }
});

function addElement(type) {
  let link = "";
  if (type === "button") link = prompt("Link:", "https://") || "";

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
    link,
    z: elements.length
  });

  saveHistory();
  render();
}

/* GUIAS */
let guides = [];
function clearGuides() { guides.forEach(g=>g.remove()); guides=[]; }
function guide(type,pos){
  const g=document.createElement("div");
  g.className="guide "+type;
  if(type==="v") g.style.left=pos+"px";
  if(type==="h") g.style.top=pos+"px";
  canvas.appendChild(g);
  guides.push(g);
}

function render() {
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
    const img = new Image();
    img.src = background.url;
    img.onload = () => {
      const mode = img.width/img.height > canvas.clientWidth/canvas.clientHeight ? "contain":"cover";
      canvas.style.background = `url(${background.url}) center/${mode} no-repeat`;
    };
  } else {
    canvas.style.background = "white";
  }

  elements.sort((a,b)=>a.z-b.z);

  elements.forEach(el=>{
    let d = el.type==="button"?document.createElement("a"):document.createElement("div");

    d.className="element "+el.type;
    d.innerText=el.text;
    d.style.left=el.x+"px";
    d.style.top=el.y+"px";
    d.style.zIndex=el.z;

    if(el.type==="button") d.href=el.link||"#";

    if(el.type!=="panel"){
      d.style.fontSize=el.size+"px";
      d.style.color=el.color;
    }else{
      d.style.width=el.width+"px";
      d.style.height=el.height+"px";
    }

    if(el.id===selectedId){
      d.classList.add("selected");
      addHandles(d,el);
    }

    /* EDIT INLINE */
    d.ondblclick=e=>{
      e.stopPropagation();
      d.contentEditable=true;
      d.focus();
      d.onblur=()=>{
        el.text=d.innerText;
        d.contentEditable=false;
        updatePanel();
        saveHistory();
        render();
      };
    };

    d.onclick=e=>{
      e.stopPropagation();
      selectedId=el.id;
      el.z=Math.max(...elements.map(e=>e.z))+1;
      updatePanel();
      render();
    };

    d.onmousedown=e=>{
      e.preventDefault();
      const rect=canvas.getBoundingClientRect();
      const ox=e.clientX-el.x-rect.left;
      const oy=e.clientY-el.y-rect.top;

      function move(ev){
        clearGuides();

        let nx=ev.clientX-rect.left-ox;
        let ny=ev.clientY-rect.top-oy;

        if(snapEnabled){
          elements.forEach(o=>{
            if(o.id!==el.id){
              if(Math.abs(nx-o.x)<8){ nx=o.x; guide("v",o.x);}
              if(Math.abs(ny-o.y)<8){ ny=o.y; guide("h",o.y);}
            }
          });
        }

        el.x=nx; el.y=ny;
        render();
      }

      function stop(){
        clearGuides();
        document.removeEventListener("mousemove",move);
        document.removeEventListener("mouseup",stop);
        saveHistory();
      }

      document.addEventListener("mousemove",move);
      document.addEventListener("mouseup",stop);
    };

    canvas.appendChild(d);
  });

  generateCode();
}

function addHandles(div, el) {
  ["br","tr","bl","tl","r","l","t","b"].forEach(pos=>{
    const h=document.createElement("div");
    h.className="handle "+pos;
    h.onmousedown=e=>{
      e.stopPropagation();
      const sx=e.clientX, sy=e.clientY;
      const sw=el.width, sh=el.height, ss=el.size;

      function resize(ev){
        let dx=ev.clientX-sx, dy=ev.clientY-sy;

        if(el.type==="panel"){
          if(pos.includes("r")) el.width=sw+dx;
          if(pos.includes("l")) el.width=sw-dx;
          if(pos.includes("b")) el.height=sh+dy;
          if(pos.includes("t")) el.height=sh-dy;
        } else {
          el.size=Math.max(10, ss+dx*0.3);
        }

        render();
      }

      function stop(){
        document.removeEventListener("mousemove",resize);
        document.removeEventListener("mouseup",stop);
        saveHistory();
      }

      document.addEventListener("mousemove",resize);
      document.addEventListener("mouseup",stop);
    };
    div.appendChild(h);
  });
}

function updatePanel(){
  const el=elements.find(e=>e.id===selectedId);
  if(!el) return;
  inputs.text.value=el.text;
  inputs.size.value=el.size;
  inputs.color.value=el.color;
  inputs.link.value=el.link;
}

Object.keys(inputs).forEach(k=>{
  inputs[k].oninput=()=>{
    const el=elements.find(e=>e.id===selectedId);
    if(!el) return;
    el[k]=inputs[k].value;
    saveHistory();
    render();
  };
});

function deleteElement(){
  if(!selectedId) return;
  elements=elements.filter(e=>e.id!==selectedId);
  selectedId=null;
  saveHistory();
  render();
}

function undo(){
  if(historyIndex<=0) return;
  historyIndex--;
  elements=JSON.parse(history[historyIndex]);
  render();
}

function redo(){
  if(historyIndex>=history.length-1) return;
  historyIndex++;
  elements=JSON.parse(history[historyIndex]);
  render();
}

/* 🔥 EXPORTA TAMBIÉN BACKGROUND */
function generateCode(){
  let html="", css="body{margin:0;position:relative;}\n";

  if(background.type==="image"){
    css+=`body{background:url(${background.url}) center/cover no-repeat;}\n`;
  }

  elements.forEach((el,i)=>{
    const c="el"+i;

    html+=el.type==="button"
      ? `<a class="${c}" href="${el.link}">${el.text}</a>\n`
      : `<div class="${c}">${el.type==="text"?el.text:""}</div>\n`;

    css+=`.${c}{position:absolute;left:${el.x}px;top:${el.y}px;z-index:${el.z};}\n`;

    if(el.type==="panel"){
      css+=`.${c}{width:${el.width}px;height:${el.height}px;background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);}\n`;
    } else {
      css+=`.${c}{font-size:${el.size}px;color:${el.color};}\n`;
    }
  });

  htmlOut.textContent=html;
  cssOut.textContent=css;
}

saveHistory();
render();
