const $ = id => document.getElementById(id);
let editId = null;

const load = () => Store.get('mm_watchlist', []);   // CRUD - Read
const save = list => Store.set('mm_watchlist', list);

// DOM manipulation: draw the table
function render() {
  const list = load(), body = $('rows'); body.innerHTML = '';
  $('empty').hidden = list.length > 0;
  list.forEach(m => {
    const tr = document.createElement('tr');
    [m.title, m.genre, m.runtime ? m.runtime + ' min' : 'N/A', m.rating || 'N/A', m.status, m.myRating === '' ? '-' : m.myRating]
      .forEach(v => { const td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
    const td = document.createElement('td');
    const ed = document.createElement('button'); ed.textContent = 'Edit';
    ed.addEventListener('click', () => openEdit(m.id));            // EVENT
    const del = document.createElement('button'); del.textContent = 'Delete'; del.className = 'danger'; del.style.marginLeft = '6px';
    del.addEventListener('click', () => remove(m.id));             // EVENT
    td.append(ed, del); tr.appendChild(td); body.appendChild(tr);
  });
  stats();
}

// CALCULATION: average rating, remaining watch time and days to finish
function stats() {
  const list = load();
  $('sCount').textContent = list.length;
  const rated = list.filter(m => m.rating > 0);
  $('sAvg').textContent = rated.length ? (rated.reduce((s, m) => s + m.rating, 0) / rated.length).toFixed(1) + ' / 10' : '-';
  const mins = list.filter(m => m.status !== 'Watched').reduce((s, m) => s + m.runtime, 0);
  $('sTime').textContent = `${Math.floor(mins / 60)} h ${mins % 60} min`;
  const perDay = Number($('perDay').value);
  $('sDays').textContent = perDay >= 1 && perDay <= 1440 ? Math.ceil(mins / perDay) + ' day(s)' : '-';
}
$('calcBtn').addEventListener('click', () => {
  const v = Number($('perDay').value);
  if (!(v >= 1 && v <= 1440)) return toast('Minutes per day must be between 1 and 1440.', 'err');
  stats(); toast('Statistics updated.');
});

// CRUD - Update
function openEdit(id) {
  const m = load().find(x => x.id === id); editId = id;
  $('eTitle').value = m.title; $('eStatus').value = m.status; $('eRating').value = m.myRating; $('eNotes').value = m.notes;
  $('editPanel').hidden = false;
}
$('saveEdit').addEventListener('click', () => {
  const r = $('eRating').value;
  if (r !== '' && !(Number(r) >= 0 && Number(r) <= 10)) return toast('Rating must be between 0 and 10.', 'err');
  if ($('eStatus').value === 'Watched' && r === '') return toast('Give a rating for a watched movie.', 'err');
  const list = load(), m = list.find(x => x.id === editId);
  m.status = $('eStatus').value; m.myRating = r === '' ? '' : Number(r); m.notes = $('eNotes').value.trim();
  save(list); $('editPanel').hidden = true; render(); toast(`"${m.title}" updated.`);
});
$('cancelEdit').addEventListener('click', () => { $('editPanel').hidden = true; });

// CRUD - Delete (with confirmation)
function remove(id) {
  const list = load(), m = list.find(x => x.id === id);
  if (!confirm(`Delete "${m.title}"?`)) return;
  save(list.filter(x => x.id !== id)); render(); toast(`"${m.title}" deleted.`);
}
render();