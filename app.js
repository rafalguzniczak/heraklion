const stops = [
  {id:'00',title:'Na początek: Kreta i Heraklion',time:'Wstęp · posłuchajcie w drodze do punktu 1',description:'Krótka opowieść o wyspie i mieście, które za chwilę odkryjecie.',next:'Do punktu 1: park Georgiadis · zacieniony początek spaceru',lat:35.33576,lon:25.13816,file:'00 Wstep – Kreta i Heraklion.mp3'},
  {id:'01',title:'Park Georgiadis',time:'11:35 · zacieniony początek',description:'Zieleń i kreteńskie zioła tuż przy centrum.',next:'Do targu przy ulicy 1866 · 8–12 min',lat:35.33576,lon:25.13816,file:'01 Park Georgiadis.mp3'},
  {id:'02',title:'Targ przy ulicy 1866',time:'12:05 · lokalne smaki',description:'Zioła, sery, miód i historia ukryta w nazwie ulicy.',next:'Do katedry Agios Minas · 4–6 min',lat:35.33757,lon:25.13337,file:'02 Targ.mp3'},
  {id:'03',title:'Katedra Agios Minas',time:'12:30 · plac i katedra',description:'Opowieść o patronie miasta i długiej budowie świątyni.',next:'Do fontanny Morosiniego · 5–7 min',lat:35.33761,lon:25.13094,file:'03 Katedra.mp3'},
  {id:'04',title:'Fontanna Morosiniego',time:'12:45 · plac Lwów',description:'Cztery lwy i niezwykła historia miejskiej wody.',next:'Do Peskesi · 3–4 min',lat:35.33916,lon:25.13321,file:'04 Fontanna.mp3'},
  {id:'05',title:'Obiad w Peskesi',time:'13:00 · kreteński obiad',description:'Lokalne produkty, własna farma i dawne odmiany roślin.',next:'Do Loggii i Agios Titos · 4–5 min',lat:35.34037,lon:25.13254,file:'05 Peskesi.mp3'},
  {id:'06',title:'Loggia i Agios Titos',time:'14:20 · weneckie centrum',description:'Arkady, życie towarzyskie i kolejne rozdziały historii miasta.',next:'Do portu weneckiego · 7–10 min',lat:35.33983,lon:25.13418,file:'06 Loggia.mp3'},
  {id:'07',title:'Port wenecki',time:'14:50 · widok na morze',description:'Stare stocznie, statki i handel, który łączył Kretę z Europą.',next:'Do twierdzy Koules · 5–8 min',lat:35.3424,lon:25.13567,file:'07 Port.mp3'},
  {id:'08',title:'Twierdza Koules',time:'15:15 · forteca nad morzem',description:'Skrzydlaty lew, kamienne mury i mały świat wewnątrz fortecy.',next:'Do promenady przy muzeum · 18–25 min',lat:35.34464,lon:25.13685,file:'08 Koules.mp3'},
  {id:'09',title:'Promenada i muzeum',time:'15:55 · spacer wzdłuż morza',description:'Dawna elektrownia i Heraklion w epoce elektryczności.',next:'Do Chanioporty · 12–18 min',lat:35.3422,lon:25.12675,file:'09 Promenada.mp3'},
  {id:'R',title:'Chanioporta i powrót',time:'16:30 · okolice przystanku',description:'Ostatnia historia przy weneckiej bramie. Autobus 6 w kierunku Ammoudara — potwierdźcie przystanek na miejscu.',next:'Powrót do Atlantica Akti Zeus',lat:35.33655,lon:25.12428,file:'R Chanioporta.mp3'}
];

const audio = document.querySelector('#audio');
const list = document.querySelector('#stops');
const player = document.querySelector('#player');
const toggle = document.querySelector('#player-toggle');
const next = document.querySelector('#player-next');
const seek = document.querySelector('#seek');
let current = -1;
const urlFor = stop => `audio/${encodeURIComponent(stop.file)}`;
const fmt = seconds => Number.isFinite(seconds) ? `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}` : '0:00';

const locateButton = document.querySelector('#locate');
const locationStatus = document.querySelector('#location-status');
let tracking = false, locationTimer = null, requestingLocation = false, lastNearestId = null;

const distanceBetween = (lat1, lon1, lat2, lon2) => {
  const rad = degrees => degrees * Math.PI / 180;
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

function stopTracking() {
  tracking = false;
  clearInterval(locationTimer);
  locationTimer = null;
  locateButton.textContent = '📍 Włącz lokalizację na żywo';
  locateButton.setAttribute('aria-pressed', 'false');
}

function updateNearestLocation() {
  if (!tracking || requestingLocation || document.hidden || !navigator.geolocation) return;
  requestingLocation = true;
  navigator.geolocation.getCurrentPosition(({ coords }) => {
    requestingLocation = false;
    if (!tracking || document.hidden) return;
    const nearest = stops.filter(stop => stop.id !== '00').map(stop => ({
      stop,
      distance: distanceBetween(coords.latitude, coords.longitude, stop.lat, stop.lon)
    })).sort((a, b) => a.distance - b.distance)[0];
    if (nearest.stop.id !== lastNearestId) {
      document.querySelectorAll('.stop.nearby').forEach(card => card.classList.remove('nearby'));
      const card = document.getElementById('stop-' + nearest.stop.id);
      if (card) {
        card.classList.add('nearby');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      lastNearestId = nearest.stop.id;
    }
    const distanceText = nearest.distance < 1000
      ? 'około ' + (Math.round(nearest.distance / 10) * 10) + ' m'
      : (nearest.distance / 1000).toFixed(1).replace('.', ',') + ' km';
    locationStatus.textContent = nearest.distance <= 150
      ? 'Jesteście przy: ' + nearest.stop.title + '.'
      : 'Najbliższy punkt: ' + nearest.stop.title + ' — ' + distanceText + ' od Was.';
    if (coords.accuracy > 100) locationStatus.textContent += ' Dokładność GPS: około ±' + Math.round(coords.accuracy) + ' m.';
    locationStatus.textContent += ' Aktualizacja: ' + new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit' }).format(new Date()) + '.';
  }, error => {
    requestingLocation = false;
    const messages = {
      1: 'Brak zgody na lokalizację. Włącz ją w ustawieniach przeglądarki.',
      2: 'Nie udało się ustalić pozycji. Spróbuję ponownie za chwilę.',
      3: 'Ustalanie pozycji trwa zbyt długo. Spróbuję ponownie za chwilę.'
    };
    locationStatus.textContent = messages[error.code] || 'Nie udało się ustalić pozycji.';
    if (error.code === 1) stopTracking();
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
}

locateButton.addEventListener('click', () => {
  if (tracking) {
    stopTracking();
    locationStatus.textContent = 'Lokalizacja na żywo wyłączona.';
    return;
  }
  if (!navigator.geolocation) {
    locationStatus.textContent = 'Ta przeglądarka nie udostępnia lokalizacji.';
    return;
  }
  tracking = true;
  locateButton.textContent = '■ Wyłącz lokalizację na żywo';
  locateButton.setAttribute('aria-pressed', 'true');
  locationStatus.textContent = 'Ustalam pozycję…';
  updateNearestLocation();
  locationTimer = setInterval(updateNearestLocation, 30000);
});

document.addEventListener('visibilitychange', () => {
  if (!tracking) return;
  clearInterval(locationTimer);
  if (document.hidden) {
    locationStatus.textContent = 'Aplikacja w tle — lokalizacja wstrzymana. Wznowi się po powrocie.';
  } else {
    updateNearestLocation();
    locationTimer = setInterval(updateNearestLocation, 30000);
  }
});

list.innerHTML = stops.map((stop, index) => `
  <article class="stop" id="stop-${stop.id}">
    <div class="stop-head"><span class="number">${stop.id}</span><div class="stop-name"><h3>${stop.title}</h3><div class="stop-sub">${stop.time}</div></div></div>
    <div class="stop-body"><p>${stop.description}</p>
      <div class="stop-actions">
        <button class="play" type="button" data-index="${index}" aria-label="Odtwórz: ${stop.title}">▶ Odtwórz</button>
        <a class="map-link" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lon}">↗ Mapa</a>
        <a class="download" href="${urlFor(stop)}" download>↓ MP3</a>
      </div></div><div class="leg"><b>→ Dalej:</b> ${stop.next}</div>
  </article>`).join('');

function refresh() {
  document.querySelectorAll('.stop').forEach((card, i) => {
    card.classList.toggle('active', i === current);
    const button = card.querySelector('.play');
    const playing = i === current && !audio.paused;
    button.textContent = playing ? 'Ⅱ Pauza' : '▶ Odtwórz';
    button.setAttribute('aria-label', `${playing ? 'Wstrzymaj' : 'Odtwórz'}: ${stops[i].title}`);
  });
  toggle.textContent = audio.paused ? '▶' : 'Ⅱ';
  toggle.setAttribute('aria-label', audio.paused ? 'Odtwórz' : 'Wstrzymaj');
  next.disabled = current >= stops.length - 1;
}

async function play(index) {
  if (index < 0 || index >= stops.length) return;
  if (index === current) {
    if (audio.paused) { try { await audio.play(); } catch (_) {} }
    else audio.pause();
    refresh();
    return;
  }
  current = index;
  audio.src = urlFor(stops[index]);
  player.hidden = false;
  document.querySelector('#player-title').textContent = stops[index].title;
  document.querySelector('#player-label').textContent = `${stops[index].id} · Teraz słuchasz`;
  document.querySelector('#elapsed').textContent = '0:00';
  document.querySelector('#duration').textContent = '0:00';
  seek.value = 0;
  try { localStorage.setItem('heraklion-last-stop', String(index)); } catch (_) {}
  refresh();
  try { await audio.play(); } catch (_) { refresh(); }
}

list.addEventListener('click', event => {
  const button = event.target.closest('.play');
  if (button) play(Number(button.dataset.index));
});
toggle.addEventListener('click', () => play(current));
next.addEventListener('click', () => play(current + 1));
audio.addEventListener('play', refresh);
audio.addEventListener('pause', refresh);
audio.addEventListener('loadedmetadata', () => { document.querySelector('#duration').textContent = fmt(audio.duration); });
audio.addEventListener('timeupdate', () => {
  document.querySelector('#elapsed').textContent = fmt(audio.currentTime);
  seek.value = audio.duration ? Math.round(audio.currentTime / audio.duration * 1000) : 0;
});
seek.addEventListener('input', () => { if (audio.duration) audio.currentTime = audio.duration * Number(seek.value) / 1000; });
audio.addEventListener('ended', () => { refresh(); if (current < stops.length - 1) play(current + 1); });

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
try {
  const saved = localStorage.getItem('heraklion-last-stop');
  const last = saved === null ? -1 : Number(saved);
  if (Number.isInteger(last) && last >= 0 && last < stops.length) {
    const card = document.querySelectorAll('.stop')[last];
    card.querySelector('.stop-sub').textContent += ' · ostatnio słuchane';
  }
} catch (_) {}
