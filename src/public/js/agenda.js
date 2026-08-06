let allAppointments = [];
let weekOffset = 0;
let activeMobileDay = 0;
let searchTimeout = null;
let activeAppointmentForDetail = null;

document.addEventListener("DOMContentLoaded", () => {
  loadAppointments();
});

async function loadAppointments() {
  try {
    const res = await fetch("/api/appointments");
    allAppointments = await res.json();
    renderWeeklyGrid();
  } catch (err) {
    console.error("Error al cargar turnos:", err);
  }
}

function changeWeek(dir) {
  weekOffset += dir;
  renderWeeklyGrid();
}

function selectMobileDay(dayIdx) {
  activeMobileDay = dayIdx;
  
  const tabs = document.querySelectorAll("#mobileDayTabs .nav-link");
  tabs.forEach((tab, idx) => {
    if (idx === dayIdx) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  renderWeeklyGrid();
}

function getMondayOfCurrentWeek(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function renderWeeklyGrid() {
  const gridContainer = document.getElementById("weeklyGrid");
  const weekLabelRange = document.getElementById("weekLabelRange");

  if (!gridContainer) return;

  // Aseguramos que tenga la clase grid-container para que CSS aplique el grid de 6 columnas
  gridContainer.classList.add("grid-container");

  const monday = getMondayOfCurrentWeek(weekOffset);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);

  if (weekLabelRange) {
    weekLabelRange.innerText = 
      `${monday.getDate()}/${monday.getMonth() + 1} al ${saturday.getDate()}/${saturday.getMonth() + 1}`;
  }

  const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const isMobile = window.innerWidth < 768;

  let html = "";

  for (let i = 0; i < 6; i++) {
    const currentDay = new Date(monday);
    currentDay.setDate(monday.getDate() + i);
    const dateStr = formatDateISO(currentDay);

    // Solo ocultamos los días en móvil si no coinciden con la pestaña seleccionada
    const hideClass = (isMobile && i !== activeMobileDay) ? "d-none d-md-block" : "";

    const dayAppointments = allAppointments
      .filter((a) => a.dateTime.startsWith(dateStr))
      .sort((a, b) => a.dateTime.localeCompare(b.dateTime));

    let slotsHtml = "";

    if (dayAppointments.length === 0) {
      slotsHtml = `<div class="text-muted small text-center my-3">Sin horarios</div>`;
    } else {
      dayAppointments.forEach((app) => {
        const timeStr = app.dateTime.split(" ")[1] || "";
        const isBooked = app.status === "booked";
        const btnClass = isBooked ? "slot-booked" : "slot-available";
        const patientName = isBooked && app.patient ? app.patient.fullName : "";

        const appJson = JSON.stringify(app).replace(/"/g, "&quot;");

        slotsHtml += `
          <button 
            type="button" 
            class="btn slot-btn ${btnClass}"
            onclick="handleSlotClick('${app._id}', '${dateStr}', '${timeStr}', '${app.status}', ${appJson})"
          >
            <strong>${timeStr} hs</strong> 
            ${isBooked ? `<br><small>👤 ${patientName}</small>` : " - Libre"}
          </button>
        `;
      });
    }

    html += `
      <div class="day-column ${hideClass}">
        <div class="day-header">
          <div class="fw-bold text-uppercase">${dayNames[i]}</div>
          <small class="text-muted">${currentDay.getDate()}/${currentDay.getMonth() + 1}</small>
        </div>
        ${slotsHtml}
      </div>
    `;
  }

  gridContainer.innerHTML = html;
}

window.addEventListener("resize", () => {
  renderWeeklyGrid();
});

function handleSlotClick(slotId, dateStr, timeStr, status, appointment) {
  if (status === "booked") {
    activeAppointmentForDetail = appointment;
    openDetailModal(appointment, dateStr, timeStr);
  } else {
    openBookingModal(slotId, dateStr, timeStr);
  }
}

function openBookingModal(slotId, dateStr, timeStr) {
  document.getElementById("appointmentId").value = slotId;
  document.getElementById("existingPatientId").value = "";
  document.getElementById("bookingForm").reset();
  
  // Ocultar botón de editar paciente seleccionado
  const btnEditForm = document.getElementById("btnEditSelectedPatient");
  if (btnEditForm) {
    btnEditForm.classList.add("d-none");
  }

  document.getElementById("selectedSlotInfo").innerHTML = 
    `<strong>Fecha:</strong> ${dateStr} | <strong>Hora:</strong> ${timeStr} hs`;

  const modal = new bootstrap.Modal(document.getElementById("bookingModal"));
  modal.show();
}

function openDetailModal(app, dateStr, timeStr) {
  const p = app.patient || {};
  document.getElementById("detailPatientName").textContent = p.fullName || "Sin nombre";
  document.getElementById("detailPatientDni").textContent = p.dni || "Sin DNI";
  document.getElementById("detailPatientPhone").textContent = p.phone || "Sin teléfono";
  document.getElementById("detailSlotTime").textContent = 
    `${dateStr} a las ${timeStr} hs (${app.appointmentType || "consultorio"})`;

  const modal = new bootstrap.Modal(document.getElementById("detailModal"));
  modal.show();
}

// Búsqueda Autocomplete con opción de edición rápida
function onSearchInput(e) {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();
  const resultsDiv = document.getElementById("searchResults");

  if (query.length < 2) {
    resultsDiv.classList.add("d-none");
    return;
  }

  searchTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`);
      const patients = await res.json();

      if (patients.length === 0) {
        resultsDiv.classList.add("d-none");
        if (!document.getElementById("existingPatientId").value) {
          document.getElementById("fullName").value = query;
        }
        return;
      }

      resultsDiv.innerHTML = patients
        .map((p) => {
          const pJson = JSON.stringify(p).replace(/"/g, "&quot;");
          return `
            <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-2">
              <div 
                class="flex-grow-1 cursor-pointer me-2" 
                onclick="selectPatient('${p._id}', '${p.fullName}', '${p.phone}', '${p.dni || ""}')"
                style="cursor: pointer;"
              >
                <strong>${p.fullName}</strong><br>
                <small class="text-muted">DNI: ${p.dni || "S/D"} | Tel: ${p.phone}</small>
              </div>
              <button 
                type="button" 
                class="btn btn-sm btn-outline-secondary" 
                title="Editar datos del paciente"
                onclick="event.stopPropagation(); openEditModalFromSearch(${pJson})"
              >
                ✏️
              </button>
            </div>
          `;
        })
        .join("");

      resultsDiv.classList.remove("d-none");
    } catch (err) {
      console.error("Error buscando pacientes:", err);
    }
  }, 300);
}

// Seleccionar paciente para la reserva
function selectPatient(id, name, phone, dni) {
  document.getElementById("existingPatientId").value = id;
  document.getElementById("fullName").value = name;
  document.getElementById("phone").value = phone;
  document.getElementById("dni").value = dni;
  document.getElementById("searchInput").value = `${name} (${phone})`;
  document.getElementById("searchResults").classList.add("d-none");

  // Mostrar el botón de editar paciente en el formulario de reserva
  const btnEditForm = document.getElementById("btnEditSelectedPatient");
  if (btnEditForm) {
    btnEditForm.classList.remove("d-none");
  }
}

// Abrir modal de edición desde el resultado de búsqueda (sin seleccionar para reservar)
function openEditModalFromSearch(patient) {
  document.getElementById("editPatientId").value = patient._id;
  document.getElementById("editFullName").value = patient.fullName || "";
  document.getElementById("editPhone").value = patient.phone || "";
  document.getElementById("editDni").value = patient.dni || "";

  // Ocultar modal de reserva si estaba abierto
  const bookingModalEl = document.getElementById("bookingModal");
  const bookingInstance = bootstrap.Modal.getInstance(bookingModalEl);
  if (bookingInstance) bookingInstance.hide();

  document.getElementById("searchResults").classList.add("d-none");

  const editModal = new bootstrap.Modal(document.getElementById("editPatientModal"));
  editModal.show();
}

// Abrir modal de edición del paciente que está seleccionado en el formulario
function editSelectedPatientFromForm() {
  const patientId = document.getElementById("existingPatientId").value;
  if (!patientId) return;

  const fullName = document.getElementById("fullName").value;
  const phone = document.getElementById("phone").value;
  const dni = document.getElementById("dni").value;

  openEditModalFromSearch({
    _id: patientId,
    fullName: fullName,
    phone: phone,
    dni: dni
  });
}

async function handleBooking(event) {
  event.preventDefault();

  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerText;
  submitBtn.disabled = true;
  submitBtn.innerText = "Procesando...";

  try {
    const slotId = document.getElementById("appointmentId").value;
    const patientId = document.getElementById("existingPatientId").value;
    const fullName = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const dni = document.getElementById("dni").value.trim();

    const payload = {
      id: slotId,
      appointmentType: document.getElementById("appointmentType").value,
    };

    if (patientId) {
      payload.patientId = patientId;
    } else {
      payload.patientData = { fullName, phone, ...(dni && { dni }) };
    }

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const modalEl = document.getElementById("bookingModal");
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
      
      await loadAppointments();
    } else {
      const data = await res.json();
      alert(`Error: ${data.message || data.error}`);
    }
  } catch (error) {
    alert("Ocurrió un error inesperado al reservar.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = originalText;
  }
}

// Editar Paciente
// Abrir modal de edición poblando el formulario con los datos actuales
function handleEditPatient() {
  if (!activeAppointmentForDetail || !activeAppointmentForDetail.patient) return;

  const p = activeAppointmentForDetail.patient;

  // Cargar valores actuales en el formulario
  document.getElementById("editPatientId").value = p._id;
  document.getElementById("editFullName").value = p.fullName || "";
  document.getElementById("editPhone").value = p.phone || "";
  document.getElementById("editDni").value = p.dni || "";

  // Ocultar modal de detalle y abrir modal de edición
  const detailModalEl = document.getElementById("detailModal");
  const detailInstance = bootstrap.Modal.getInstance(detailModalEl);
  if (detailInstance) detailInstance.hide();

  const editModal = new bootstrap.Modal(document.getElementById("editPatientModal"));
  editModal.show();
}

// Guardar los datos editados (Submit del Formulario)
async function handleSavePatient(event) {
  event.preventDefault();

  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerText;
  submitBtn.disabled = true;
  submitBtn.innerText = "Guardando...";

  const patientId = document.getElementById("editPatientId").value;
  const fullName = document.getElementById("editFullName").value.trim();
  const phone = document.getElementById("editPhone").value.trim();
  const dni = document.getElementById("editDni").value.trim();

  try {
    const res = await fetch(`/api/patients/${patientId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone, dni }),
    });

    if (res.ok) {
      const editModalEl = document.getElementById("editPatientModal");
      const editInstance = bootstrap.Modal.getInstance(editModalEl);
      if (editInstance) editInstance.hide();

      await loadAppointments();
    } else {
      const data = await res.json();
      alert(`Error: ${data.message || "No se pudo actualizar el paciente."}`);
    }
  } catch (err) {
    alert("Error de conexión al guardar los datos del paciente.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = originalText;
  }
}

async function handleCancelAppointment() {
  if (!activeAppointmentForDetail) return;
  
  if (!confirm("¿Seguro que querés cancelar este turno?")) return;

  try {
    const res = await fetch(`/api/appointments/${activeAppointmentForDetail._id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      const modalEl = document.getElementById("detailModal");
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();

      await loadAppointments();
    } else {
      alert("No se pudo cancelar el turno.");
    }
  } catch (err) {
    alert("Error de conexión al cancelar turno.");
  }
}