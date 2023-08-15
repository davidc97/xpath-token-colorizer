import './style.css'
import { parseXPaths, colorize } from './xpath-token-colorizer'

let dom;
let json;

const htmlFileSelector = document.getElementById('html-file-selector');
const jsonFileSelector = document.getElementById('json-file-selector');
const htmlPreview = document.getElementById('html-preview');

htmlFileSelector.addEventListener('change', (event) => {
  const file = event.target.files[0];
  readHTML(file);
})

jsonFileSelector.addEventListener('change', (event) => {
  const file = event.target.files[0];
  readJSON(file);
})

function readHTML(file) {
  const reader = new FileReader();
  //TODO: Read text encoding from header of file
  reader.readAsText(file, "windows-1252");
  reader.addEventListener(
    "load", () => {
      const text = reader.result;
      const parser = new DOMParser();
      dom = parser.parseFromString(text, 'text/html');

      htmlPreview.innerHTML = text;
    }
  )
}

function readJSON(file) {
  const reader = new FileReader();
  reader.addEventListener(
    "load", () => {
      const text = reader.result;
      json = JSON.parse(text);
      parseXPaths(json);
      colorize();
    }
  )
  reader.readAsText(file, "windows-1252")
}

