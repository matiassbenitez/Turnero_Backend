
let searchTimeout = null;
let rawAvailableSlots = [];

async function loadAvailableSlots() {
  const select = document.getElementById("appointmentSelect");
  try {
    const res = await fetch(
      "/api/appointments?status=available",
    );
    rawAvailableSlots = await res.json();

    if (rawAvailableSlots.length === 0) {
      select.innerHTML =
        '<option value="">No hay horarios disponibles</option>';
      return;
    }

    const options = {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };

    select.innerHTML =
      '<option value="">Seleccione un horario...</option>' +
      rawAvailableSlots
        .map((s) => {
          const dateObj = new Date(
            s.dateTime.replace(" ", "T"),
          );
          const formattedDate = new Intl.DateTimeFormat(
            "es-AR",
            options,
          ).format(dateObj);

          return `<option value="${s._id}">${formattedDate} hs</option>`;
        })
        .join("");

    autoSelectFromUrl();
  } catch (e) {
    select.innerHTML =
      '<option value="">Error cargando horarios</option>';
  }
}

function autoSelectFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const targetParam = urlParams.get("dateTime");

  if (!targetParam) return;

  const matchedSlot = rawAvailableSlots.find(
    (s) => s.dateTime === targetParam,
  );

  if (matchedSlot) {
    const select = document.getElementById("appointmentSelect");
    select.value = matchedSlot._id;
  }
}

function onSearchInput(e) {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();
  const resultsDiv = document.getElementById(
    "searchResults"
  );

  if (query.length < 2) {
    resultsDiv.classList.add("d-none");
    return;
  }

  searchTimeout = setTimeout(async () => {
    const res = await fetch(
      `/api/patients/search?q=${encodeURIComponent(query)}`
    );
    const patients = await res.json();

    if (patients.length === 0) {
      resultsDiv.classList.add("d-none");
      const existingId = document.getElementById(
        "existingPatientId"
      ).value;
      if (!existingId) {
        document.getElementById("fullName").value =
          query;
      }
      return;
    }

    resultsDiv.innerHTML = patients
      .map(
        (p) => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
              <div 
                style="cursor: pointer;" 
                class="flex-grow-1"
                onclick="selectPatient('${p._id}', '${p.fullName}', '${p.phone}', '${p.dni || ""}')"
              >
                <strong>${p.fullName}</strong> - DNI: ${p.dni || "S/D"} (${p.phone})
              </div>
              <button 
                type="button" 
                class="btn btn-sm btn-outline-primary ms-2"
                onclick="openEditModal('${p._id}', '${p.fullName}', '${p.phone}', '${p.dni || ""}')"
              >
                Editar
              </button>
            </div>
          `
      )
      .join("");

    resultsDiv.classList.remove("d-none");
  }, 300);
}

function selectPatient(id, name, phone, dni) {
  document.getElementById("existingPatientId").value = id;
  document.getElementById("fullName").value = name;
  document.getElementById("phone").value = phone;
  document.getElementById("dni").value = dni;

  document.getElementById("searchInput").value =
    `${name} (${phone})`;

  document
    .getElementById("searchResults")
    .classList.add("d-none");

  const help = document.getElementById("searchHelp");
  help.innerText = "¡Paciente seleccionado con éxito!";
  help.className = "form-text text-success fw-bold";
}

document
  .getElementById("searchInput")
  .addEventListener("input", (e) => {
    const existingId =
      document.getElementById("existingPatientId").value;
    const query = e.target.value.trim();

    if (existingId && !query.includes("(")) {
      document.getElementById("existingPatientId").value = "";
      document.getElementById("fullName").value = query;
      document.getElementById("phone").value = "";
      document.getElementById("dni").value = "";

      const help = document.getElementById("searchHelp");
      help.innerText =
        "Si no estás registrado, completá los datos abajo.";
      help.className = "form-text text-muted";
    }
  });

async function handleBooking(event) {
  event.preventDefault();

  // 1. Obtener referencias y deshabilitar botón
  const submitBtn = event.target.querySelector(
    'button[type="submit"]',
  );
  const originalText = submitBtn.innerText;

  submitBtn.disabled = true;
  submitBtn.innerText = "Procesando...";

  try {
    const slotId = document.getElementById(
      "appointmentSelect",
    ).value;
    const patientId = document.getElementById(
      "existingPatientId",
    ).value;
    const fullName = document
      .getElementById("fullName")
      .value.trim();
    const phone = document
      .getElementById("phone")
      .value.trim();
    const dni = document
      .getElementById("dni")
      .value.trim();

    if (!slotId) {
      alert("Elegí un horario.");
      submitBtn.disabled = false;
      submitBtn.innerText = originalText;
      return;
    }

    const payload = {
      id: slotId,
      appointmentType: document.getElementById(
        "appointmentType",
      ).value,
    };

    if (patientId) {
      payload.patientId = patientId;
    } else {
      payload.patientData = {
        fullName,
        phone,
        ...(dni && { dni }),
      };
    }

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("¡Turno agendado con éxito!");
      window.location.href = "/dashboard";
    } else {
      const data = await res.json();
      alert(
        `Error: ${data.message || data.error}`,
      );
      // Si hay error, reactivamos el botón
      submitBtn.disabled = false;
      submitBtn.innerText = originalText;
    }
  } catch (error) {
    alert("Ocurrió un error inesperado.");
    submitBtn.disabled = false;
    submitBtn.innerText = originalText;
  }
}

let patientModalInstance = null;

function openEditModal(id, fullName, phone, dni) {
  document.getElementById("modalPatientId").value = id;
  document.getElementById("modalFullName").value = fullName;
  document.getElementById("modalPhone").value = phone;
  document.getElementById("modalDni").value = dni;

  // Ocultar la lista desplegable de búsqueda
  document
    .getElementById("searchResults")
    .classList.add("d-none");

  const modalEl = document.getElementById(
    "editPatientModal"
  );
  patientModalInstance = new bootstrap.Modal(modalEl);
  patientModalInstance.show();
}

async function handleUpdatePatient(event) {
  event.preventDefault();

  const submitBtn = document.getElementById(
    "savePatientBtn"
  );
  const originalText = submitBtn.innerText;

  submitBtn.disabled = true;
  submitBtn.innerText = "Guardando...";

  const id = document.getElementById(
    "modalPatientId"
  ).value;
  const fullName = document
    .getElementById("modalFullName")
    .value.trim();
  const phone = document
    .getElementById("modalPhone")
    .value.trim();
  const dni = document
    .getElementById("modalDni")
    .value.trim();

  try {
    const res = await fetch(`/api/patients/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fullName, phone, dni }),
    });

    if (res.ok) {
      alert("¡Paciente actualizado con éxito!");
      patientModalInstance.hide();

      // Seleccionamos automáticamente al paciente editado en el formulario principal
      selectPatient(id, fullName, phone, dni);
    } else {
      const data = await res.json();
      alert(
        `Error: ${data.error || "No se pudo actualizar"}`
      );
    }
  } catch (err) {
    alert("Error de conexión al actualizar paciente.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = originalText;
  }
}


loadAvailableSlots();
