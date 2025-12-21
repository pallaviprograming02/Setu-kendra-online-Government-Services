

// ---------- Utilities ----------
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// set max date for DOB as today - 18yrs optional => here allow any but set max today
function setDOBMax() {
  const today = new Date().toISOString().split('T')[0];
  const el = document.getElementById('dob');
  if (el) el.max = today;
}

// bilingual update
function applyLanguage(lang){
  LANG.current = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang===lang));
  // update static strings
  document.getElementById('title-main').textContent = DICT[lang].title;
  document.getElementById('subtitle').textContent = DICT[lang].subtitle;
  document.getElementById('tools-title').textContent = DICT[lang].tools;
  document.getElementById('saveBtn').textContent = DICT[lang].save;
  document.getElementById('loadBtn').textContent = DICT[lang].load;
  document.getElementById('validateBtn').textContent = DICT[lang].validate;
  document.getElementById('exportBtn').textContent = DICT[lang].exportJson;
  document.getElementById('submitAllBtn').textContent = DICT[lang].submitLocal;
  document.getElementById('help-text').textContent = DICT[lang].help;
  document.getElementById('admin-title').textContent = DICT[lang].adminTitle;
  document.getElementById('exportCsv').textContent = DICT[lang].exportCSV;
  document.getElementById('clearAll').textContent = DICT[lang].clearAll;

  // update form labels (if we want full translation, you'd store translations for each label)
}

// ---------- Render forms ----------
let activeForm = 'setu';
const formArea = document.getElementById('formArea');
function renderForm(name){
  activeForm = name;
  formArea.innerHTML = TEMPLATES[name].html;
  setDOBMax();
  attachFilePreview();
}

// ---------- Validation functions ----------
function isValidPhone(v){
  // Indian 10-digit mobile starting 6-9 (common rule)
  return /^\s*[6-9]\d{9}\s*$/.test(v || '');
}
function isValidAadhaar(v){
  // Aadhaar: 12 digits; you can do stronger checksum validation separately
  return /^\d{12}$/.test(v || '');
}
function isValidEmail(v){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');
}
function validateCurrentForm(){
  const reqs = formArea.querySelectorAll('[required]');
  let ok = true;
  // remove old errors
  formArea.querySelectorAll('.error-msg').forEach(e => e.remove());

  reqs.forEach(i=>{
    if (!i.value || i.value.trim()===''){
      ok=false; showError(i, 'Required');
    } else {
      // pattern checks
      if (i.id==='operatorPhone' || i.id==='workerPhone'){
        if (!isValidPhone(i.value)) { ok=false; showError(i, 'Invalid phone'); }
      }
      if (i.id==='centreEmail' && i.value){
        if (!isValidEmail(i.value)) { ok=false; showError(i, 'Invalid email'); }
      }
      if (i.id==='aadhaar' && i.value){
        if (!isValidAadhaar(i.value)) { ok=false; showError(i, 'Invalid Aadhaar'); }
      }
    }
  });
  return ok;
}
function showError(inputEl, msg){
  const e = document.createElement('div'); e.className='error-msg'; e.style.color='var(--danger)'; e.style.fontSize='13px'; e.textContent = msg;
  inputEl.parentNode.appendChild(e);
}

// ---------- Save & Load Draft ----------
function gatherValues(){
  const data = { form: activeForm, ts: new Date().toISOString(), values: {} };
  const inputs = formArea.querySelectorAll('input, textarea, select');
  inputs.forEach(i=>{
    if (i.type==='checkbox') data.values[i.id] = i.checked;
    else if (i.type==='file') data.values[i.id] = i.files && i.files.length ? i.files[0].name : '';
    else data.values[i.id] = i.value;
  });
  return data;
}
function fillFromData(data){
  if (!data || !data.values) return;
  Object.keys(data.values).forEach(k=>{
    const el = document.getElementById(k);
    if (!el) return;
    if (el.type==='checkbox') el.checked = data.values[k];
    else el.value = data.values[k];
  });
}

// autosave
let autoSave = true;
setInterval(()=> {
  if (!autoSave) return;
  try {
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(gatherValues()));
    //console.log('autosaved');
  } catch(e){}
}, 7000);

// buttons
document.getElementById('saveBtn').addEventListener('click', ()=>{
  localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(gatherValues()));
  flash('Saved locally');
});
document.getElementById('loadBtn').addEventListener('click', ()=>{
  const raw = localStorage.getItem(AUTO_SAVE_KEY);
  if (!raw) return flash('No saved draft', 'error');
  fillFromData(JSON.parse(raw));
  flash('Loaded draft');
});
document.getElementById('validateBtn').addEventListener('click', ()=>{
  if (validateCurrentForm()) flash('All good 👍', 'success'); else flash('Please fix errors', 'error');
});
document.getElementById('exportBtn').addEventListener('click', ()=>{
  const payload = gatherValues();
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download = ${activeForm}-form.json; a.click(); URL.revokeObjectURL(url);
  flash('JSON downloaded');
});

// submit locally (stores to submissions)
document.getElementById('submitAllBtn').addEventListener('click', ()=>{
  if (!validateCurrentForm()) return flash('Fix form errors before submit', 'error');
  const payload = gatherValues();
  let arr = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]');
  arr.unshift(payload);
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(arr));
  renderSubmissionList();
  flash('Submitted locally — visible in Admin');
});

// tabs
$$('.tab').forEach(t => t.addEventListener('click', e => {
  $$('.tab').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  renderForm(t.dataset.form);
}));

// language toggle
$$('.lang-btn').forEach(b => b.addEventListener('click', ()=>{
  applyLanguage(b.dataset.lang);
}));

// admin panel toggle
document.getElementById('adminToggle').addEventListener('click', ()=> {
  document.getElementById('adminPanel').classList.toggle('hidden');
  renderSubmissionList();
});
document.getElementById('closeAdmin').addEventListener('click', ()=> {
  document.getElementById('adminPanel').classList.add('hidden');
});

// admin actions
document.getElementById('exportCsv').addEventListener('click', exportCSV);
document.getElementById('clearAll').addEventListener('click', ()=>{
  if (!confirm('Delete all submissions?')) return;
  localStorage.removeItem(SUBMISSIONS_KEY);
  renderSubmissionList();
});

// helpful flash
function flash(msg, type='ok'){
  const d = document.createElement('div');
  d.textContent = msg;
  d.style.position='fixed'; d.style.right='18px'; d.style.bottom='18px'; d.style.padding='10px 14px'; d.style.borderRadius='10px';
  d.style.boxShadow='0 8px 20px rgba(2,6,23,0.12)';
  d.style.background = type==='error' ? '#fee2e2' : (type==='success' ? '#ecfdf5' : '#eef2ff');
  d.style.col