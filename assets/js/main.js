// importo las funciones necesarias desde Firebase
import { db } from './firebase.js';
import { collection, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

// ruta al archivo local que contiene los nombres de las aulas
const AULAS_JSON = '/assets/js/aulas.json';

// referencias a elementos del DOM
const aulaSelect = document.getElementById("aulaSelect");
const tempSelect = document.getElementById("tempSelect");
const reportButton = document.getElementById("reportButton");
const toggleStatsButton = document.getElementById("toggleStatsButton");
const reportSection = document.getElementById("reportSection");
const statsSection = document.getElementById("statsSection");
const btnVolver = document.getElementById("btnVolver");
const statusStats = document.getElementById("statusStats");
let statusDiv = document.getElementById("status");

// coordenadas de la facultad
const FACULTAD_LAT = -34.611334;
const FACULTAD_LON = -58.436502;
const RADIO_PERMITIDO = 450; 


// variable global para el gráfico
let chartInstance = null;

// función que carga las aulas desde un archivo JSON local y las muestra en el <select>
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

    statusDiv.textContent = `${aulas.length} aulas cargadas`;
    statusDiv.className = "success";
  } catch (error) {
    console.error("Error al cargar aulas:", error);
    statusDiv.textContent = "Error al cargar las aulas.";
    statusDiv.className = "error";
  }
}

// calculo la distancia entre dos puntos con fórmula de Haversine
function distanciaEnMetros(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  console.log(R * c)
  return R * c;
}

// función que guarda un reporte en Firebase con hora argentina y ubicación verificada
async function guardarReporte() {
  const aula = aulaSelect.value;
  const temperatura = tempSelect.value;

  if (!aula) {
    statusDiv.textContent = "Seleccioná un aula.";
    statusDiv.className = "error";
    return;
  }

  if (!navigator.geolocation) {
    statusDiv.textContent = "Tu navegador no soporta geolocalización.";
    statusDiv.className = "error";
    return;
  }

  navigator.geolocation.getCurrentPosition(async position => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    console.log(lat);
    console.log(lon);

    const distancia = distanciaEnMetros(lat, lon, FACULTAD_LAT, FACULTAD_LON);

    if (distancia > RADIO_PERMITIDO) {
      statusDiv.textContent = "Estás fuera del rango permitido para enviar un reporte.";
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
      statusDiv.textContent = `Reporte guardado: ${aula} - ${temperatura}`;
      statusDiv.className = "success";
    } catch (error) {
      console.error("Error al guardar reporte:", error);
      statusDiv.textContent = "No se pudo guardar el reporte.";
      statusDiv.className = "error";
    }

    setTimeout(() => {
      statusDiv.textContent = "";
      statusDiv.className = "";
    }, 3000);

  }, () => {
    statusDiv.textContent = "No se pudo obtener tu ubicación.";
    statusDiv.className = "error";
  });
}

// función que trae datos de firestore, arma gráfico y tabla dinámica
async function mostrarEstadisticas() {
  statusStats.textContent = "Cargando estadísticas...";
  statusStats.className = "loading";

  const querySnapshot = await getDocs(collection(db, "reportes"));
  const data = {};

  querySnapshot.forEach(doc => {
    const { ubicacion, temperatura } = doc.data();
    if (!data[ubicacion]) {
      data[ubicacion] = { frio: 0, calor: 0 };
    }
    data[ubicacion][temperatura]++;
  });

  const labels = Object.keys(data);
  const frioData = labels.map(label => data[label].frio);
  const calorData = labels.map(label => data[label].calor);

  const ctx = document.getElementById('grafico').getContext('2d');
  if (chartInstance) {
    chartInstance.destroy();
  }
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Frío', backgroundColor: '#3498db', data: frioData },
        { label: 'Calor', backgroundColor: '#e74c3c', data: calorData }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  let tablaHTML = '<table class="tabla-estadisticas"><thead><tr><th>Aula</th><th>Frío</th><th>Calor</th></tr></thead><tbody>';
  labels.forEach(label => {
    tablaHTML += `<tr><td>${label}</td><td>${data[label].frio}</td><td>${data[label].calor}</td></tr>`;
  });
  tablaHTML += '</tbody></table>';

  statusStats.innerHTML = tablaHTML;
  statusStats.className = "";
}

// alterno entre la vista de formulario y la de estadísticas
function toggleEstadisticas() {
  const mostrandoEstadisticas = statsSection.style.display === 'block';

  if (mostrandoEstadisticas) {
    statsSection.style.display = 'none';
    reportSection.style.display = 'block';
    toggleStatsButton.textContent = 'Ver estadísticas';
  } else {
    reportSection.style.display = 'none';
    statsSection.style.display = 'block';
    toggleStatsButton.textContent = 'Ver estadísticas';
    mostrarEstadisticas();
  }
}

function volver() {
  statsSection.style.display = 'none';
  reportSection.style.display = 'block';
  statusStats.innerHTML = '';
  statusStats.className = '';
}

// eventos
reportButton.addEventListener('click', guardarReporte);
toggleStatsButton.addEventListener('click', toggleEstadisticas);
document.addEventListener('DOMContentLoaded', cargarAulas);
btnVolver.addEventListener('click', volver);
