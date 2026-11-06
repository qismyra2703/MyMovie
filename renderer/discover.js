const $ = id => document.getElementById(id);
const API = 'https://www.omdbapi.com/';
let found = [];   // movies from the latest search (with full details)

// Never show the saved key, only a hint that it is saved
if (Store.get('mm_apikey', '')) $('apikey').placeholder = '••••••••  (key saved)';

// EVENT 1: save API key
$('saveKey').addEventListener('click', () => {
  const k = $('apikey').value.trim();
  if (!k) return toast('Please enter your OMDb API key.', 'err');
  Store.set('mm_apikey', k);
  $('apikey').value = ''; $('apikey').placeholder = '••••••••  (key saved)';   // clear the box
  toast('API key saved.');
});

// EVENT 2: search -> fetch JSON from API, then fetch details of each result
$('searchForm').addEventListener('submit', async e => {
  e.preventDefault();
  const q = $('query').value.trim(), key = Store.get('mm_apikey', '');
  if (!key) return toast('Save your OMDb API key first.', 'err');          // validation
  if (q.length < 2) return toast('Type at least 2 characters.', 'err');   // validation
  toast('Searching...', 'info');
  $('results').innerHTML = '';
  
  try {
    const res = await fetch(`${API}?apikey=${key}&type=movie&s=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error('Server replied ' + res.status + ' (check API key)');
    const data = await res.json();                                        
    if (data.Response === 'False') { found = []; return toast(data.Error || 'No results found.', 'err'); } // empty result
    found = await Promise.all(data.Search.slice(0, 8).map(async s => {

      const d = await (await fetch(`${API}?apikey=${key}&i=${s.imdbID}&plot=short`)).json();
      return { id: s.imdbID, title: d.Title, year: d.Year, genre: d.Genre || 'N/A',
               rating: parseFloat(d.imdbRating) || 0, runtime: parseInt(d.Runtime) || 0,
               plot: d.Plot || '', poster: d.Poster };
    }));
    renderResults();                                                       // DOM update
    toast(`Found ${found.length} movies.`);
  } catch (err) { toast('Request failed: ' + err.message, 'err'); }       // failed request
});

// DOM manipulation: build a card per movie
function renderResults() {
  const box = $('results'); box.innerHTML = '';
  found.forEach(m => {
    const card = document.createElement('div'); card.className = 'card';
    const img = document.createElement('img'); img.alt = m.title;
    img.src = m.poster && m.poster !== 'N/A' ? m.poster : '';
    const h = document.createElement('b'); h.textContent = `${m.title} (${m.year})`;
    const info = document.createElement('small');
    info.textContent = `${m.genre} •  ${m.rating || 'N/A'} • ${m.runtime ? m.runtime + ' min' : 'N/A'}`;
    const p = document.createElement('small'); p.textContent = m.plot;
    const btn = document.createElement('button'); btn.textContent = '+ Add to Watchlist';
    btn.addEventListener('click', () => { if (addToWatchlist(m)) markAdded(btn, card); }); // EVENT 3
    if (Store.get('mm_watchlist', []).some(x => x.id === m.id)) markAdded(btn, card);      // already saved earlier
    card.append(img, h, info, p, btn); box.appendChild(card);
  });
}

// Make the button show clearly that the movie is saved
function markAdded(btn, card) {
  btn.textContent = '✓ Added to Watchlist';
  btn.classList.add('added'); btn.disabled = true; card.classList.add('added');
}

// CRUD - Create: save a movie into Local Storage (returns true when the movie is in the list)
function addToWatchlist(m) {
  const list = Store.get('mm_watchlist', []);
  if (list.some(x => x.id === m.id)) { toast(`"${m.title}" is already in your watchlist.`, 'err'); return true; }
  list.push({ ...m, status: 'Planned', myRating: '', notes: '' });
  Store.set('mm_watchlist', list);
  toast(`✓ "${m.title}" added to your watchlist!`);
  return true;
}

// SUGGESTION LOGIC: student-written control statements
function suggestMovie(list, genre, maxMins, minRating) {
  let best = null;
  for (const m of list) {
    if (genre !== 'Any' && !m.genre.includes(genre)) continue;   // genre condition
    if (m.runtime === 0 || m.runtime > maxMins) continue;        // time condition
    if (m.rating < minRating) continue;                          // rating condition
    if (best === null || m.rating > best.rating) best = m;       // keep highest rated
  }
  if (best === null) return null;                                // fallback: nothing suitable
  let reason;
  if (best.rating >= 8) reason = 'Outstanding rating';
  else if (best.rating >= 7) reason = 'Very good rating';
  else reason = 'Decent rating';
  if (best.runtime <= 100) reason += ' and a short runtime';
  else if (best.runtime <= 140) reason += ' and a comfortable runtime';
  else reason += ' (long movie, plan ahead)';
  let tip;
  switch (genre) {
    case 'Comedy': tip = 'Great with friends.'; break;
    case 'Horror': tip = 'Watch with the lights off!'; break;
    case 'Romance': tip = 'Perfect for a calm evening.'; break;
    case 'Action': case 'Adventure': tip = 'Get your snacks ready.'; break;
    default: tip = 'Enjoy the show.';
  }
  return { movie: best, text: `${reason}. ${tip}` };
}

// EVENT 4: suggest button
$('suggestBtn').addEventListener('click', () => {
  const maxMins = Number($('maxMins').value), minRating = Number($('minRating').value);
  if (found.length === 0) return toast('Search for movies first.', 'err');
  if (!(maxMins >= 30 && maxMins <= 400) || !(minRating >= 0 && minRating <= 10))
    return toast('Time must be 30-400 minutes and rating 0-10.', 'err');
  const s = suggestMovie(found, $('genre').value, maxMins, minRating);
  const box = $('suggestion');


  if (!s) { box.textContent = 'No suitable movie found. Try another genre, more time, or a lower rating.'; return; }
  box.textContent = `Suggested: ${s.movie.title} (${s.movie.year}) - 
   ${s.movie.rating}, ${s.movie.runtime} min. ${s.text}`;
  const saved = Store.get('mm_suggestions', []);            // store suggestion in Local Storage
  saved.unshift({ title: s.movie.title, text: s.text, date: new Date().toLocaleString() });
  Store.set('mm_suggestions', saved.slice(0, 10));
  showSaved();
});

function showSaved() {
  const ul = $('savedSuggestions'); ul.innerHTML = '';
  Store.get('mm_suggestions', []).forEach(s => {
    const li = document.createElement('li'); li.textContent = `${s.title} - ${s.text} (${s.date})`; ul.appendChild(li);
  });
}
showSaved();
