import Patient from "../models/Patient.js";

const createPatient = async (req, res) => {
  try {
    const { dni, email } = req.body;

    const existingPatient = await Patient.findOne({
      $or: [{ dni }, { email }],
    });

    if (existingPatient) {
      return res.status(400).json({
        message:
          "Ya existe un paciente con ese DNI o Email.",
      });
    }

    const newPatient = new Patient(req.body);
    await newPatient.save();

    res.status(201).json(newPatient);
  } catch (error) {
    res.status(500).json({
      message: "Error al crear el paciente",
      error: error.message,
    });
  }
};

const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find({
      isActive: true,
    }).sort({ lastName: 1, firstName: 1 });

    res.json(patients);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener los pacientes",
      error: error.message,
    });
  }
};

const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(
      req.params.id,
    );

    if (!patient || !patient.isActive) {
      return res.status(404).json({
        message: "Paciente no encontrado",
      });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener el paciente",
      error: error.message,
    });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, dni } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({
        error: "Nombre y teléfono son obligatorios."
      });
    }

    const updatedPatient =
      await Patient.findByIdAndUpdate(
        id,
        { fullName, phone, dni },
        { new: true, runValidators: true }
      );

    if (!updatedPatient) {
      return res.status(404).json({
        error: "Paciente no encontrado."
      });
    }

    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    // Convierte vocales simples en patrones que aceptan tildes
    const buildDiacriticPattern = (term) => {
      return term
        .replace(/a/gi, "[a,á,A,Á]")
        .replace(/e/gi, "[e,é,E,É]")
        .replace(/i/gi, "[i,í,I,Í]")
        .replace(/o/gi, "[o,ó,O,Ó]")
        .replace(/u/gi, "[u,ú,U,Ú]");
    };

    const flexiblePattern = buildDiacriticPattern(q);
    const regex = new RegExp(flexiblePattern, "i");

    const patients = await Patient.find({
      isActive: true,
      $or: [
        { fullName: regex },
        { phone: regex },
        { dni: regex },
      ],
    }).limit(5);

    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const softDeletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!patient) {
      return res.status(404).json({
        message: "Paciente no encontrado",
      });
    }

    res.json({
      message: "Paciente desactivado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar el paciente",
      error: error.message,
    });
  }
};

export default {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  searchPatients,
  softDeletePatient,
};