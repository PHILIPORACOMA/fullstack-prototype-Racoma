/* Full-Stack Prototype - Frontend Only */
const STORAGE_KEY = 'ipt_demo_v1';
let currentUser = null;
window.db = { accounts: [], departments: [], employees: [], requests: [] };

function loadFromStorage(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw){ seedDefault(); return; }
    window.db = JSON.parse(raw);
    if(!window.db.accounts) seedDefault();
  }catch(e){ seedDefault(); }
}

function seedDefault(){
  window.db = {
    accounts: [
      { firstName:'Admin', lastName:'User', email:'admin@example.com', password:'Password123!', role:'admin', verified:true }
    ],
    departments: [ { id: 'd1', name:'Engineering', description:'' }, { id:'d2', name:'HR', description:'' } ],
    employees: [],
    requests: []
  };
  saveToStorage();
}

function saveToStorage(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db)); }

function setAuthState(isAuth, user){
  currentUser = isAuth ? user : null;
  const body = document.body;
  body.classList.toggle('authenticated', !!isAuth);
  body.classList.toggle('not-authenticated', !isAuth);
  body.classList.toggle('is-admin', !!(isAuth && user.role === 'admin'));
  // update dropdown label
  const userMenu = document.getElementById('userMenu');
  if(userMenu) userMenu.textContent = isAuth ? `${user.firstName} ${user.lastName}` : '';
}

function findAccountByEmail(email){ return window.db.accounts.find(a=>a.email.toLowerCase()===String(email).toLowerCase()); }

function navigateTo(hash){ window.location.hash = hash; }

function handleRouting(){
  const hash = window.location.hash.replace('#','') || '/';
  const route = hash.split('?')[0];
  // hide pages
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));

  const authRequired = ['/profile','/my-requests','/accounts','/employees','/departments'];
  const adminRequired = ['/accounts','/employees','/departments'];

  if(authRequired.includes(route) && !currentUser){ showToast('Please login first','warning'); navigateTo('#/login'); return; }
  if(adminRequired.includes(route) && !(currentUser && currentUser.role==='admin')){ showToast('Admin access required','danger'); navigateTo('#/'); return; }

  const id = route === '/' ? 'home-page' : route.replace('/','') + '-page';
  const el = document.getElementById(id);
  if(el) el.classList.add('active');

  // call page renderers
  if(route==='/profile') renderProfile();
  if(route==='/accounts') renderAccountsList();
  if(route==='/departments') renderDepartmentsList();
  if(route==='/employees') renderEmployeesList();
  if(route==='/my-requests') renderMyRequests();
}

/* ---------- Auth flows ---------- */
function initAuthFromStorage(){
  const token = localStorage.getItem('auth_token');
  if(token){ const acc = findAccountByEmail(token); if(acc) setAuthState(true,acc); }
}

function showToast(message,type='info'){ const containerId='__toast_container';
  let container = document.getElementById(containerId);
  if(!container){ container = document.createElement('div'); container.id=containerId; container.className='toast-container'; document.body.appendChild(container); }
  const div = document.createElement('div'); div.className=`alert alert-${type} alert-dismissible`; div.role='alert';
  div.innerHTML = `${message} <button type="button" class="btn-close" aria-label="Close"></button>`;
  div.querySelector('button').addEventListener('click',()=>div.remove());
  container.appendChild(div);
  setTimeout(()=>div.remove(),4000);
}

/* --------- Registration --------- */
document.addEventListener('submit', function(e){
  if(e.target.id==='registerForm'){ e.preventDefault(); const f = e.target; const firstName=f.firstName.value.trim(); const lastName=f.lastName.value.trim(); const email=f.email.value.trim().toLowerCase(); const password=f.password.value;
    if(password.length<6){ showToast('Password must be at least 6 chars','warning'); return; }
    if(findAccountByEmail(email)){ showToast('Email already exists','danger'); return; }
    const acc = { firstName, lastName, email, password, role:'user', verified:false };
    window.db.accounts.push(acc); saveToStorage(); localStorage.setItem('unverified_email', email); showToast('Registered. Verification sent (simulated).','success'); navigateTo('#/verify-email'); }

  if(e.target.id==='loginForm'){ e.preventDefault(); const f=e.target; const email=f.email.value.trim().toLowerCase(); const password=f.password.value; const acc=findAccountByEmail(email);
    if(!acc || acc.password!==password || !acc.verified){ showToast('Invalid credentials or not verified','danger'); return; }
    localStorage.setItem('auth_token', acc.email); setAuthState(true,acc); showToast('Logged in','success'); navigateTo('#/profile'); }
});

document.getElementById('simulateVerifyBtn')?.addEventListener('click', ()=>{
  const email = localStorage.getItem('unverified_email'); if(!email){ showToast('No pending verification','warning'); return; }
  const acc = findAccountByEmail(email); if(!acc){ showToast('Account not found','danger'); return; }
  acc.verified = true; saveToStorage(); localStorage.removeItem('unverified_email'); showToast('Email verified. You may login.','success'); navigateTo('#/login');
});

document.getElementById('logoutBtn')?.addEventListener('click', (e)=>{ e.preventDefault(); localStorage.removeItem('auth_token'); setAuthState(false); showToast('Logged out','info'); navigateTo('#/'); });

document.getElementById('editProfileBtn')?.addEventListener('click', ()=>{ alert('Edit profile not implemented (placeholder)'); });

/* ---------- Renderers / Admin CRUD ---------- */
function renderProfile(){ const out=document.getElementById('profileInfo'); if(!currentUser){ out.innerHTML=''; return; } out.innerHTML = `<p><strong>Name:</strong> ${currentUser.firstName} ${currentUser.lastName}</p><p><strong>Email:</strong> ${currentUser.email}</p><p><strong>Role:</strong> ${currentUser.role}</p>`; }

function renderAccountsList(){ const el=document.getElementById('accountsList'); if(!el) return; let html=`<table class="table table-sm"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th>Actions</th></tr></thead><tbody>`;
  window.db.accounts.forEach(acc=>{
    html+=`<tr><td>${acc.firstName} ${acc.lastName}</td><td>${acc.email}</td><td>${acc.role}</td><td>${acc.verified? 'Yes':'No'}</td><td>`+
    `<button class="btn btn-sm btn-outline-primary" data-act="edit" data-email="${acc.email}">Edit</button> `+
    `<button class="btn btn-sm btn-outline-secondary" data-act="reset" data-email="${acc.email}">Reset PW</button> `+
    `<button class="btn btn-sm btn-outline-danger" data-act="delete" data-email="${acc.email}">Delete</button>`+
    `</td></tr>`;
  });
  html+='</tbody></table>';
  el.innerHTML = html;

  el.querySelectorAll('button').forEach(b=> b.addEventListener('click',(ev)=>{
    const act = b.getAttribute('data-act'); const email = b.getAttribute('data-email'); const acc = findAccountByEmail(email);
    if(act==='edit'){ const fn=prompt('First name', acc.firstName); const ln=prompt('Last name', acc.lastName); if(fn) acc.firstName=fn; if(ln) acc.lastName=ln; saveToStorage(); renderAccountsList(); showToast('Account updated','success'); }
    if(act==='reset'){ const pw=prompt('New password (min 6)'); if(!pw || pw.length<6){ showToast('Invalid password','warning'); return; } acc.password=pw; saveToStorage(); showToast('Password reset','success'); }
    if(act==='delete'){ if(acc.email === (currentUser && currentUser.email)){ showToast('Cannot delete yourself','danger'); return; } if(confirm('Delete account?')){ window.db.accounts = window.db.accounts.filter(a=>a.email!==email); saveToStorage(); renderAccountsList(); showToast('Deleted','info'); } }
  }));
}

document.getElementById('addAccountBtn')?.addEventListener('click', ()=>{
  const fn = prompt('First name'); if(!fn) return; const ln = prompt('Last name')||''; const email = prompt('Email'); if(!email) return; if(findAccountByEmail(email)){ showToast('Email exists','danger'); return; } const pw = prompt('Password (min 6)')||''; if(pw.length<6){ showToast('Weak password','warning'); return; } const role = prompt('Role (user/admin)','user')||'user'; const verified = confirm('Mark verified?'); window.db.accounts.push({ firstName:fn, lastName:ln, email, password:pw, role, verified }); saveToStorage(); renderAccountsList(); showToast('Account added','success');
});

function renderDepartmentsList(){ const el=document.getElementById('departmentsList'); if(!el) return; let html='<ul class="list-group">'; window.db.departments.forEach(d=> html+=`<li class="list-group-item"><strong>${d.name}</strong> - ${d.description||''}</li>`); html+='</ul>'; el.innerHTML=html; }

function renderEmployeesList(){ const el=document.getElementById('employeesList'); if(!el) return; let html=`<table class="table table-sm"><thead><tr><th>ID</th><th>User</th><th>Position</th><th>Dept</th></tr></thead><tbody>`;
  window.db.employees.forEach(emp=>{ const user = findAccountByEmail(emp.userEmail) || { email:emp.userEmail }; const dept = window.db.departments.find(d=>d.id===emp.deptId); html+=`<tr><td>${emp.id}</td><td>${user.email}</td><td>${emp.position}</td><td>${dept?dept.name:''}</td></tr>`; });
  html+='</tbody></table>'; el.innerHTML = html;
}

document.getElementById('newRequestBtn')?.addEventListener('click', async ()=>{
  if(!currentUser){ showToast('Login first','warning'); navigateTo('#/login'); return; }
  const type = prompt('Request type (Equipment, Leave, Resources)','Equipment'); if(!type) return;
  const items = [];
  while(true){ const name = prompt('Item name (leave blank to finish)'); if(!name) break; const qty = prompt('Quantity','1'); items.push({ name, qty: Number(qty)||1 }); }
  if(items.length===0){ showToast('Add at least one item','warning'); return; }
  const req = { id: 'r'+Date.now(), type, items, status:'Pending', date: new Date().toISOString(), employeeEmail: currentUser.email };
  window.db.requests.push(req); saveToStorage(); showToast('Request submitted','success'); renderMyRequests();
});

function renderMyRequests(){ const el=document.getElementById('myRequestsList'); if(!el) return; const list = window.db.requests.filter(r=> r.employeeEmail === (currentUser && currentUser.email)); if(list.length===0){ el.innerHTML='<p>No requests yet.</p>'; return; }
  let html = `<table class="table table-sm"><thead><tr><th>Date</th><th>Type</th><th>Items</th><th>Status</th></tr></thead><tbody>`;
  list.forEach(r=>{ const items = r.items.map(i=>`${i.name} x${i.qty}`).join('<br>'); const badge = r.status==='Pending' ? 'warning' : (r.status==='Approved' ? 'success' : 'danger'); html+=`<tr><td>${new Date(r.date).toLocaleString()}</td><td>${r.type}</td><td>${items}</td><td><span class="badge bg-${badge}">${r.status}</span></td></tr>`; });
  html += '</tbody></table>'; el.innerHTML = html;
}

/* ---------- Init ---------- */
loadFromStorage(); initAuthFromStorage();
window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', ()=>{ if(!window.location.hash) navigateTo('#/'); handleRouting(); });
