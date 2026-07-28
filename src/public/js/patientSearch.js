

/**
 * Realiza la búsqueda de pacientes e invoca un callback con los resultados
 * @param {string} query - Término a buscar (Nombre, DNI o Teléfono)
 * @param {function} callback - Función que recibe el array de pacientes
 */
async function searchPatientsAPI(query, callback) {
  if (!query || query.trim().length < 2) {
    return callback([]);
  }

  try {
    const res = await fetch(
      `/api/patients/search?q=${encodeURIComponent(query.trim())}`
    );
    const patients = await res.json();
    callback(patients);
  } catch (err) {
    console.error("Error buscando pacientes:", err);
    callback([]);
  }
}