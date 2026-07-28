import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";

const getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const filtro = status ? { status } : {};

    const appointments = await Appointment.find(
      filtro,
    ).populate("patient");

    const response = await Promise.all(
      appointments.map(async (app) => {
        const appObj = app.toObject();

        if (app.patient) {
          const total =
            await Appointment.countDocuments({
              patient: app.patient._id,
              status: "booked",
            });

          appObj.isReturning = total > 1;
        } else {
          appObj.isReturning = false;
        }

        return appObj;
      }),
    );

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

const create = async (req, res) => {
  try {
    const {
      id,
      patientId,
      patientData,
      appointmentType,
    } = req.body;

    let targetPatientId = patientId;

    if (!targetPatientId && patientData) {
      let existingPatient = await Patient.findOne({
        $or: [
          { dni: patientData.dni },
          { email: patientData.email },
        ],
      });

      if (existingPatient) {
        targetPatientId = existingPatient._id;
      } else {
        const newPatient = new Patient(
          patientData,
        );
        const saved = await newPatient.save();
        targetPatientId = saved._id;
      }
    }

    const updated =
      await Appointment.findByIdAndUpdate(
        id,
        {
          patient: targetPatientId,
          appointmentType:
            appointmentType || "consultorio",
          status: "booked",
        },
        { new: true },
      ).populate("patient");

    if (!updated) {
      return res.status(404).json({
        message: "Turno no encontrado",
      });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

const cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment =
      await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        message: "No encontrado",
      });
    }

    if (appointment.status === "available") {
      appointment.status = "inactive";
      await appointment.save();
      return res.status(200).json({
        message: "Horario desactivado",
      });
    }

    if (appointment.status === "inactive") {
      appointment.status = "available";
      await appointment.save();
      return res.status(200).json({
        message: "Horario reactivado",
      });
    }

    appointment.status = "available";
    appointment.patient = undefined;
    appointment.appointmentType = "consultorio";

    await appointment.save();
    res.status(200).json({
      message: "Turno liberado",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

const createBulk = async (req, res) => {
  try {
    const { slots } = req.body;

    const newSlots =
      await Appointment.insertMany(slots, {
        ordered: false,
      });

    res.status(201).json(newSlots);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(201).json({
        message:
          "Agenda actualizada (se omitieron duplicados)",
      });
    }
    res.status(500).json({
      error: error.message,
    });
  }
};

export default {
  getAll,
  create,
  createBulk,
  cancel,
};
