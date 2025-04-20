import { db } from './firebase.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

// ruta al archivo local con las aulas
const AULAS_JSON = '/assets/js/aulas.json';

// DOM
const aulaSelect = document.getElementById("aulaSelect");
const tempSelect = document.getElementById("tempSelect");
const reportButton = document.getElementById("reportButton");
let statusDiv = document.getElementById("status");


// muestro las aulas desde el JSON
async function cargarAulas() {
  statusDiv.textContent = "Cargando aulas...";
  statusDiv.className = "loading";

  try {
    const res = await fetch(AULAS_JSON);
    if (!res.ok) throw new Error("No se pudo cargar aulas.json");

    const data = await res.json();
    const aulas = [...new Set(data)];

    aulaSelect.innerHTML = '<option value="">-- Seleccioná aula --</option>';
    aulas.forEach(aula => {
      const option = document.createElement("option");
      option.value = aula;
      option.textContent = aula;
      aulaSelect.appendChild(option);
    });

    statusDiv.textContent = `✅ ${aulas.length} aulas cargadas`;
    statusDiv.className = "success";

  } catch (error) {
    console.error("Error al cargar aulas:", error);
    statusDiv.textContent = "Error al cargar las aulas.";
    statusDiv.className = "error";
  }
}
//guardo el reporte en firestore con horario argentino
async function guardarReporte() {
  const aula = aulaSelect.value;
  const temperatura = tempSelect.value;

  if (!aula) {
    statusDiv.textContent = "Seleccioná un aula.";
    statusDiv.className = "error";
    return;
  }

  const fecha = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const reporte = {
    ubicacion: aula,
    temperatura,
    fecha
  };

  try {
    await addDoc(collection(db, 'reportes'), reporte);
    statusDiv.textContent = `📌 Reporte guardado: ${aula} - ${temperatura}`;
    statusDiv.className = "success";
  } catch (error) {
    console.error("Error al guardar reporte:", error);
    statusDiv.textContent = "❌ No se pudo guardar el reporte.";
    statusDiv.className = "error";
  }

  setTimeout(() => {
    statusDiv.textContent = "";
    statusDiv.className = "";
  }, 3000);
}

// Listeners
document.addEventListener('DOMContentLoaded', cargarAulas);
reportButton.addEventListener('click', guardarReporte);
