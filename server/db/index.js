const mongoose = require("mongoose");
const URL = "mongodb://127.0.0.1:27017/chatDB";
mongoose
  .connect(URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connected Successfully");
  })
  .catch((e) => {
    console.log("Error", e);
  });
