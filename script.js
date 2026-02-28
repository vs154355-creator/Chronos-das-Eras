/* ========================= */
/* MUNDO E RELÓGIO */
/* ========================= */

let world = {
  name: "Novo Mundo",
  time: { seconds: 0, minutes: 0, hours: 6 },
  date: { day: 1, month: 0, year: 1 },
  multiplier: 60,
  interval: null
};

let initiativeOrder = [];
let currentTurnIndex = 0;
let currentRound = 1;

const calendar = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

const moonPhases = [
  "Lua Nova","Lua Crescente","Quarto Crescente",
  "Gibosa Crescente","Lua Cheia",
  "Gibosa Minguante","Quarto Minguante","Lua Minguante"
];

let currentWeather = "Ensolarado";

/* ========================= */
/* SAVE/LOAD */
/* ========================= */

function saveData() {
  localStorage.setItem("rpg_data", JSON.stringify({
    world, initiativeOrder, currentTurnIndex, currentRound
  }));
}

function loadData() {
  const saved = localStorage.getItem("rpg_data");
  if (saved) {
    const data = JSON.parse(saved);
    world = data.world;
    initiativeOrder = data.initiativeOrder || [];
    currentTurnIndex = data.currentTurnIndex || 0;
    currentRound = data.currentRound || 1;
  }
}

/* ========================= */
/* RELÓGIO */
/* ========================= */

function updateClock() {
  world.time.seconds += world.multiplier;

  while (world.time.seconds >= 60) {
    world.time.seconds -= 60;
    world.time.minutes++;
  }

  while (world.time.minutes >= 60) {
    world.time.minutes -= 60;
    world.time.hours++;
  }

  while (world.time.hours >= 24) {
    world.time.hours -= 24;
    advanceDay();
  }

  displayTime();
}

function startClock() {
  if (!world.interval)
    world.interval = setInterval(updateClock, 1000);
}

function pauseClock() {
  clearInterval(world.interval);
  world.interval = null;
}

function advanceHour() {
  world.time.hours++;
  if (world.time.hours >= 24) {
    world.time.hours = 0;
    advanceDay();
  }
  displayTime();
}

function advanceDay() {
  world.date.day++;
  if (world.date.day > 30) {
    world.date.day = 1;
    world.date.month++;
  }
  if (world.date.month > 11) {
    world.date.month = 0;
    world.date.year++;
  }
  displayTime();
}

function displayTime() {
  document.getElementById("worldNameDisplay").innerText = world.name;
  document.getElementById("time").innerText =
    `${String(world.time.hours).padStart(2,"0")}:${String(world.time.minutes).padStart(2,"0")}`;

  document.getElementById("date").innerText =
    `Dia ${world.date.day} de ${calendar[world.date.month]} - Ano ${world.date.year}`;

  document.getElementById("period").innerText =
    world.date.month < 3 ? "Primavera" :
    world.date.month < 6 ? "Verão" :
    world.date.month < 9 ? "Outono" : "Inverno";

  document.getElementById("moon").innerText =
    moonPhases[world.date.day % 8];

  document.getElementById("weather").innerText = currentWeather;

  renderCalendar();
  saveData();
}

/* ========================= */
/* CALENDÁRIO */
/* ========================= */

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const title = document.getElementById("calendarMonthTitle");

  grid.innerHTML = "";
  title.innerText = `${calendar[world.date.month]} - Ano ${world.date.year}`;

  for (let i=1;i<=30;i++) {
    const d = document.createElement("div");
    d.classList.add("calendar-day");
    d.innerText = i;
    if (i === world.date.day) d.classList.add("active");
    d.onclick = () => { world.date.day = i; displayTime(); };
    grid.appendChild(d);
  }
}

/* ========================= */
/* INICIATIVA COM BARRAS VISUAIS E INICIATIVA EDITÁVEL */
/* ========================= */

function addInitiative() {
  const name = document.getElementById("initiativeName").value;
  const value = parseInt(document.getElementById("initiativeValue").value);

  if (!name || isNaN(value)) return;

  initiativeOrder.push({ name, value, hp:100, ps:50, san:50 });
  initiativeOrder.sort((a,b)=>b.value-a.value);

  renderInitiative();
}

function updateStat(index, type, value) {
  if (!initiativeOrder[index]) return;
  let newValue = parseInt(value);
  if (isNaN(newValue) || newValue < 0) newValue = 0;
  initiativeOrder[index][type] = newValue;

  // reordena se for iniciativa
  if (type === 'value') {
    initiativeOrder.sort((a,b)=>b.value-a.value);
    currentTurnIndex = 0; // reseta o turno ao mudar ordem
  }

  saveData();
  renderInitiative();
}

function changeStat(index, type, delta) {
  if (!initiativeOrder[index]) return;
  initiativeOrder[index][type] += delta;
  if (initiativeOrder[index][type] < 0) initiativeOrder[index][type] = 0;

  // reordena se for iniciativa
  if (type === 'value') {
    initiativeOrder.sort((a,b)=>b.value-a.value);
    currentTurnIndex = 0;
  }

  saveData();
  renderInitiative();
}

function getBarColor(value, max=100) {
  const pct = value / max;
  if (pct > 0.6) return "green";
  if (pct > 0.3) return "orange";
  return "red";
}

function renderInitiative() {
  const list = document.getElementById("initiativeList");
  list.innerHTML = "";

  initiativeOrder.forEach((item,index) => {
    const div = document.createElement("div");
    div.classList.add("initiative-item");
    if (index === currentTurnIndex) div.classList.add("active-turn");

    div.innerHTML = `
      <div class="initiative-main">
        Nome: <strong>${item.name}</strong> |
        Iniciativa: <input type="number" value="${item.value}" 
          onchange="updateStat(${index}, 'value', this.value)">
        <button onclick="changeStat(${index}, 'value', -1)">-</button>
        <button onclick="changeStat(${index}, 'value', 1)">+</button>
      </div>

      <div class="initiative-stats">
        HP: <div class="bar-container">
          <div class="bar" style="width:${item.hp}%;background:${getBarColor(item.hp)}"></div>
          <input type="number" value="${item.hp}" 
            onchange="updateStat(${index}, 'hp', this.value)">
          <button onclick="changeStat(${index}, 'hp', -5)">-5</button>
          <button onclick="changeStat(${index}, 'hp', 5)">+5</button>
        </div>

        PS: <div class="bar-container">
          <div class="bar" style="width:${item.ps}%;background:${getBarColor(item.ps)}"></div>
          <input type="number" value="${item.ps}" 
            onchange="updateStat(${index}, 'ps', this.value)">
          <button onclick="changeStat(${index}, 'ps', -5)">-5</button>
          <button onclick="changeStat(${index}, 'ps', 5)">+5</button>
        </div>

        SAN: <div class="bar-container">
          <div class="bar" style="width:${item.san}%;background:${getBarColor(item.san)}"></div>
          <input type="number" value="${item.san}" 
            onchange="updateStat(${index}, 'san', this.value)">
          <button onclick="changeStat(${index}, 'san', -5)">-5</button>
          <button onclick="changeStat(${index}, 'san', 5)">+5</button>
        </div>
      </div>
    `;

    list.appendChild(div);
  });

  document.getElementById("roundCounter").innerText =
    `Rodada: ${currentRound}`;

  saveData();
}

function nextTurn() {
  if (initiativeOrder.length === 0) return;

  currentTurnIndex++;
  if (currentTurnIndex >= initiativeOrder.length) {
    currentTurnIndex = 0;
    currentRound++;
  }

  renderInitiative();
}

function resetCombat() {
  currentTurnIndex = 0;
  currentRound = 1;
  renderInitiative();
}

function clearInitiative() {
  initiativeOrder = [];
  renderInitiative();
}

/* ========================= */
/* CONFIGURAÇÕES */
/* ========================= */

function applySettings() {
  world.name = document.getElementById("worldNameInput").value || world.name;
  world.date.day = parseInt(document.getElementById("startDay").value) || world.date.day;
  world.date.month = (parseInt(document.getElementById("startMonth").value)-1) || world.date.month;
  world.date.year = parseInt(document.getElementById("startYear").value) || world.date.year;
  world.multiplier = parseInt(document.getElementById("multiplier").value) || world.multiplier;
  displayTime();
}

function resetWorld() {
  // Limpa o localStorage
  localStorage.removeItem("rpg_data");

  // Reseta variáveis
  world = {
    name: "Novo Mundo",
    time: { seconds: 0, minutes: 0, hours: 6 },
    date: { day: 1, month: 0, year: 1 },
    multiplier: 60,
    interval: null
  };
  initiativeOrder = [];
  currentTurnIndex = 0;
  currentRound = 1;

  // Atualiza interface
  displayTime();
  renderInitiative();
  renderCalendar();

  alert("Mundo resetado com sucesso!");
}

function exportWorld() {
  const dataStr = "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify({world,initiativeOrder}));
  const a = document.createElement("a");
  a.href = dataStr;
  a.download = "mundo_rpg.json";
  a.click();
}

function importWorld(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = e => {
    const data = JSON.parse(e.target.result);
    world = data.world;
    initiativeOrder = data.initiativeOrder;
    displayTime();
    renderInitiative();
  };
  reader.readAsText(file);
}

/* ========================= */
/* UI E ABAS */
/* ========================= */

function showTab(tab, button) {
  document.querySelectorAll(".tab-content").forEach(t => t.style.display="none");
  document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));

  document.getElementById(tab).style.display="block";
  button.classList.add("active");
}

function toggleMasterMode() {
  document.body.classList.toggle("master-mode");
}

/* ========================= */
/* INIT */
/* ========================= */

loadData();
displayTime();
renderInitiative();
