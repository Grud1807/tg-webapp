let userId = null;

// Запрос Telegram ID
window.Telegram.WebApp.ready();
Telegram.WebApp.expand();

Telegram.WebApp.onEvent("mainButtonClicked", () => {
  navigateTo("home");
});

window.onload = () => {
  const tgUser = Telegram.WebApp.initDataUnsafe?.user;
  if (tgUser && tgUser.id) {
    userId = tgUser.id;
    document.querySelector("#user-nick").innerText = @${tgUser.username || "пользователь"};
    loadProfile();
    loadTasks();
  }
};

// --- Переходы между страницами ---
function navigateTo(page) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById(page).style.display = "block";
}

// --- Назад на главную ---
document.querySelectorAll(".back").forEach(btn => {
  btn.addEventListener("click", () => navigateTo("home"));
});

// --- Добавление задания ---
document.getElementById("submitTask").onclick = () => {
  const data = {
    subject: document.getElementById("subject").value,
    description: document.getElementById("description").value,
    price: document.getElementById("price").value,
    deadline: document.getElementById("deadline").value
  };
  Telegram.WebApp.sendData(JSON.stringify(data));
  Telegram.WebApp.close();
};

// --- Загрузка заданий ---
async function loadTasks() {
  const response = await fetch("https://api.airtable.com/v0/appTpq4tdeQ27uxQ9/Tasks", {
    headers: {
      Authorization: "Bearer patZ7hX8W8F8apmJm.9adf2ed71f8925dd372af08a5b5af2af4b12ead4abc0036be4ea68c43c47a8c4"
    }
  });

  const data = await response.json();
  const container = document.getElementById("taskList");
  container.innerHTML = "";

  data.records
    .filter(t => t.fields["Статус"] === "Новая")
    .forEach(task => {
      const el = document.createElement("div");
      el.className = "task";
      el.innerHTML = `
        <b>${task.fields["Предмет"]}</b><br>
        💬 ${task.fields["Описание"]}<br>
        💰 ${task.fields["Цена"]}₽ | ⏰ ${task.fields["Дедлайн"]}<br>
        <button onclick="takeTask('${task.id}')">Взять в работу</button>
      `;
      container.appendChild(el);
    });
}

async function takeTask(taskId) {
  await fetch(`https://api.airtable.com/v0/appTpq4tdeQ27uxQ9/Tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      Authorization: "Bearer patZ7hX8W8F8apmJm.9adf2ed71f8925dd372af08a5b5af2af4b12ead4abc0036be4ea68c43c47a8c4",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fields: {
        "Статус": "В работе",
        "ID исполнителя": String(userId)
      }
    })
  });

  alert("✅ Задание взято в работу!");
  loadTasks();
}

// --- Личный кабинет ---
async function loadProfile() {
  const response = await fetch(`https://api.airtable.com/v0/appTpq4tdeQ27uxQ9/Tasks?filterByFormula={ID исполнителя}='${userId}'`, {
    headers: {
      Authorization: "Bearer patZ7hX8W8F8apmJm.9adf2ed71f8925dd372af08a5b5af2af4b12ead4abc0036be4ea68c43c47a8c4"
    }
  });

  const data = await response.json();
  const done = data.records.filter(t => t.fields["Статус"] === "Завершена");
  const reviews = done.map(t => t.fields["Отзыв"]).filter(Boolean);

  document.getElementById("completed-count").innerText = done.length;
  document.getElementById("reviews").innerHTML = reviews.length > 0
    ? reviews.map(r => `<div class="review">💬 ${r}</div>`).join("")
    : "Отзывов пока нет.";
}
