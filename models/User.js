import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
  },

  isPremium: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model("User", UserSchema);