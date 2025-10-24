// models/messageModel.js
const createMessage = (name, msg) => {
  return {
    name: name || "Anonymous",
    msg: msg || "",
    createdAt: new Date(),
  };
};

module.exports = { createMessage };
