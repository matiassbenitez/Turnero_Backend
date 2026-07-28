let allAppointments = [];
let currentFilter = "all";
let weekOffset = 0;

const cardsContainer = document.getElementById("cardsContainer");
const tableBody = document.getElementById("appointmentsTable");
const weekPaging = document.getElementById("weekPaging");
const weekLabel = document.getElementById("weekLabel");

async function loadAppointments() {
  const res = await fetch("/api/appointments");
  allAppointments = await res.json();
  renderView();
}

function setFilter(filter) {
  currentFilter = filter;
  if (filter === "week") {
    weekOffset = 0;
    weekPaging.classList.remove("d-none");
  } else {
    weekPaging.classList.add("d-none");
  }

  ["all", "today", "week"].forEach((f) => {
    const btn = document.getElementById(`btn-${f}`);
    if (f === filter) {
      btn.classList.replace(
        "btn-outline-primary",
        "btn-primary",
      );
    } else {
      btn.classList.replace(
        "btn-primary",
        "btn-outline-primary",
      );
    }
  });

  renderView();
}

function changeWeek(dir) {
  weekOffset += dir;
  renderView();
}

const toDateStr = (d) => d.toISOString().split("T")[0];

function getFilteredData() {
  const showAvailable =
    document.getElementById("showAvailableCheck").checked;
  const now = new Date();
  let filtered = allAppointments;

  if (!showAvailable) {
    filtered = filtered.filter((a) => a.status === "booked");
  }

  if (currentFilter === "today") {
    const todayStr = toDateStr(now);
    filtered = filtered.filter((a) =>
      a.dateTime.startsWith(todayStr),
    );
  } else if (currentFilter === "week") {
    const currentDay = now.getDay();
    const distToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(
      now.getDate() + distToMon + weekOffset * 7,
    );
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 5);

    const startStr = toDateStr(startOfWeek);
    const endStr = toDateStr(endOfWeek);

    weekLabel.innerText = `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1} al ${endOfWeek.getDate()}/${endOfWeek.getMonth() + 1}`;

    filtered = filtered.filter((a) => {
      const date = a.dateTime.split(" ")[0];
      return date >= startStr && date <= endStr;
    });
  }

  return filtered.sort((a, b) =>
    a.dateTime.localeCompare(b.dateTime),
  );
}

function renderView() {
  const filtered = getFilteredData();
  const options = {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  cardsContainer.innerHTML = filtered
    .map((app) => {
      const dateObj = new Date(
        app.dateTime.replace(" ", "T"),
      );
      const formatted = new Intl.DateTimeFormat(
        "es-AR",
        options,
      ).format(dateObj);
      const p = app.patient || {};
      const isBooked = app.status === "booked";
      const isInactive = app.status === "inactive";

      let badgeClass = "bg-success";
      let badgeText = "Disponible";
      if (isBooked) {
        badgeClass = "bg-danger";
        badgeText = "Ocupado";
      }
      if (isInactive) {
        badgeClass = "bg-secondary";
        badgeText = "Inactivo";
      }

      let actionBtn = `
        <div class="d-flex gap-1">
          <a href="/?dateTime=${encodeURIComponent(app.dateTime)}" 
             class="btn btn-sm btn-primary flex-fill">
            Agendar
          </a>
          <button class="btn btn-sm btn-outline-danger flex-fill" 
                  onclick="cancelAppointment('${app._id}', '${app.status}')">
            Eliminar
          </button>
        </div>
      `;

      if (isBooked) {
        actionBtn = `
          <button class="btn btn-sm btn-outline-danger w-100" 
                  onclick="cancelAppointment('${app._id}', '${app.status}')">
            Cancelar Turno
          </button>
        `;
      }
      if (isInactive) {
        actionBtn = `
          <button class="btn btn-sm btn-outline-success w-100" 
                  onclick="cancelAppointment('${app._id}', '${app.status}')">
            Habilitar Horario
          </button>
        `;
      }

      return `
        <div class="card card-appointment status-${app.status} shadow-sm mb-2">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="fw-bold fs-6">${formatted} hs</span>
              <span class="badge ${badgeClass}">${badgeText}</span>
            </div>
            ${isBooked
          ? `
              <div class="border-top pt-2 mt-2">
                <div class="fw-bold text-dark">${p.fullName || "Sin nombre"}</div>
                <div class="small text-muted mb-1">📞 ${p.phone || "Sin teléfono"}</div>
                <div class="small bg-light p-2 rounded">
                  <strong>Atención:</strong> ${app.appointmentType || "consultorio"}<br>
                  <strong>Recurrente:</strong> ${app.isReturning ? "Sí" : "No (Nuevo)"}
                </div>
              </div>
            `
          : ""
        }
            <div class="mt-2">
              ${actionBtn}
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  tableBody.innerHTML = filtered
    .map((app) => {
      const dateObj = new Date(
        app.dateTime.replace(" ", "T"),
      );
      const formatted = new Intl.DateTimeFormat(
        "es-AR",
        options,
      ).format(dateObj);
      const p = app.patient || {};
      const isBooked = app.status === "booked";
      const isInactive = app.status === "inactive";

      return `
        <tr>
          <td><strong>${formatted} hs</strong></td>
          <td><span class="badge ${isBooked ? "bg-danger" : isInactive ? "bg-secondary" : "bg-success"}">${app.status}</span></td>
          <td>${p.fullName || "-"}</td>
          <td>${p.phone || "-"}</td>
          <td>${isBooked ? `${app.appointmentType} | ${app.isReturning ? "Recurrente" : "Nuevo"}` : "-"}</td>
          <td>
            ${isBooked
          ? `<button class="btn btn-sm btn-outline-danger" onclick="cancelAppointment('${app._id}', '${app.status}')">Cancelar</button>`
          : isInactive
            ? `<button class="btn btn-sm btn-outline-success" onclick="cancelAppointment('${app._id}', '${app.status}')">Habilitar</button>`
            : `<div class="d-flex gap-1">
                       <a href="/?dateTime=${encodeURIComponent(app.dateTime)}" class="btn btn-sm btn-primary">Agendar</a>
                       <button class="btn btn-sm btn-outline-danger" onclick="cancelAppointment('${app._id}', '${app.status}')">Eliminar</button>
                     </div>`
        }
          </td>
        </tr>
      `;
    })
    .join("");
}

async function cancelAppointment(id, currentStatus) {
  let msg = "¿Seguro que querés realizar esta acción?";
  if (!confirm(msg)) return;

  const res = await fetch(`/api/appointments/${id}`, {
    method: "DELETE",
  });

  if (res.ok) loadAppointments();
}

loadAppointments();