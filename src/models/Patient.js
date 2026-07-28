import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    dni: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Patient", patientSchema);