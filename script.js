const canvas = document.getElementById('canvas');
const codeView = document.getElementById('codeView');
const bgInput = document.getElementById('bgInput');
const setBgButton = document.getElementById('setBg');
const addTextButton = document.getElementById('addText');

setBgButton.addEventListener('click', () => {
    const url = bgInput.value;
    canvas.style.backgroundImage = `url(${url})`;
    updateCodeView();
});

addTextButton.addEventListener('click', () => {
    const textElement = document.createElement('div');
    textElement.contentEditable = true;
    textElement.innerText = "Texto editable";
    textElement.className = "text-element";
    canvas.appendChild(textElement);
    updateCodeView();
});

function updateCodeView() {
    codeView.value = canvas.innerHTML;
}
