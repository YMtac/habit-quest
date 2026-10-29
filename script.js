// =====================================================
//  Habit Quest — script.js
//  结构：数据 → 状态 → 工具函数 → 音效 → 计算 → 界面 → 对话框 → 成就 → 事件 → 启动
// =====================================================


// ==================== 1. 数据 ====================

const items = [
  { id: "coffee", name: "☕ Latte",      price: 3.5, kcal: 180, sugar: 15, alcohol: 0 },
  { id: "doner",  name: "🥙 Döner",      price: 7.5, kcal: 650, sugar: 6,  alcohol: 0 },
  { id: "bubble", name: "🧋 Bubble tea", price: 5,   kcal: 350, sugar: 40, alcohol: 0 },
  { id: "beer",   name: "🍺 Beer 0.5L",  price: 1.5, kcal: 210, sugar: 0,  alcohol: 20 },
  { id: "cola",   name: "🥤 Cola 0.5L",  price: 1.8, kcal: 210, sugar: 53, alcohol: 0 },
  { id: "choc",   name: "🍫 Chocolate",  price: 1.5, kcal: 535, sugar: 50, alcohol: 0 },
];

const places = [
  { name: "Nuremberg", km: 80 },
  { name: "Munich",    km: 230 },
  { name: "Berlin",    km: 350 },
  { name: "Paris",     km: 850 },
  { name: "Rome",      km: 1100 },
  { name: "Lisbon",    km: 2600 },
  { name: "Beijing",   km: 8000 },
];

const loot = [
  { emoji: "🍛", name: "Mensa lunches",  price: 4 },
  { emoji: "🍕", name: "Pizza nights",   price: 12 },
  { emoji: "🎮", name: "Game consoles",  price: 300 },
  { emoji: "🏠", name: "Months of rent", price: 650 },
  { emoji: "✈️", name: "Flights home",   price: 1200 },
  { emoji: "💻", name: "Laptops",        price: 1500 },
  { emoji: "🚗", name: "Used cars",      price: 15000 },
  { emoji: "🏝️", name: "Gap year trips", price: 30000 },
];

// 🆕 成就表：每个成就有一个 test 函数，传入当前状态 c，返回 true 就解锁
const achievements = [
  { id: "first",    emoji: "🪙", name: "First Coin",          hint: "Pick your first item",
    test: (c) => true },
  { id: "compound", emoji: "✨", name: "Compound Awakening",  hint: "Interest beats what you saved",
    test: (c) => c.coins.interest > c.coins.principal },
  { id: "tycoon",   emoji: "🥙", name: "Döner Tycoon",        hint: "Save enough for 1,000 Döner",
    test: (c) => c.coins.total >= 1000 * 7.5 },
  { id: "sugar",    emoji: "🧊", name: "Sugar Slayer",        hint: "Skip 10 kg of sugar a year",
    test: (c) => c.hp.sugar >= 10000 },
  { id: "liver",    emoji: "🍺", name: "Liver's Best Friend", hint: "Skip 5 kg of alcohol a year",
    test: (c) => c.hp.alcohol >= 5000 },
  { id: "walker",   emoji: "🚶", name: "Camino Walker",       hint: "Walk it off all the way to Lisbon",
    test: (c) => c.km >= 2600 },
  { id: "patient",  emoji: "⏳", name: "Patient Hero",        hint: "Plan for the full 45 years",
    test: (c) => c.years >= 45 },
  { id: "explorer", emoji: "🗺️", name: "Explorer",            hint: "Try all 6 items",
    test: (c) => c.tried >= items.length },
  { id: "million",  emoji: "💎", name: "Millionaire",         hint: "Grow your chest to €1,000,000",
    test: (c) => c.coins.total >= 1000000 },
];

const SUGAR_CUBE_G = 4;
const WHO_SUGAR_G = 50;
const KCAL_PER_KM = 60;
const VODKA_BOTTLE_G = 221;
const STORAGE_KEY = "habitQuest.v1";   // 🆕 localStorage 里的存档名


// ==================== 2. 状态 ====================

let currentItem = items[0];
let lastCoins = null;
let lastHP = null;
let slots = [];

let audioCtx = null;
let soundOn = true;

let typingTimer = null;
let fullText = "";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// 🆕 成就相关
let unlocked = new Set();     // 已解锁的成就 id。Set 自动去重，不会重复解锁
let triedItems = new Set();   // 试过的道具 id，给 Explorer 成就用
let toastQueue = [];          // 等待显示的弹窗（一次解锁好几个时排队）
let toastBusy = false;        // 当前是否有弹窗正在显示
let resetArmed = false;       // 重置按钮是否已经点了第一下


// ==================== 3. 页面元素 & 工具函数 ====================

const $ = (id) => document.getElementById(id);

const freqInput = $("freq");
const dailyInput = $("daily");
const rateInput = $("rate");
const yearsInput = $("years");

function formatEuro(n, decimals = 0) {
  return "€" + n.toLocaleString("en-IE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatNum(n, decimals = 0) {
  return n.toLocaleString("en-IE", { maximumFractionDigits: decimals });
}

function shortCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}


// ==================== 4. 8-bit 音效 ====================

function playNotes(notes, volume = 0.12) {
  if (!soundOn) return;
  audioCtx = audioCtx || new AudioContext();
  const now = audioCtx.currentTime;

  notes.forEach(([freq, delay, length]) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + length);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + length);
  });
}

const playCoin = () => playNotes([[988, 0, 0.1], [1319, 0.08, 0.3]]);
const playBlip = () => playNotes([[660, 0, 0.06]], 0.06);
const playType = () => playNotes([[880, 0, 0.03]], 0.025);

// 🆕 胜利音乐：C5 → E5 → G5 → C6（do mi sol do）
const playFanfare = () => playNotes([
  [523, 0, 0.12],
  [659, 0.12, 0.12],
  [784, 0.24, 0.12],
  [1047, 0.36, 0.45],
], 0.1);


// ==================== 5. 计算 ====================

function simulate(daily, yearlyRate, years) {
  const monthlyDeposit = daily * 30.44;
  const monthlyRate = Math.pow(1 + yearlyRate / 100, 1 / 12) - 1;
  let balance = 0;
  let paid = 0;

  for (let month = 1; month <= years * 12; month++) {
    balance = balance * (1 + monthlyRate);
    balance = balance + monthlyDeposit;
    paid = paid + monthlyDeposit;
  }
  return { total: balance, principal: paid, interest: balance - paid };
}

function nutrition(item, timesPerWeek) {
  const perYear = timesPerWeek * 52;
  return {
    kcal: item.kcal * perYear,
    sugar: item.sugar * perYear,
    alcohol: item.alcohol * perYear,
    sugarPerDay: (item.sugar * timesPerWeek) / 7,
  };
}

function farthestPlace(km) {
  let reached = null;
  places.forEach((p) => { if (km >= p.km) reached = p; });
  return reached;
}


// ==================== 6. 界面：创建元素 ====================

function createItemButtons() {
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.textContent = `${item.name} ${formatEuro(item.price, 2)}`;
    btn.dataset.id = item.id;
    btn.addEventListener("click", () => {
      currentItem = item;
      playCoin();
      syncFromItem();
      narrate();
    });
    $("items").appendChild(btn);
  });
}

function createInventory() {
  slots = loot.map((thing) => {
    const slot = document.createElement("div");
    slot.className = "slot locked";
    slot.innerHTML = `
      <div class="slot-box">
        <span>${thing.emoji}</span>
        <span class="slot-count">x0</span>
      </div>
      <span class="slot-name">${thing.name}</span>`;
    $("inventory").appendChild(slot);
    return { thing, slot, count: 0 };
  });
}


// ==================== 7. 界面：更新显示 ====================

function updateCoins() {
  const daily = Number(dailyInput.value);
  const rate = Number(rateInput.value);
  const years = Number(yearsInput.value);

  $("dailyValue").textContent = formatEuro(daily, 2);
  $("rateValue").textContent = rate.toFixed(1) + "%";
  $("yearsValue").textContent = years + (years === 1 ? " yr" : " yrs");
  $("yearsTitle").textContent = years;

  const r = simulate(daily, rate, years);
  $("total").textContent = formatEuro(r.total);
  $("principal").textContent = formatEuro(r.principal);
  $("interest").textContent = formatEuro(r.interest);

  lastCoins = r;
  updateInventory(r.total);
}

function updateInventory(total) {
  slots.forEach((s) => {
    const count = Math.floor(total / s.thing.price);
    const wasLocked = s.count === 0;

    s.slot.querySelector(".slot-count").textContent = "x" + shortCount(count);
    s.slot.classList.toggle("locked", count === 0);

    s.slot.classList.remove("unlocked");
    if (wasLocked && count > 0) {
      void s.slot.offsetWidth;
      s.slot.classList.add("unlocked");
    }
    s.count = count;
  });
}

function updateHP() {
  const times = Number(freqInput.value);
  $("freqValue").textContent = times + "x";

  const n = nutrition(currentItem, times);
  lastHP = n;

  $("kcalTotal").textContent = formatNum(n.kcal) + " kcal";

  $("sugarTotal").textContent = formatNum(n.sugar / 1000, 1) + " kg";
  $("sugarCubes").textContent = n.sugar > 0
    ? `= ${formatNum(n.sugar / SUGAR_CUBE_G)} sugar cubes`
    : "No sugar here";

  $("alcoholTotal").textContent = formatNum(n.alcohol) + " g";
  $("alcoholVodka").textContent = n.alcohol > 0
    ? `≈ ${formatNum(n.alcohol / VODKA_BOTTLE_G, 1)} bottles of vodka`
    : "Alcohol-free";

  const km = n.kcal / KCAL_PER_KM;
  $("walkTotal").textContent = formatNum(km) + " km";
  const place = farthestPlace(km);
  $("walkPlace").textContent = place
    ? `Bayreuth → ${place.name} and beyond`
    : "Not even to Nuremberg yet";

  const percent = (n.sugarPerDay / WHO_SUGAR_G) * 100;
  const bar = $("whoBar");
  bar.style.width = Math.min(percent, 100) + "%";
  bar.classList.toggle("over", percent >= 100);
  $("whoText").textContent = `${formatNum(n.sugarPerDay, 1)} / ${WHO_SUGAR_G} g`;
  $("whoNote").textContent =
    percent >= 100 ? "⚠️ Over the WHO daily limit on its own!"
    : percent >= 50 ? "Half your daily sugar budget, gone."
    : percent > 0 ? "Not bad, but it adds up."
    : "Zero sugar. Nice.";
}

function syncFromItem() {
  const times = Number(freqInput.value);
  dailyInput.value = (currentItem.price * times / 7).toFixed(1);

  document.querySelectorAll("#items button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.id === currentItem.id);
  });

  updateCoins();
  updateHP();
}


// ==================== 8. RPG 对话框 ====================

function say(text) {
  clearInterval(typingTimer);
  fullText = text;
  const el = $("dialogText");
  const box = $("dialog");
  box.classList.remove("done");

  if (reduceMotion) {
    el.textContent = text;
    box.classList.add("done");
    return;
  }

  const chars = [...text];
  let i = 0;
  el.textContent = "";

  typingTimer = setInterval(() => {
    el.textContent += chars[i];
    if (i % 3 === 0 && audioCtx) playType();
    i++;
    if (i >= chars.length) {
      clearInterval(typingTimer);
      box.classList.add("done");
    }
  }, 28);
}

function narrate() {
  if (!lastCoins || !lastHP) return;

  const itemName = currentItem.name.replace(/^\S+\s/, "");
  const times = Number(freqInput.value);
  const years = Number(yearsInput.value);

  let text = `Hero! Skip ${itemName} ${times}x a week and your chest holds ${formatEuro(lastCoins.total)} after ${years} years.`;

  if (lastHP.alcohol > 0) {
    text += ` You also dodge ${formatNum(lastHP.alcohol / 1000, 1)} kg of pure alcohol a year. Your liver sends its thanks.`;
  } else if (lastHP.sugar > 0) {
    text += ` That's ${formatNum(lastHP.sugar / SUGAR_CUBE_G)} sugar cubes a year you never have to eat.`;
  } else {
    text += ` Plus ${formatNum(lastHP.kcal)} kcal a year back in your HP bar.`;
  }

  if (lastCoins.interest > lastCoins.principal) {
    text += " The interest goblin did more work than you did!";
  }

  say(text);
  checkAchievements();   // 🆕 每次巫师说话（= 用户做了操作）时，顺便检查成就
}


// ==================== 🆕 9. 成就系统 ====================

// 读档：从 localStorage 读出已解锁的成就
// 用 try/catch 包起来：隐私模式或者存档损坏时，不会让整个页面崩掉
function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    unlocked = new Set(data.unlocked || []);
    triedItems = new Set(data.tried || []);
  } catch (e) {
    unlocked = new Set();
    triedItems = new Set();
  }
}

// 存档：Set 不能直接转 JSON，先用 [...set] 变成数组
function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      unlocked: [...unlocked],
      tried: [...triedItems],
    }));
  } catch (e) {
    // 存不了就算了，不影响游戏
  }
}

// 画奖杯架。newIds 是刚解锁的成就，给它们加弹跳动画
function renderTrophies(newIds = []) {
  $("trophies").innerHTML = achievements.map((a) => {
    const got = unlocked.has(a.id);
    const classes = ["trophy"];
    if (!got) classes.push("locked");
    if (newIds.includes(a.id)) classes.push("just-unlocked");

    return `
      <div class="${classes.join(" ")}">
        <div class="trophy-icon">${got ? a.emoji : "❔"}</div>
        <div class="trophy-name">${got ? a.name : "???"}</div>
        <div class="trophy-desc">${a.hint}</div>
      </div>`;
  }).join("");

  $("trophyCount").textContent = `${unlocked.size} / ${achievements.length}`;
}

// 检查有没有新成就
function checkAchievements() {
  if (!lastCoins || !lastHP) return;

  triedItems.add(currentItem.id);

  // 把所有成就需要的信息打包成一个对象，传给每个 test 函数
  const c = {
    item: currentItem,
    times: Number(freqInput.value),
    years: Number(yearsInput.value),
    coins: lastCoins,
    hp: lastHP,
    km: lastHP.kcal / KCAL_PER_KM,
    tried: triedItems.size,
  };

  // 找出"还没解锁、但现在满足条件"的成就
  const newlyUnlocked = achievements.filter((a) => !unlocked.has(a.id) && a.test(c));

  newlyUnlocked.forEach((a) => {
    unlocked.add(a.id);
    toastQueue.push(a);
  });

  saveProgress();

  if (newlyUnlocked.length > 0) {
    renderTrophies(newlyUnlocked.map((a) => a.id));
    showNextToast();
  }
}

// 弹窗排队：一个显示完，再显示下一个
function showNextToast() {
  if (toastBusy || toastQueue.length === 0) return;
  toastBusy = true;

  const a = toastQueue.shift();   // 取出队列里的第一个
  $("toastIcon").textContent = a.emoji;
  $("toastName").textContent = a.name;
  $("toast").classList.add("show");
  playFanfare();

  // 停留 2.6 秒 → 收回去 → 等动画结束 0.4 秒 → 显示下一个
  setTimeout(() => {
    $("toast").classList.remove("show");
    setTimeout(() => {
      toastBusy = false;
      showNextToast();
    }, 400);
  }, 2600);
}

// 重置：要点两次才生效，防止误点
// （网页里不能用 confirm() 弹窗时，这是一种常见做法）
function handleReset() {
  const btn = $("resetTrophies");

  if (!resetArmed) {
    resetArmed = true;
    btn.textContent = "Sure? Click again";
    btn.classList.add("armed");
    setTimeout(() => {          // 3 秒内没点第二下，就恢复原样
      resetArmed = false;
      btn.textContent = "Reset trophies";
      btn.classList.remove("armed");
    }, 3000);
    return;
  }

  unlocked.clear();
  triedItems.clear();
  saveProgress();
  renderTrophies();
  resetArmed = false;
  btn.textContent = "Reset trophies";
  btn.classList.remove("armed");
  say("Your trophies vanished into the void. Time for a new quest!");
}


// ==================== 10. 事件绑定 ====================

function bindEvents() {
  freqInput.addEventListener("input", syncFromItem);
  freqInput.addEventListener("change", () => { playBlip(); narrate(); });

  [dailyInput, rateInput, yearsInput].forEach((input) => {
    input.addEventListener("input", updateCoins);
    input.addEventListener("change", () => { playBlip(); narrate(); });
  });

  $("soundToggle").addEventListener("click", () => {
    soundOn = !soundOn;
    $("soundToggle").textContent = soundOn ? "🔊" : "🔇";
    if (soundOn) playBlip();
  });

  $("dialog").addEventListener("click", () => {
    clearInterval(typingTimer);
    $("dialogText").textContent = fullText;
    $("dialog").classList.add("done");
  });

  $("resetTrophies").addEventListener("click", handleReset);   // 🆕
}


// ==================== 11. 启动（永远放在最后！） ====================

createItemButtons();
createInventory();
loadProgress();      // 🆕 先读档
renderTrophies();    // 🆕 再画奖杯架
bindEvents();
syncFromItem();
say("Welcome, hero! Pick something you could live without, and I'll show you what it really costs.");