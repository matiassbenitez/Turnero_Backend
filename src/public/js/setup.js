const holidays = [];
const daysOfWeek = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado"
];

// Generador de intervalos de 30 min en formato HH:MM
function generate30MinSlots(startHour, endHour) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    const hh = String(h).padStart(2, "0");
    slots.push(`${hh}:00`);
    slots.push(`${hh}:30`);
  }
  return slots;
}

// Bloques predeterminados: 08:00 a 12:00 hs y 16:00 a 20:00 hs
const morningSlots = generate30MinSlots(8, 12);
const afternoonSlots = generate30MinSlots(16, 20);
const fullDaySlots = [...morningSlots, ...afternoonSlots];

const defaultSchedule = {
  1: fullDaySlots, // Lunes
  2: fullDaySlots, // Martes
  3: fullDaySlots, // Miércoles
  4: fullDaySlots, // Jueves
  5: fullDaySlots, // Viernes
  6: morningSlots  // Sábado (sólo mañana)
};

// Dibujar plantilla de días con sus checkbox
function renderScheduleTemplate() {
  const container = document.getElementById("weekTemplateContainer");
  if (!container) return;

  container.innerHTML = "";

  for (let i = 1; i <= 6; i++) {
    const hoursHtml = (defaultSchedule[i] || [])
      .map(
        (h) => `
          <div class="form-check py-1 border-bottom">
            <input 
              class="form-check-input hour-check" 
              type="checkbox" 
              value="${h}" 
              data-day="${i}" 
              id="chk_${i}_${h.replace(':', '')}" 
              checked
            >
            <label class="form-check-label small" for="chk_${i}_${h.replace(':', '')}">
              ${h} hs
            </label>
          </div>
        `
      )
      .join("");

    container.innerHTML += `
      <div class="col">
        <div class="p-2 border rounded bg-white shadow-sm">
          <div class="d-flex justify-content-between align-items-center border-bottom pb-1 mb-2">
            <h6 class="m-0 fw-bold text-primary">${daysOfWeek[i]}</h6>
            <button 
              type="button" 
              class="btn btn-sm btn-link p-0 text-decoration-none small"
              onclick="toggleDayChecks(${i})"
            >
              T/N
            </button>
          </div>
          <div style="max-height: 280px; overflow-y: auto;" class="px-1">
            ${hoursHtml}
          </div>
        </div>
      </div>
    `;
  }
}

// Invertir / Seleccionar todos los checks de un día
function toggleDayChecks(dayIdx) {
  const checks = document.querySelectorAll(`.hour-check[data-day="${dayIdx}"]`);
  const allChecked = Array.from(checks).every((c) => c.checked);
  checks.forEach((c) => (c.checked = !allChecked));
}

function updateDatePreview() {
  const mode = document.getElementById("monthSelect").value;
  const range = getDatesRange(mode);
  const preview = document.getElementById("datePreview");

  if (preview) {
    preview.innerText = 
      `Se generarán turnos desde el ${range.start.toLocaleDateString('es-AR')} al ${range.end.toLocaleDateString('es-AR')}`;
  }
}

function getDatesRange(mode) {
  const now = new Date();
  let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  if (mode === "next") {
    start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  }
  return { start, end };
}

function addHoliday() {
  const input = document.getElementById("holidayInput");
  if (!input || !input.value) return;

  if (!holidays.includes(input.value)) {
    holidays.push(input.value);
    renderHolidays();
  }
  input.value = "";
}

function renderHolidays() {
  const list = document.getElementById("holidayList");
  if (!list) return;

  list.innerHTML = holidays
    .map(
      (h, idx) => `
        <span class="badge bg-danger p-2 me-1 mb-1">
          ${h} 
          <button 
            type="button" 
            class="btn-close btn-close-white ms-1" 
            style="font-size:0.5rem" 
            onclick="holidays.splice(${idx},1);renderHolidays()"
          ></button>
        </span>
      `
    )
    .join("");
}

async function buildAgenda() {
  const mode = document.getElementById("monthSelect").value;
  const { start, end } = getDatesRange(mode);

  const activeSchedule = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

  document.querySelectorAll(".hour-check:checked").forEach((el) => {
    const day = el.getAttribute("data-day");
    if (activeSchedule[day]) {
      activeSchedule[day].push(el.value);
    }
  });

  const slots = [];
  let current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();

    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // Excluir domingos (0) y feriados
    if (dayOfWeek !== 0 && !holidays.includes(dateStr)) {
      const hours = activeSchedule[dayOfWeek] || [];
      hours.forEach((hour) => {
        slots.push({ dateTime: `${dateStr} ${hour}` });
      });
    }
    current.setDate(current.getDate() + 1);
  }

  if (slots.length === 0) {
    return alert("No se seleccionó ningún horario para generar.");
  }

  try {
    const res = await fetch("/api/appointments/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots })
    });

    if (res.ok) {
      alert(`¡Agenda publicada con éxito! Se crearon ${slots.length} turnos.`);
      window.location.href = "/";
    } else {
      const data = await res.json();
      alert(`Error al generar agenda: ${data.message || data.error}`);
    }
  } catch (err) {
    alert("Error de conexión con el servidor.");
  }
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  renderScheduleTemplate();
  updateDatePreview();
});