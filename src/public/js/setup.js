
const holidays = [];
const daysOfWeek = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const defaultSchedule = {
  1: [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ],
  2: [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ],
  3: [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ],
  4: [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ],
  5: [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ],
  6: [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ],
};

const container = document.getElementById(
  "weekTemplateContainer",
);
for (let i = 1; i <= 6; i++) {
  const hoursHtml = defaultSchedule[i]
    .map(
      (h) => `
        <div class="form-check">
          <input class="form-check-input hour-check" type="checkbox" value="${h}" data-day="${i}" checked>
          <label class="form-check-label small">${h}</label>
        </div>
      `,
    )
    .join("");

  container.innerHTML += `
        <div class="col">
          <div class="p-2 border rounded bg-light">
            <h6 class="border-bottom pb-1 text-primary">${daysOfWeek[i]}</h6>
            ${hoursHtml}
          </div>
        </div>
      `;
}

function updateDatePreview() {
  const mode =
    document.getElementById(
      "monthSelect",
    ).value;
  const range = getDatesRange(mode);
  document.getElementById(
    "datePreview",
  ).innerText =
    `Se generará desde el ${range.start.toLocaleDateString()} al ${range.end.toLocaleDateString()}`;
}

function getDatesRange(mode) {
  const now = new Date();
  let start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  let end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  );

  if (mode === "next") {
    start = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    );
    end = new Date(
      now.getFullYear(),
      now.getMonth() + 2,
      0,
    );
  }
  return { start, end };
}

function addHoliday() {
  const input =
    document.getElementById(
      "holidayInput",
    );
  if (!input.value) return;
  if (!holidays.includes(input.value)) {
    holidays.push(input.value);
    renderHolidays();
  }
  input.value = "";
}

function renderHolidays() {
  const list =
    document.getElementById(
      "holidayList",
    );
  list.innerHTML = holidays
    .map(
      (h, idx) => `
        <span class="badge bg-danger p-2">
          ${h} <button class="btn-close btn-close-white ms-1" style="font-size:0.5rem" onclick="holidays.splice(${idx},1);renderHolidays()"></button>
        </span>
      `,
    )
    .join("");
}

async function buildAgenda() {
  const mode =
    document.getElementById(
      "monthSelect",
    ).value;
  const { start, end } =
    getDatesRange(mode);

  const activeSchedule = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };
  document
    .querySelectorAll(".hour-check:checked")
    .forEach((el) => {
      const day =
        el.getAttribute("data-day");
      activeSchedule[day].push(el.value);
    });

  const slots = [];
  let current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();

    const year = current.getFullYear();
    const month = String(
      current.getMonth() + 1,
    ).padStart(2, "0");
    const day = String(
      current.getDate(),
    ).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    if (
      dayOfWeek !== 0 &&
      !holidays.includes(dateStr)
    ) {
      const hours =
        activeSchedule[dayOfWeek] || [];

      hours.forEach((hour) => {
        slots.push({
          dateTime: `${dateStr} ${hour}`,
        });
      });
    }
    current.setDate(current.getDate() + 1);
  }

  if (slots.length === 0) {
    return alert(
      "No se generaron turnos. Revisá la configuración.",
    );
  }

  const res = await fetch(
    "/api/appointments/bulk",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ slots }),
    },
  );

  if (res.ok) {
    alert(
      `¡Agenda publicada! Se crearon ${slots.length} turnos.`,
    );
    window.location.href = "/dashboard";
  }
}

updateDatePreview();
