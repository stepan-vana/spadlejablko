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

async function checkPwnedPassword() {
  const input = document.getElementById('pass-input').value;
  const resultDiv = document.getElementById('pwned-result');

  if (!input) {
    alert('Please enter a password first.');
    return;
  }

  resultDiv.style.display = 'block';
  resultDiv.className = 'pwned-status';
  resultDiv.innerText = 'Checking database...';

  try {
    const buffer = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fullHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const prefix = fullHash.substring(0, 5);
    const suffix = fullHash.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const data = await response.text();

    const match = data.split('\r\n').find(line => line.startsWith(suffix));

    if (match) {
      const count = match.split(':')[1];
      resultDiv.className = 'pwned-status unsafe';
      resultDiv.innerText = `[!] Warning! This password has been seen ${parseInt(count).toLocaleString()} times in data breaches.`;
    } else {
      resultDiv.className = 'pwned-status safe';
      resultDiv.innerText = '[?] Good news! This password was not found in any known data breaches.';
    }
  } catch (err) {
    console.error(err);
    resultDiv.className = 'pwned-status unsafe';
    resultDiv.innerText = 'Error connecting to API.';
  }
}

initMap();
initNavigation();

fetchISSData();
setInterval(fetchISSData, 1000);