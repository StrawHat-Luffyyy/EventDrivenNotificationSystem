import User from "./user.model.js";

//Login Controller
export const loginUser = async (req, res) => {
  const { email } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email });
    }
    const token = user.generateJWT();
    // In a real application, you would verify the password here
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
