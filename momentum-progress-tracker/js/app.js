// ══════════════════════════════════════════════════════
//  DATA
// ══════════════════════════════════════════════════════
const CATS = ['Fitness','Learning','Health','Work','Finance','Creative'];
const CAT_COLORS = {
  Fitness:'#c8f050', Learning:'#4f7cff', Health:'#ff6b6b',
  Work:'#a855f7', Finance:'#f59e0b', Creative:'#2dd4bf'
};

function loadData(){
  try { return JSON.parse(localStorage.getItem('momentum_data')) || null; } catch { return null; }
}
function saveData(){ localStorage.setItem('momentum_data', JSON.stringify(data)); }

function seedData(){
  const today = new Date();
  const d = (offset=0) => {
    const dt = new Date(today); dt.setDate(dt.getDate()-offset);
    return dt.toISOString().slice(0,10);
  };
  return {
    entries:[
      {id:1000,title:'Morning run',category:'Fitness',value:8.2,unit:'km',date:d(0),mood:'🔥 Fired up',notes:'Felt great, new PR pace!'},
      {id:1001,title:'Read Atomic Habits',category:'Learning',value:35,unit:'pages',date:d(0),mood:'😊 Good',notes:''},
      {id:1002,title:'Gym — Chest day',category:'Fitness',value:45,unit:'mins',date:d(1),mood:'💪 Strong',notes:'Bench press PB at 80kg'},
      {id:1003,title:'Meditate',category:'Health',value:20,unit:'mins',date:d(1),mood:'🧘 Calm',notes:''},
      {id:1004,title:'Deep work sprint',category:'Work',value:3,unit:'hours',date:d(2),mood:'🔥 Fired up',notes:'Finished the main feature'},
      {id:1005,title:'Budget review',category:'Finance',value:1,unit:'sessions',date:d(2),mood:'😐 Neutral',notes:'Cut subscriptions down by $40'},
      {id:1006,title:'Sketch concepts',category:'Creative',value:2,unit:'hours',date:d(3),mood:'😊 Good',notes:''},
      {id:1007,title:'Yoga flow',category:'Health',value:30,unit:'mins',date:d(3),mood:'🧘 Calm',notes:''},
      {id:1008,title:'Ride — cycling',category:'Fitness',value:22,unit:'km',date:d(4),mood:'💪 Strong',notes:''},
      {id:1009,title:'Online course module',category:'Learning',value:2,unit:'chapters',date:d(4),mood:'😊 Good',notes:'React advanced patterns'},
      {id:1010,title:'Code review',category:'Work',value:90,unit:'mins',date:d(5),mood:'😐 Neutral',notes:''},
      {id:1011,title:'Evening run',category:'Fitness',value:5,unit:'km',date:d(6),mood:'😓 Tired',notes:''},
      {id:1012,title:'Invest contribution',category:'Finance',value:500,unit:'$',date:d(7),mood:'😊 Good',notes:'Monthly DCA'},
      {id:1013,title:'Watercolor session',category:'Creative',value:90,unit:'mins',date:d(7),mood:'😊 Good',notes:'Landscape study'},
      {id:1014,title:'Sprint planning',category:'Work',value:2,unit:'hours',date:d(8),mood:'😐 Neutral',notes:''},
      {id:1015,title:'Pull day — gym',category:'Fitness',value:50,unit:'mins',date:d(9),mood:'💪 Strong',notes:''},
      {id:1016,title:'Read SICP',category:'Learning',value:20,unit:'pages',date:d(10),mood:'😊 Good',notes:'Chapter on closures'},
      {id:1017,title:'5km run',category:'Fitness',value:5,unit:'km',date:d(11),mood:'😊 Good',notes:''},
      {id:1018,title:'Nutrition tracking',category:'Health',value:1,unit:'sessions',date:d(12),mood:'😐 Neutral',notes:''},
      {id:1019,title:'Side project dev',category:'Work',value:4,unit:'hours',date:d(13),mood:'🔥 Fired up',notes:'Launched MVP'},
    ],
    goals:[
      {id:2000,name:'Run 100km this month',category:'Fitness',target:100,current:40.4,unit:'km',deadline:d(-new Date().getDate()+1).slice(0,7)+'-'+(new Date(today.getFullYear(),today.getMonth()+1,0).getDate())},
      {id:2001,name:'Read 12 books this year',category:'Learning',target:12,current:5,unit:'books',deadline:today.getFullYear()+'-12-31'},
      {id:2002,name:'Save $10,000',category:'Finance',target:10000,current:6500,unit:'$',deadline:today.getFullYear()+'-12-31'},
      {id:2003,name:'Meditate 30 days',category:'Health',target:30,current:18,unit:'sessions',deadline:d(-14)},
    ]
  };
}

let data = loadData() || seedData();
if(!loadData()){ saveData(); }

// ══════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════
let activePage = 'dashboard';
let selectedCat = 'Fitness';
let activeLogFilter = 'All';
let activeGoalFilter = 'All';
let selectMode = false;
let selectedIds = new Set();
let editingEntryId = null;
let confirmCallback = null;
let updateGoalId = null;
let weeklyChartInst = null;

// ══════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════
function navigate(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  const pageEl = document.getElementById('page-'+page);
  pageEl.classList.add('active');
  // re-trigger animation
  pageEl.style.animation='none';
  pageEl.offsetHeight;
  pageEl.style.animation='';
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  activePage = page;
  if(page==='dashboard') renderDashboard();
  if(page==='log') renderLog();
  if(page==='goals') renderGoals();
  if(page==='analytics') renderAnalytics();
}
document.querySelectorAll('.nav-link').forEach(btn=>{
  btn.addEventListener('click', ()=>navigate(btn.dataset.page));
});

// ══════════════════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════════════════
function catColor(cat){ return CAT_COLORS[cat]||'#888'; }
function fmtDate(s){
  const d=new Date(s+'T00:00:00'); 
  return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
}
function daysLeft(deadline){
  const now=new Date(); now.setHours(0,0,0,0);
  const dl=new Date(deadline+'T00:00:00');
  return Math.round((dl-now)/(1000*60*60*24));
}
function calcStreak(){
  const dates=[...new Set(data.entries.map(e=>e.date))].sort().reverse();
  if(!dates.length) return 0;
  let streak=0, cur=new Date(); cur.setHours(0,0,0,0);
  for(const d of dates){
    const dt=new Date(d+'T00:00:00');
    const diff=Math.round((cur-dt)/(1000*60*60*24));
    if(diff===0||diff===streak){ streak=Math.max(streak,diff+1); cur=dt; }
    else if(diff===streak+1){ streak++; cur=dt; }
    else break;
  }
  // simpler approach
  const sorted=[...new Set(data.entries.map(e=>e.date))].sort().reverse();
  let s=0;
  const today=new Date(); today.setHours(0,0,0,0);
  for(let i=0;i<sorted.length;i++){
    const dt=new Date(sorted[i]+'T00:00:00');
    const expected=new Date(today); expected.setDate(today.getDate()-i);
    if(dt.getTime()===expected.getTime()) s++;
    else break;
  }
  return s;
}
function todayStr(){ return new Date().toISOString().slice(0,10); }

// ══════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════
let toastTimer=null;
function toast(msg,type='success'){
  const c=document.getElementById('toast-container');
  const t=document.createElement('div');
  t.className=`toast ${type}`;
  t.innerHTML=`<span>${type==='success'?'✓':type==='error'?'✕':'ℹ'}</span> ${msg}`;
  c.appendChild(t);
  if(toastTimer) clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{
    t.classList.add('fade-out');
    setTimeout(()=>t.remove(),300);
  },2600);
}

// ══════════════════════════════════════════════════════
//  STREAK
// ══════════════════════════════════════════════════════
function updateStreak(){
  document.getElementById('streak-count').textContent=calcStreak();
}

// ══════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════
function renderDashboard(){
  updateStreak();
  document.getElementById('dash-date').textContent=new Date().toLocaleDateString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

  // stats
  const streak=calcStreak();
  const thisWeek=data.entries.filter(e=>{
    const d=new Date(e.date+'T00:00:00'), now=new Date();
    now.setHours(0,0,0,0);
    return (now-d)/(1000*60*60*24)<=6;
  }).length;
  const totalGoals=data.goals.length;
  const avgComplete=totalGoals ? Math.round(data.goals.reduce((a,g)=>a+Math.min(100,g.current/g.target*100),0)/totalGoals) : 0;
  document.getElementById('dash-stats').innerHTML=`
    ${statCard('Total Entries',data.entries.length,'all time')}
    ${statCard('This Week',thisWeek,'last 7 days')}
    ${statCard('Active Goals',totalGoals,'in progress')}
    ${statCard('Avg Completion',avgComplete+'%','across goals')}
  `;

  // recent entries
  const recent=data.entries.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  const el=document.getElementById('dash-entries');
  el.innerHTML=recent.length ? recent.map(entryRowHTML).join('')+'<div style="height:8px"></div>' : emptyHTML('No entries yet','Start logging your progress!');

  // goals
  const dg=document.getElementById('dash-goals');
  const gs=data.goals.slice(0,4);
  dg.innerHTML=gs.map(g=>{
    const pct=Math.min(100,Math.round(g.current/g.target*100));
    const c=catColor(g.category);
    return `<div class="dash-goal-card">
      <div style="color:${c}" class="dash-goal-pct">${pct}%</div>
      <div class="dash-goal-name">${g.name}</div>
      <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%;background:${c}"></div></div>
      <div style="font-size:11px;color:var(--text3);font-family:'DM Mono',monospace">${g.current} / ${g.target} ${g.unit}</div>
    </div>`;
  }).join('');
}
function statCard(label,val,meta){
  return `<div class="stat-card">
    <div class="stat-label">${label}</div>
    <div class="stat-val">${val}</div>
    <div class="stat-meta">${meta}</div>
  </div>`;
}

// ══════════════════════════════════════════════════════
//  LOG
// ══════════════════════════════════════════════════════
function renderLog(){
  // build category pills
  const cats=['All',...new Set(data.entries.map(e=>e.category))];
  const pillsEl=document.getElementById('log-cat-pills');
  pillsEl.innerHTML=cats.map(c=>`<button class="filter-pill${activeLogFilter===c?' active':''}" onclick="setLogFilter('${c}')">${c}</button>`).join('');

  // filter & search
  const q=document.getElementById('log-search').value.toLowerCase();
  let entries=data.entries.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
  if(activeLogFilter!=='All') entries=entries.filter(e=>e.category===activeLogFilter);
  if(q) entries=entries.filter(e=>(e.title+e.category+(e.notes||'')).toLowerCase().includes(q));

  // render
  const container=document.getElementById('log-list');
  if(!entries.length){ container.innerHTML=emptyHTML('No entries found','Try adjusting your search or filter'); return; }

  const smClass=selectMode?' class="select-mode"':'';
  container.innerHTML=`<div${smClass} id="entries-wrap">${entries.map(e=>entryRowHTML(e,true)).join('')}</div>`;

  // restore checkboxes
  if(selectMode){
    selectedIds.forEach(id=>{
      const cb=container.querySelector(`input[data-id="${id}"]`);
      if(cb) cb.checked=true;
    });
  }
  updateBulkBar();
}
function setLogFilter(cat){
  activeLogFilter=cat;
  renderLog();
}
function entryRowHTML(e, showActions=false){
  const c=catColor(e.category);
  const tagStyle=`background:${c}22;color:${c};border:1px solid ${c}44`;
  const actionsHTML=showActions?`<div class="row-actions">
    <div class="icon-btn" title="Edit" onclick="editEntry(${e.id})">✏️</div>
    <div class="icon-btn" title="Delete" onclick="deleteEntry(${e.id},'${e.title.replace(/'/g,"\\'")}')">🗑</div>
  </div>`:'';
  const checkHTML=`<input type="checkbox" class="entry-check" data-id="${e.id}" onchange="onCheckChange(${e.id},this.checked)"/>`;
  const notesHTML=e.notes?`<div class="entry-notes">${e.notes}</div>`:'';
  return `
    <div class="entry-row">
      ${checkHTML}
      <div class="entry-dot" style="background:${c}"></div>
      <div class="entry-title">${e.title}</div>
      <div class="entry-meta">
        <span class="entry-mood">${e.mood.split(' ')[0]}</span>
        <span class="tag" style="${tagStyle}">${e.category}</span>
      </div>
      <span class="entry-val">${e.value} ${e.unit}</span>
      <span class="entry-date">${fmtDate(e.date)}</span>
      ${actionsHTML}
    </div>${notesHTML}`;
}
function emptyHTML(title,sub){
  return `<div class="empty"><div class="empty-icon">◌</div><div class="empty-title">${title}</div><div class="empty-sub">${sub}</div></div>`;
}

// SELECT MODE
function toggleSelectMode(){
  selectMode=!selectMode;
  selectedIds.clear();
  document.getElementById('select-toggle').classList.toggle('active',selectMode);
  renderLog();
}
function cancelSelectMode(){
  selectMode=false; selectedIds.clear();
  document.getElementById('select-toggle').classList.remove('active');
  renderLog();
}
function onCheckChange(id,checked){
  checked?selectedIds.add(id):selectedIds.delete(id);
  updateBulkBar();
}
function updateBulkBar(){
  const bar=document.getElementById('bulk-bar');
  const n=selectedIds.size;
  if(selectMode && n>0){ bar.classList.add('visible'); document.getElementById('bulk-count-label').textContent=`${n} selected`; }
  else bar.classList.remove('visible');
}
function selectAllVisible(){
  const wrap=document.getElementById('entries-wrap');
  if(!wrap) return;
  wrap.querySelectorAll('.entry-check').forEach(cb=>{ cb.checked=true; selectedIds.add(Number(cb.dataset.id)); });
  updateBulkBar();
}
function bulkDelete(){
  if(!selectedIds.size) return;
  openConfirm('Delete entries',`Delete <strong>${selectedIds.size} selected entr${selectedIds.size===1?'y':'ies'}</strong>? This cannot be undone.`,`Delete ${selectedIds.size}`,()=>{
    data.entries=data.entries.filter(e=>!selectedIds.has(e.id));
    saveData(); selectedIds.clear(); selectMode=false;
    document.getElementById('select-toggle').classList.remove('active');
    toast(`Deleted entries`,'info'); renderLog(); updateStreak();
  });
}

// ══════════════════════════════════════════════════════
//  ADD / EDIT ENTRY
// ══════════════════════════════════════════════════════
function initEntryForm(){
  // category pills
  const pillsEl=document.getElementById('cat-pills');
  pillsEl.innerHTML=CATS.map(c=>`<div class="cat-pill${c==='Fitness'?' sel-Fitness':''}" onclick="selectCat('${c}')">${c}</div>`).join('');
  // default date
  document.getElementById('entry-date').value=todayStr();
}
function selectCat(cat){
  selectedCat=cat;
  document.getElementById('entry-category').value=cat;
  document.querySelectorAll('.cat-pill').forEach(p=>{ p.className='cat-pill'; });
  const pill=Array.from(document.querySelectorAll('.cat-pill')).find(p=>p.textContent===cat);
  if(pill) pill.classList.add(`sel-${cat}`);
}
function clearEntryForm(){
  document.getElementById('entry-title').value='';
  document.getElementById('entry-value').value='';
  document.getElementById('entry-unit').value='km';
  document.getElementById('entry-date').value=todayStr();
  document.getElementById('entry-mood').value='😊 Good';
  document.getElementById('entry-notes').value='';
  editingEntryId=null;
  document.getElementById('edit-badge').style.display='none';
  document.getElementById('cancel-edit-btn').style.display='none';
  document.getElementById('add-title').textContent='Add Entry';
  document.getElementById('add-sub').textContent='Log your progress';
  document.getElementById('save-entry-btn').textContent='Save Entry';
  selectCat('Fitness');
}
function editEntry(id){
  const e=data.entries.find(x=>x.id===id);
  if(!e) return;
  editingEntryId=id;
  navigate('add');
  setTimeout(()=>{
    document.getElementById('entry-title').value=e.title;
    document.getElementById('entry-value').value=e.value;
    document.getElementById('entry-unit').value=e.unit;
    document.getElementById('entry-date').value=e.date;
    document.getElementById('entry-mood').value=e.mood;
    document.getElementById('entry-notes').value=e.notes||'';
    document.getElementById('add-title').textContent='Edit Entry';
    document.getElementById('add-sub').textContent='Update this log entry';
    document.getElementById('edit-badge').style.display='inline-flex';
    document.getElementById('cancel-edit-btn').style.display='inline-flex';
    document.getElementById('save-entry-btn').textContent='Save Changes';
    // sync category pills
    document.querySelectorAll('.cat-pill').forEach(p=>p.className='cat-pill');
    const pill=Array.from(document.querySelectorAll('.cat-pill')).find(p=>p.textContent===e.category);
    if(pill){ pill.classList.add(`sel-${e.category}`); }
    selectedCat=e.category;
    document.getElementById('entry-category').value=e.category;
  },50);
}
function cancelEdit(){ clearEntryForm(); }
function saveEntry(){
  const title=document.getElementById('entry-title').value.trim();
  if(!title){ toast('Title is required','error'); return; }
  const entry={
    id: editingEntryId||Date.now(),
    title,
    category: document.getElementById('entry-category').value,
    value: parseFloat(document.getElementById('entry-value').value)||0,
    unit: document.getElementById('entry-unit').value,
    date: document.getElementById('entry-date').value||todayStr(),
    mood: document.getElementById('entry-mood').value,
    notes: document.getElementById('entry-notes').value.trim(),
  };
  if(editingEntryId){
    const idx=data.entries.findIndex(e=>e.id===editingEntryId);
    if(idx>-1) data.entries[idx]=entry;
    toast('Entry updated','success');
  } else {
    data.entries.unshift(entry);
    toast('Entry saved! 🎉','success');
  }
  saveData(); clearEntryForm(); updateStreak();
  navigate('log');
}

// ══════════════════════════════════════════════════════
//  GOALS
// ══════════════════════════════════════════════════════
function renderGoals(){
  // filter pills
  const cats=['All',...new Set(data.goals.map(g=>g.category))];
  document.getElementById('goal-cat-pills').innerHTML=cats.map(c=>`<button class="filter-pill${activeGoalFilter===c?' active':''}" onclick="setGoalFilter('${c}')">${c}</button>`).join('');

  // filter
  let goals=data.goals;
  if(activeGoalFilter!=='All') goals=goals.filter(g=>g.category===activeGoalFilter);

  const grid=document.getElementById('goals-grid');
  const cardsHTML=goals.map(goalCardHTML).join('');
  const addCard=`<div class="add-goal-card" onclick="openGoalModal()"><div class="add-goal-icon">+</div><div class="add-goal-label">Add new goal</div></div>`;
  grid.innerHTML=cardsHTML+addCard;
}
function setGoalFilter(cat){ activeGoalFilter=cat; renderGoals(); }
function goalCardHTML(g){
  const pct=Math.min(100,Math.round(g.current/g.target*100));
  const c=catColor(g.category);
  const dl=daysLeft(g.deadline);
  const dlStr=dl<0?'Overdue':`${dl}d left`;
  const dlClass=dl<=3?'overdue':'';
  const complete=pct>=100;
  return `<div class="goal-card">
    <div class="goal-actions">
      <div class="icon-btn" title="Edit" onclick="editGoal(${g.id})">✏️</div>
      <div class="icon-btn" title="Update progress" onclick="openProgModal(${g.id})">📊</div>
      <div class="icon-btn" title="Delete" onclick="deleteGoal(${g.id},'${g.name.replace(/'/g,"\\'")}')">🗑</div>
    </div>
    <div class="goal-name">${g.name}</div>
    <div class="goal-cat-label" style="color:${c}">${g.category}</div>
    <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%;background:${c}"></div></div>
    <div class="progress-pct" style="color:${c}">${pct}%</div>
    <div class="goal-vals">${g.current} / ${g.target} ${g.unit}</div>
    <div class="goal-deadline ${dlClass}">${dlStr}</div>
    ${complete?'<div class="goal-complete-label">✅ Complete</div>':''}
  </div>`;
}
function openGoalModal(id=null){
  document.getElementById('goal-modal-title').textContent=id?'Edit Goal':'Set a New Goal';
  document.getElementById('goal-edit-id').value=id||'';
  if(id){
    const g=data.goals.find(x=>x.id===id);
    document.getElementById('goal-name').value=g.name;
    document.getElementById('goal-cat').value=g.category;
    document.getElementById('goal-target').value=g.target;
    document.getElementById('goal-current').value=g.current;
    document.getElementById('goal-unit').value=g.unit;
    document.getElementById('goal-deadline').value=g.deadline;
  } else {
    document.getElementById('goal-name').value='';
    document.getElementById('goal-cat').value='Fitness';
    document.getElementById('goal-target').value='';
    document.getElementById('goal-current').value='0';
    document.getElementById('goal-unit').value='';
    document.getElementById('goal-deadline').value='';
  }
  document.getElementById('goal-modal').classList.add('open');
}
function editGoal(id){ openGoalModal(id); }
function closeGoalModal(){ document.getElementById('goal-modal').classList.remove('open'); }
function closeGoalIfOutside(e){ if(e.target===document.getElementById('goal-modal')) closeGoalModal(); }
function saveGoal(){
  const name=document.getElementById('goal-name').value.trim();
  if(!name){ toast('Goal name required','error'); return; }
  const editId=document.getElementById('goal-edit-id').value;
  const goal={
    id: editId?Number(editId):Date.now(),
    name,
    category: document.getElementById('goal-cat').value,
    target: parseFloat(document.getElementById('goal-target').value)||100,
    current: parseFloat(document.getElementById('goal-current').value)||0,
    unit: document.getElementById('goal-unit').value,
    deadline: document.getElementById('goal-deadline').value,
  };
  if(editId){
    const idx=data.goals.findIndex(g=>g.id===Number(editId));
    if(idx>-1) data.goals[idx]=goal;
    toast('Goal updated','success');
  } else {
    data.goals.push(goal);
    toast('Goal created!','success');
  }
  saveData(); closeGoalModal(); renderGoals();
}
function deleteGoal(id,name){
  openConfirm('Delete Goal',`Delete goal <strong>${name}</strong>? This cannot be undone.`,'Delete',()=>{
    data.goals=data.goals.filter(g=>g.id!==id);
    saveData(); toast('Goal deleted','info'); renderGoals();
  });
}

// PROGRESS UPDATE
function openProgModal(id){
  const g=data.goals.find(x=>x.id===id);
  if(!g) return;
  updateGoalId=id;
  document.getElementById('update-goal-id').value=id;
  document.getElementById('prog-modal-sub').innerHTML=`<strong>${g.name}</strong><br>Current: ${g.current} / ${g.target} ${g.unit}`;
  document.getElementById('prog-value').value=g.current;
  previewUpdate();
  document.getElementById('prog-modal').classList.add('open');
}
function closeProgModal(){ document.getElementById('prog-modal').classList.remove('open'); updateGoalId=null; }
function closeProgIfOutside(e){ if(e.target===document.getElementById('prog-modal')) closeProgModal(); }
function previewUpdate(){
  const id=updateGoalId || Number(document.getElementById('update-goal-id').value);
  const g=data.goals.find(x=>x.id===id);
  if(!g) return;
  const val=parseFloat(document.getElementById('prog-value').value)||0;
  const pct=Math.min(100,Math.round(val/g.target*100));
  document.getElementById('prog-preview-fill').style.width=pct+'%';
  document.getElementById('prog-preview-label').textContent=pct+'%';
}
function applyProgress(){
  const id=updateGoalId || Number(document.getElementById('update-goal-id').value);
  const val=parseFloat(document.getElementById('prog-value').value)||0;
  const idx=data.goals.findIndex(g=>g.id===id);
  if(idx<0) return;
  data.goals[idx].current=val;
  const pct=Math.min(100,Math.round(val/data.goals[idx].target*100));
  saveData();
  closeProgModal();
  renderGoals();
  if(pct>=100) toast('🎉 Goal complete!','success');
  else toast('Progress updated!','success');
}

// ══════════════════════════════════════════════════════
//  ANALYTICS
// ══════════════════════════════════════════════════════
function renderAnalytics(){
  const streak=calcStreak();
  const entries=data.entries;
  // best day
  const dayCounts={};
  entries.forEach(e=>{ const d=new Date(e.date+'T00:00:00').toLocaleDateString('en-US',{weekday:'short'}); dayCounts[d]=(dayCounts[d]||0)+1; });
  const bestDay=Object.keys(dayCounts).sort((a,b)=>dayCounts[b]-dayCounts[a])[0]||'—';
  // avg per week
  const weeksCount=8;
  const weeklyData=getWeeklyData(weeksCount);
  const avg=weeklyData.length?Math.round(weeklyData.reduce((a,b)=>a+b.count,0)/weeklyData.length):0;
  // top cat
  const catCounts={};
  entries.forEach(e=>catCounts[e.category]=(catCounts[e.category]||0)+1);
  const topCat=Object.keys(catCounts).sort((a,b)=>catCounts[b]-catCounts[a])[0]||'—';
  document.getElementById('analytics-stats').innerHTML=`
    ${statCard('Best Day',bestDay,'most active')}
    ${statCard('Avg / Week',avg,'entries')}
    ${statCard('Top Category',topCat,'most logged')}
    ${statCard('Streak',streak,'days')}
  `;
  renderWeeklyChart(weeklyData);
  renderCatBreakdown(catCounts);
  renderHeatmap();
  renderInsights(streak,topCat,bestDay,catCounts);
}
function getWeeklyData(n){
  const weeks=[];
  const now=new Date(); now.setHours(0,0,0,0);
  for(let i=n-1;i>=0;i--){
    const end=new Date(now); end.setDate(now.getDate()-i*7);
    const start=new Date(end); start.setDate(end.getDate()-6);
    const count=data.entries.filter(e=>{
      const d=new Date(e.date+'T00:00:00');
      return d>=start && d<=end;
    }).length;
    const label=end.toLocaleDateString('en-GB',{month:'short',day:'numeric'});
    weeks.push({label,count,isCurrent:i===0});
  }
  return weeks;
}
function renderWeeklyChart(weeks){
  const ctx=document.getElementById('weekly-chart');
  if(weeklyChartInst){ weeklyChartInst.destroy(); weeklyChartInst=null; }
  weeklyChartInst=new Chart(ctx,{
    type:'bar',
    data:{
      labels:weeks.map(w=>w.label),
      datasets:[{
        data:weeks.map(w=>w.count),
        backgroundColor:weeks.map(w=>w.isCurrent?'#c8f050':'rgba(200,240,80,0.25)'),
        borderRadius:4, borderSkipped:false,
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.raw} entries`}}},
      scales:{
        x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#5a5a6a',font:{family:'DM Mono',size:10}}},
        y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#5a5a6a',font:{family:'DM Mono',size:10},stepSize:1}}
      }
    }
  });
}
function renderCatBreakdown(catCounts){
  const total=Object.values(catCounts).reduce((a,b)=>a+b,0)||1;
  const el=document.getElementById('cat-breakdown');
  el.innerHTML=CATS.filter(c=>catCounts[c]).map(c=>`
    <div class="cat-bar-row">
      <div class="cat-bar-name">${c}</div>
      <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${Math.round(catCounts[c]/total*100)}%;background:${catColor(c)}"></div></div>
      <div class="cat-bar-count">${catCounts[c]}</div>
    </div>`).join('');
}
function renderHeatmap(){
  const days=182;
  const now=new Date(); now.setHours(0,0,0,0);
  const dateCounts={};
  data.entries.forEach(e=>dateCounts[e.date]=(dateCounts[e.date]||0)+1);
  let html='';
  for(let i=days-1;i>=0;i--){
    const d=new Date(now); d.setDate(now.getDate()-i);
    const ds=d.toISOString().slice(0,10);
    const cnt=dateCounts[ds]||0;
    let opacity=0;
    if(cnt===1) opacity=0.2;
    else if(cnt===2) opacity=0.45;
    else if(cnt<=4) opacity=0.7;
    else if(cnt>=5) opacity=1;
    const bg=cnt>0?`rgba(200,240,80,${opacity})`:'var(--surface2)';
    const label=`${d.toLocaleDateString('en-GB',{month:'short',day:'numeric'})}: ${cnt} entr${cnt===1?'y':'ies'}`;
    html+=`<div class="heat-cell" style="background:${bg}" title="${label}"></div>`;
  }
  document.getElementById('heatmap').innerHTML=html;
}
function renderInsights(streak,topCat,bestDay,catCounts){
  const el=document.getElementById('insights-panel');
  const ins=[];
  if(!data.entries.length){ el.innerHTML=`<div class="insight-item"><span class="insight-icon">✨</span><div class="insight-text">Start logging your activities to see insights here!</div></div>`; return; }
  if(streak>=7) ins.push({icon:'🔥',text:`You're on a <strong>${streak}-day streak</strong>! Keep the momentum going.`});
  if(topCat) ins.push({icon:'🏆',text:`Your most logged category is <strong>${topCat}</strong> with <strong>${catCounts[topCat]}</strong> entries.`});
  if(bestDay) ins.push({icon:'📅',text:`<strong>${bestDay}</strong> is your most active day of the week.`});
  const nearGoal=data.goals.filter(g=>{ const p=g.current/g.target*100; return p>=80&&p<100; }).sort((a,b)=>b.current/b.target-a.current/a.target)[0];
  if(nearGoal){ const p=Math.round(nearGoal.current/nearGoal.target*100); ins.push({icon:'🎯',text:`You're <strong>${p}% done</strong> with "<strong>${nearGoal.name}</strong>" — almost there!`}); }
  el.innerHTML=ins.map(i=>`<div class="insight-item"><span class="insight-icon">${i.icon}</span><div class="insight-text">${i.text}</div></div>`).join('');
}

// ══════════════════════════════════════════════════════
//  DELETE ENTRY
// ══════════════════════════════════════════════════════
function deleteEntry(id,title){
  openConfirm('Delete Entry',`Delete entry <strong>${title}</strong>? This cannot be undone.`,'Delete',()=>{
    data.entries=data.entries.filter(e=>e.id!==id);
    saveData(); toast('Entry deleted','info'); renderLog(); updateStreak();
  });
}

// ══════════════════════════════════════════════════════
//  CONFIRM MODAL
// ══════════════════════════════════════════════════════
function openConfirm(title,msg,okLabel,cb){
  document.getElementById('confirm-title').textContent=title;
  document.getElementById('confirm-msg').innerHTML=msg;
  document.getElementById('confirm-ok').textContent=okLabel;
  confirmCallback=cb;
  document.getElementById('confirm-modal').classList.add('open');
}
function closeConfirm(){ document.getElementById('confirm-modal').classList.remove('open'); confirmCallback=null; }
function closeConfirmIfOutside(e){ if(e.target===document.getElementById('confirm-modal')) closeConfirm(); }
document.getElementById('confirm-ok').addEventListener('click',()=>{ if(confirmCallback){ confirmCallback(); closeConfirm(); } });

// ══════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════
initEntryForm();
renderDashboard();