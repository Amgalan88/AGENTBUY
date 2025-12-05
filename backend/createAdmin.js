const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./src/models/userModel");

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB холбогдсон");

  const phone = "Amgalanbai";
  const password = "Amgalan0708";
  
  const exists = await User.findOne({ phone });
  if (exists) {
    console.log("Admin аль хэдийн байна:", exists.phone);
    // Нууц үг шинэчлэх
    exists.passwordHash = await bcrypt.hash(password, 10);
    exists.roles = ["admin", "super_admin"];
    await exists.save();
    console.log("Admin шинэчлэгдлээ. Нууц үг:", password);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await User.create({
      phone,
      passwordHash,
      fullName: "Admin",
      roles: ["admin", "super_admin"],
      secretQuestion: "Ээжийнхээ нэр юу вэ?",
      secretAnswerHash: await bcrypt.hash("admin", 10),
    });
    console.log("Admin үүсгэгдлээ:", admin.phone);
    console.log("Нууц үг:", password);
  }

  await mongoose.disconnect();
  console.log("Дууслаа");
}

createAdmin().catch(console.error);
