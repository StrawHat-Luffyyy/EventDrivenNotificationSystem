import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    username: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true },
);

userSchema.methods.generateJWT = function () {
  return jwt.sign(
    {
      userId: this._id,
      email: this.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

const User = mongoose.model("User", userSchema);

export default User;
