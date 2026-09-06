let map = null;
let issMarker = null;

function initMap() {
  map = L.map('iss-map').setView([0, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  issMarker = L.circleMarker([0, 0], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.8,
    radius: 7
  }).addTo(map);
}

function showSection(sectionId) {
  const sections = document.querySelectorAll('.page-section');
  sections.forEach(section => section.classList.remove('active'));

  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add('active');
    if (sectionId === 'iss' && map) {
      setTimeout(() => map.invalidateSize(), 100);
    }
  }
}

function initNavigation() {
  const hash = window.location.hash.substring(1);
  if (hash && document.getElementById(hash)) {
    showSection(hash);
  } else {
    showSection('home');
  }
}

async function fetchISSData() {
  const url = `https://api.wheretheiss.at/v1/satellites/25544?t=${Date.now()}`;
  const statusEl = document.getElementById('iss-status');

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    const data = await response.json();

    const lat = data.latitude;
    const lon = data.longitude;

    document.getElementById('lat').innerText = lat;
    document.getElementById('lon').innerText = lon;
    document.getElementById('maps-param').innerText = `${lat},${lon}`;
    document.getElementById('velocity').innerText = data.velocity;
    document.getElementById('altitude').innerText = data.altitude;
    document.getElementById('timestamp').innerText = data.timestamp;
    document.getElementById('visibility').innerText = data.visibility;

    if (map && issMarker) {
      issMarker.setLatLng([lat, lon]);
      map.setView([lat, lon]);
    }

    const syncNow = new Date();
    statusEl.innerText = `Data received at: ${syncNow.toLocaleTimeString('en-US')}.${String(syncNow.getMilliseconds()).padStart(3, '0')}`;
    statusEl.classList.remove('error');
  } catch (error) {
    console.error('Error fetching ISS data:', error);
    statusEl.innerText = 'Error loading data from API';
    statusEl.classList.add('error');
  }
}

initMap();
initNavigation();

fetchISSData();
setInterval(fetchISSData, 1000);