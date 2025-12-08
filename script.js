// script.js - simple standalone code (no frameworks)
const grid = document.getElementById('grid');
const genreSelect = document.getElementById('genre');
const platformSelect = document.getElementById('platform');
const sortSelect = document.getElementById('sort');
const searchInput = document.getElementById('search');
const resetBtn = document.getElementById('reset');

let games = [];      // loaded from JSON
let displayed = [];  // current array after filter/sort

// load JSON
async function loadGames(){
  try{
    const res = await fetch('games.json');
    games = await res.json();
    // normalize some properties for safety
    games.forEach(g => {
      g.title = String(g.title || 'Untitled');
      g.score = Number(g.score || 0);
      g.release = g.release ? Number(g.release) : null;
      g.genre = Array.isArray(g.genre) ? g.genre : (g.genre ? [g.genre] : []);
      g.platform = g.platform || 'Unknown';
    });
    populateFilters();
    applyFilters();
  }catch(e){
    grid.innerHTML = `<p style="color:var(--muted)">Couldn't load games.json — make sure it's uploaded.</p>`;
    console.error(e);
  }
}

// populate genre + platform selects
function populateFilters(){
  const genres = new Set();
  const platforms = new Set();
  games.forEach(g => {
    g.genre.forEach(gg => genres.add(gg));
    platforms.add(g.platform);
  });

  // genre
  genres.forEach(g => {
    const o = document.createElement('option');
    o.value = g; o.textContent = g;
    genreSelect.appendChild(o);
  });
  // platform
  platforms.forEach(p => {
    const o = document.createElement('option');
    o.value = p; o.textContent = p;
    platformSelect.appendChild(o);
  });
}

// apply filter + sort + search
function applyFilters(){
  const q = (searchInput.value || '').toLowerCase().trim();
  const genre = genreSelect.value;
  const platform = platformSelect.value;
  const sort = sortSelect.value;

  displayed = games.filter(g => {
    if(genre !== 'all' && !g.genre.includes(genre)) return false;
    if(platform !== 'all' && g.platform !== platform) return false;
    if(q && !g.title.toLowerCase().includes(q)) return false;
    return true;
  });

  // sorting
  displayed.sort((a,b) => {
    switch(sort){
      case 'title-asc': return a.title.localeCompare(b.title);
      case 'title-desc': return b.title.localeCompare(a.title);
      case 'release-desc': return (b.release||0) - (a.release||0);
      case 'release-asc': return (a.release||0) - (b.release||0);
      case 'score-desc': return (b.score||0) - (a.score||0);
      case 'score-asc': return (a.score||0) - (b.score||0);
      default: return 0;
    }
  });

  renderGrid();
}

// create card HTML
function renderGrid(){
  grid.innerHTML = '';
  if(displayed.length === 0){
    grid.innerHTML = `<p style="color:var(--muted)">No games match your filter.</p>`;
    return;
  }

  displayed.forEach(g => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.tabIndex = 0;
    wrapper.setAttribute('role','button');
    wrapper.setAttribute('aria-pressed','false');

    const inner = document.createElement('div');
    inner.className = 'card-inner';

    // front
    const front = document.createElement('div');
    front.className = 'face front';
    const img = document.createElement('img');
    img.className = 'logo';
    img.alt = g.title + ' logo';
    img.src = g.logo || 'images/placeholder.png';
    front.appendChild(img);

    // back
    const back = document.createElement('div');
    back.className = 'face back';
    const scoreEl = document.createElement('div');
    scoreEl.className = 'score';
    scoreEl.textContent = (g.score || 0) + '/10';
    const sub = document.createElement('div');
    sub.className = 'score-sub';
    sub.textContent = `${g.title}${g.release ? ' • ' + g.release : ''}`;
    back.appendChild(scoreEl);
    back.appendChild(sub);

    inner.appendChild(front);
    inner.appendChild(back);
    wrapper.appendChild(inner);

    // meta below card
    const meta = document.createElement('div');
    meta.className = 'meta';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = g.title;
    const metaSub = document.createElement('div');
    metaSub.className = 'meta-sub';
    metaSub.textContent = `${g.platform} • ${g.genre.join(', ')}`;
    meta.appendChild(title);
    meta.appendChild(metaSub);

    // click / keyboard handling toggles flipped class
    function toggleFlip(){
      const flipped = wrapper.classList.toggle('flipped');
      wrapper.setAttribute('aria-pressed', flipped ? 'true' : 'false');
    }
    wrapper.addEventListener('click', toggleFlip);
    wrapper.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFlip(); }
    });

    // append
    const container = document.createElement('div');
    container.appendChild(wrapper);
    container.appendChild(meta);
    grid.appendChild(container);
  });
}

// event listeners
[genreSelect, platformSelect, sortSelect].forEach(el => el.addEventListener('change', applyFilters));
searchInput.addEventListener('input', () => {
  // small debounce
  clearTimeout(searchInput._t);
  searchInput._t = setTimeout(applyFilters, 180);
});
resetBtn.addEventListener('click', () => {
  searchInput.value = '';
  genreSelect.value = 'all';
  platformSelect.value = 'all';
  sortSelect.value = 'title-asc';
  applyFilters();
});

// init
loadGames();