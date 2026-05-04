function generateCode() {
  const htmlOut = document.getElementById("html-code");
  const cssOut = document.getElementById("css-code");
  const jsOut = document.getElementById("js-code");

  let html = "";
  let css = "";
  let js = "";

  html += `<div id="app">\n`;

  screens.forEach((screen, sIndex) => {

    html += `<div class="screen" id="screen-${sIndex}" style="display:${sIndex === 0 ? 'block':'none'}">\n`;

    screen.forEach((el, i) => {
      const c = `el_${sIndex}_${i}`;

      html += `<div class="${c}"`;

      if (el.targetScreen !== null) {
        html += ` onclick="goToScreen(${el.targetScreen})"`;
      }

      html += `>${el.text}</div>\n`;

      css += `.${c}{
  position:absolute;
  left:${el.x}px;
  top:${el.y}px;
}\n`;

      if (el.type === "panel") {
        css += `.${c}{
  width:${el.width}px;
  height:${el.height}px;
  background: rgba(255,255,255,0.2);
}\n`;
      } else {
        css += `.${c}{
  font-size:${el.size}px;
  color:${el.color};
}\n`;
      }
    });

    html += `</div>\n`;
  });

  html += `</div>`;

  css += `
.screen {
  position: relative;
  width: 100%;
  height: 100vh;
}
`;

  js += `
function goToScreen(n){
  document.querySelectorAll('.screen').forEach(s => s.style.display='none');
  document.getElementById('screen-' + n).style.display='block';
}
`;

  htmlOut.textContent = html;
  cssOut.textContent = css;
  jsOut.textContent = js;
}
