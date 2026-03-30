const main=document.getElementById('main');

let state={
 practices:[
  {id:1,client:'Michelin',status:'Operativa'},
  {id:2,client:'Aprica',status:'In attesa'}
 ]
};

function renderDashboard(){
 main.innerHTML=`
 <h2>Dashboard</h2>
 <div class="card">Pratiche totali: ${state.practices.length}</div>
 `;
}

function renderPractices(){
 main.innerHTML=`
 <h2>Pratiche</h2>
 <input id="filter" placeholder="Cerca cliente">
 <div id="list"></div>
 <button id="add">Aggiungi pratica</button>
 `;
 renderList();

 document.getElementById('filter').oninput=(e)=>{
  renderList(e.target.value);
 };

 document.getElementById('add').onclick=()=>{
  state.practices.push({
   id:Date.now(),
   client:'Nuovo cliente',
   status:'Nuova'
  });
  renderList();
 };
}

function renderList(filter=''){
 const list=document.getElementById('list');
 list.innerHTML=state.practices
  .filter(p=>p.client.toLowerCase().includes(filter.toLowerCase()))
  .map(p=>`<div class="card">${p.client} - ${p.status}</div>`)
  .join('');
}

function render(route){
 if(route==='practices') renderPractices();
 else renderDashboard();
}

document.addEventListener('click',e=>{
 if(e.target.dataset.route){
  render(e.target.dataset.route);
 }
});

render('dashboard');
