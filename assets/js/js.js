// js.js

// Importamos las funciones necesarias desde Firebase
import { db } from './firebase.js';
import { collection, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

// Ruta al archivo local que contiene los nombres de las aulas
const AULAS_JSON = '/assets/js/aulas.json';

// Referencias a elementos del DOM
const aulaSelect = document.getElementById("aulaSelect");
const tempSelect = document.getElementById("tempSelect");
const reportButton = document.getElementById("reportButton");
const toggleStatsButton = document.getElementById("toggleStatsButton");
const reportSection = document.getElementById("reportSection");
const statsSection = document.getElementById("statsSection");
const canvasContainer = document.getElementById("canvasContainer");
const btnVolver = document.getElementById("btnVolver");
let statusDiv = document.getElementById("status");

// Función que carga las aulas desde un archivo JSON local y las muestra en el <select>
async function cargarAulas() {
  statusDiv.textContent = "Cargando aulas...";
  statusDiv.className = "loading";

  try {
    const res = await fetch(AULAS_JSON); // Pedimos el archivo aulas.json
    if (!res.ok) throw new Error("No se pudo cargar aulas.json");

    const data = await res.json(); // Convertimos la respuesta a JSON
    const aulas = [...new Set(data)]; // Eliminamos duplicados por si acaso

    // Insertamos las opciones en el <select>
    aulaSelect.innerHTML = '<option value="">-- Seleccioná aula --</option>';
    aulas.forEach(aula => {
      const option = document.createElement("option");
      option.value = aula;
      option.textContent = aula;
      aulaSelect.appendChild(option);
    });

    statusDiv.textContent = `${aulas.length} aulas cargadas`;
    statusDiv.className = "success";
  } catch (error) {
    console.error("Error al cargar aulas:", error);
    statusDiv.textContent = "Error al cargar las aulas.";
    statusDiv.className = "error";
  }
}

// Función que guarda un reporte en Firebase con la hora argentina y el nombre del aula como "ubicacion"
async function guardarReporte() {
  const aula = aulaSelect.value;
  const temperatura = tempSelect.value;

  // Validamos que se haya seleccionado un aula
  if (!aula) {
    statusDiv.textContent = "Seleccioná un aula.";
    statusDiv.className = "error";
    return;
  }

  // Obtenemos fecha y hora en formato argentino
  const fecha = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Creamos el objeto reporte
  const reporte = {
    ubicacion: aula,
    temperatura,
    fecha
  };

  try {
    await addDoc(collection(db, 'reportes'), reporte); // Lo guardamos en Firebase
    statusDiv.textContent = `Reporte guardado: ${aula} - ${temperatura}`;
    statusDiv.className = "success";
  } catch (error) {
    console.error("Error al guardar reporte:", error);
    statusDiv.textContent = "No se pudo guardar el reporte.";
    statusDiv.className = "error";
  }

  // Limpiamos el mensaje después de 3 segundos
  setTimeout(() => {
    statusDiv.textContent = "";
    statusDiv.className = "";
  }, 3000);
}

// Función para obtener datos desde Firestore y graficarlos usando Chart.js
async function mostrarEstadisticas() {
  const querySnapshot = await getDocs(collection(db, "reportes")); // Traemos todos los reportes
  const data = {}; // Objeto para acumular resultados por aula

  // Recorremos cada reporte
  querySnapshot.forEach(doc => {
    const { ubicacion, temperatura } = doc.data();

    // Si no hay datos para esa ubicación, los inicializamos
    if (!data[ubicacion]) {
      data[ubicacion] = { frio: 0, calor: 0 };
    }

    // Incrementamos el contador según la temperatura reportada
    data[ubicacion][temperatura]++;
  });

  // Preparamos los datos para el gráfico
  const labels = Object.keys(data);
  const frioData = labels.map(label => data[label].frio);
  const calorData = labels.map(label => data[label].calor);

  // Obtenemos el contexto del canvas
  const ctx = document.getElementById('grafico').getContext('2d');

  // Creamos el gráfico de barras
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Frío',
          backgroundColor: '#3498db',
          data: frioData
        },
        {
          label: 'Calor',
          backgroundColor: '#e74c3c',
          data: calorData
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Función que alterna entre la vista del formulario de reporte y la de estadísticas
function toggleEstadisticas() {
  const mostrandoEstadisticas = statsSection.style.display === 'block';

  if (mostrandoEstadisticas) {
    statsSection.style.display = 'none';
    reportSection.style.display = 'block';
    toggleStatsButton.textContent = 'Ver estadísticas';
  } else {
    reportSection.style.display = 'none';
    statsSection.style.display = 'block';
    toggleStatsButton.textContent = 'Volver al reporte';
    mostrarEstadisticas(); // Cuando se muestra el gráfico, se actualiza con los datos nuevos
  }
}

function volver(){
  statsSection.style.display ='none'
  reportSection.style.display ='block'
}

// Eventos
reportButton.addEventListener('click', guardarReporte);
toggleStatsButton.addEventListener('click', toggleEstadisticas);
document.addEventListener('DOMContentLoaded', cargarAulas);
btnVolver.addEventListener('click', volver)
