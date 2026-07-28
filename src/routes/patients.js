import express from "express";
import {Router} from "express";
const patientRoutes = express.Router();
import patientController from "../controllers/patients.js";

patientRoutes.get("/search", patientController.searchPatients);

patientRoutes.post("/", patientController.createPatient);

patientRoutes.get("/", patientController.getPatients);

patientRoutes.get("/:id", patientController.getPatientById);

patientRoutes.put("/:id", patientController.updatePatient);


patientRoutes.delete(
  "/:id",
  patientController.softDeletePatient,
);

export default patientRoutes;