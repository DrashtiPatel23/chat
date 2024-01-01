const express = require("express");
const app = express();
const path = require("path");
const bcryptjs = require("bcryptjs");
const cors = require("cors");
var bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const io = require("socket.io")(8083, {
  cors: {
    origin: "http://localhost:3000",
  },
});
const DB = require("./db");
const Users = require("./models/users");
const Conversations = require("./models/conversations");
const Messages = require("./models/MESSAGES.JS");
const multer = require("multer");
// const upload = multer({ dest: "uploads/" });
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // destination is used to specify the path of the directory in which the files have to be stored
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    // It is the filename that is given to the saved file.
    cb(null, file.originalname);
  },
});

// // Configure storage engine instead of dest object.
const upload = multer({ storage: storage });
app.use("/uploads", express.static("uploads"));
// const uploadsPath = path.join(__dirname, "uploads");
// console.log("uploadsPath:", uploadsPath); // Log the uploads path for debugging
// app.use("/uploads", express.static(uploadsPath));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json

app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);

const PORT = 8003;

let users = [];
io.on("connection", (socket) => {
  console.log("socket connected", socket.id);
  socket.on("adduser", (userId) => {
    const isUserExist = users.find((user) => user.userId === userId);
    console.log("isUserExist", isUserExist, "users", users);
    if (!isUserExist) {
      const user = { userId, socketId: socket.id };
      users.push(user);
      io.emit("getusers", users);
    }
  });

  socket.on(
    "sendMessage",
    async ({ senderId, receiverId, message, type, conversationId }) => {
      console.log("data", senderId, receiverId, message, type, conversationId);
      const res = await sendmessage(senderId, receiverId, message, type);
      console.log("res", res.conversationId);
      // console.log("qwe", senderId, receiverId, message, conversationId, users);
      const receiver = users.find((user) => user.userId === receiverId);
      const sender = users.find((user) => user.userId === senderId);
      const user = await Users.findById(senderId);
      // console.log("receiver", receiver);

      if (receiver) {
        console.log("if", res.conversationId);
        io.to(receiver.socketId)
          .to(sender.socketId)
          .emit("getMessage", {
            senderId,
            message: res.message,
            type: res.type,
            conversationId: res.conversationId,
            receiverId,
            user: { id: user._id, name: user.name, email: user.email },
          });
      } else {
        console.log(
          "sender.socketId",
          sender.socketId,
          "senderId",
          senderId,
          "message",
          message,
          "conversationId",
          conversationId,
          "receiverId",
          receiverId,
          "user",
          user._id,
          user.name,
          user.email
        );
        io.to(sender.socketId).emit("getMessage", {
          senderId,
          message: res.message,
          type: res.type,
          conversationId: res.conversationId,
          receiverId,
          user: { id: user._id, name: user.name, email: user.email },
        });
      }
    }
  );

  // socket.on(
  //   "sendMessage",
  //   async ({ senderId, receiverId, message, conversationId }) => {
  //     console.log("qwe", senderId, receiverId, message, conversationId, users);
  //     const receiver = users.find((user) => user.userId === receiverId);
  //     const sender = users.find((user) => user.userId === senderId);
  //     const user = await Users.findById(senderId);
  //     console.log("receiver", receiver);

  //     if (receiver) {
  //       console.log("if");
  //       io.to(receiver.socketId)
  //         .to(sender.socketId)
  //         .emit("getMessage", {
  //           senderId,
  //           message,
  //           conversationId,
  //           receiverId,
  //           user: { id: user._id, name: user.name, email: user.email },
  //         });
  //     } else {
  //       console.log(
  //         "sender.socketId",
  //         sender.socketId,
  //         "senderId",
  //         senderId,
  //         "message",
  //         message,
  //         "conversationId",
  //         conversationId,
  //         "receiverId",
  //         receiverId,
  //         "user",
  //         user._id,
  //         user.name,
  //         user.email
  //       );
  //       io.to(sender.socketId).emit("getMessage", {
  //         senderId,
  //         message,
  //         conversationId,
  //         receiverId,
  //         user: { id: user._id, name: user.name, email: user.email },
  //       });
  //     }
  //   }
  // );

  socket.on("disconnect", () => {
    console.log("disconnect");
    users = users.filter((user) => user.socketId !== socket.id);
    // users = users.filter((user) => user.socketId === socket.id);
    io.emit("getusers", users);
  });
});

app.get("/", (req, res) => {
  res.send("Welcome");
});

app.post("/api/register", async (req, res, next) => {
  try {
    console.log("req", req.body);
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).send("Please fill all fields");
    } else {
      const alreadyExist = await Users.findOne({ email });
      if (alreadyExist) {
        res.status(400).send("User already exist");
      } else {
        const newUser = new Users({ name, email });
        bcryptjs.hash(password, 10, (err, hashPasword) => {
          newUser.set("password", hashPasword);
          newUser.save();
          next();
        });
        return res.status(200).send("User registered successfully");
      }
    }
  } catch (error) {
    console.log("error", error);
  }
});

app.post("/api/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).send("Please fill all fields");
    } else {
      const user = await Users.findOne({ email });

      if (!user) {
        res.status(400).send("User not found");
      } else {
        const validateuser = await bcryptjs.compare(password, user.password);
        if (!validateuser) {
          res.status(400).send("Invalid Password");
        } else {
          const payload = {
            userId: user.id,
            email: user.email,
          };
          const JWT_SECRET_KEY = "ChatApp";
          const options = { expiresIn: "84600" };
          jwt.sign(payload, JWT_SECRET_KEY, options, async (err, token) => {
            await Users.updateOne(
              { _id: user._id },
              {
                $set: { token },
              }
            );
            user.save();
            // next();
            return res.status(200).json({
              user: { id: user._id, email: user.email, name: user.name },
              token: token,
            });
          });
        }
      }
    }
  } catch (error) {
    console.log("error", error);
  }
});

app.post("/api/conversation", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    console.log(senderId, receiverId);
    const newConversation = new Conversations({
      members: [senderId, receiverId],
    });
    await newConversation.save();
    res.status(200).send("Conversation created successfully");
  } catch (error) {
    console.log("error", error);
  }
});

app.get("/api/conversations/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const conversations = await Conversations.find({
      members: { $in: [userId] },
    });
    console.log("conversations", conversations);
    const conversationUserData = Promise.all(
      conversations.map(async (conversation) => {
        const receiverId = conversation.members.find(
          (member) => member != userId
        );
        console.log("receiverId", receiverId);
        const user = await Users.findById(receiverId);
        console.log("user", user);
        const msgcounter = await Messages.find({
          senderId: receiverId,
          status: false,
        }).count();
        console.log(msgcounter);
        return {
          user: { receiverId: user._id, email: user.email, name: user.name },
          conversationId: conversation._id,
          counter: msgcounter,
        };
      })
    );
    res.status(200).json(await conversationUserData);
  } catch (error) {
    console.log("error", error);
  }
});

// app.post("/api/message", upload.single("message"), async (req, res) => {
//   try {
//     console.log("req.file", req.file);
//     const { senderId, message, receiverId = "", type } = req.body;
//     console.log(senderId, typeof message, receiverId, type);
//     if (!senderId || !type || !receiverId) {
//       return res.status(200).send("All fields are required");
//     }
//     if (type === "media") {
//       console.log("swffwf");
//       var messages = req.file.filename;
//     } else {
//       var messages = message;
//     }
//     console.log("messages", messages);
//     const checkConversation = await Conversations.find({
//       members: { $all: [senderId, receiverId] },
//     });
//     console.log(
//       "checkConversation",
//       checkConversation,
//       checkConversation.length
//     );
//     // if (conversationId === "new" && receiverId) {
//     if (checkConversation.length == 0) {
//       const newConversation = new Conversations({
//         members: [senderId, receiverId],
//       });
//       await newConversation.save();
//       const newMessage = new Messages({
//         conversationId: newConversation._id,
//         senderId,
//         message: messages,
//         type,
//       });
//       console.log("newMessage", newMessage);
//       await newMessage.save();
//       return res.status(200).json("Message send successfully");
//     } else {
//       const conversationIds = checkConversation[0]._id;
//       console.log("id", checkConversation[0]._id);
//       console.log("messages123", messages);
//       const newMessage = new Messages({
//         conversationId: conversationIds,
//         senderId,
//         message: messages,
//         type,
//       });
//       console.log("newMessage",newMessage);
//       await newMessage.save();
//       res.status(200).json("Message send successfully");
//     }
//   } catch (error) {
//     console.log("error", error);
//   }
// });

app.get("/api/message/:conversationId", async (req, res) => {
  try {
    const checkMessages = async (conversationId) => {
      console.log(conversationId, "conversationId", req.query.receiverId);
      const filter = { senderId: req.query.receiverId };
      await Messages.updateMany(filter, {
        status: true,
      });
      const messages = await Messages.find({ conversationId });
      const messageUserData = Promise.all(
        messages.map(async (message) => {
          const user = await Users.findById(message.senderId);
          return {
            user: { id: user._id, email: user.email, name: user.name },
            message: message,
          };
        })
      );
      res.status(200).json(await messageUserData);
    };
    const conversationId = req.params.conversationId;
    if (conversationId === "new") {
      const checkConversation = await Conversations.find({
        members: { $all: [req.query.senderId, req.query.receiverId] },
      });
      if (checkConversation.length > 0) {
        checkMessages(checkConversation[0]._id);
      } else {
        return res.status(200).json([]);
      }
    } else {
      checkMessages(conversationId);
    }
  } catch (error) {
    console.log("error", error);
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await Users.find();
    const usersData = Promise.all(
      users.map((user) => {
        return {
          user: { email: user.email, name: user.name },
          userId: user._id,
        };
      })
    );
    res.status(200).json(await usersData);
  } catch (error) {
    console.log("error", error);
  }
});

app.get("/api/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const users = await Users.find({ _id: { $ne: userId } });
    const usersData = Promise.all(
      users.map(async (user) => {
        return {
          user: { email: user.email, name: user.name, receiverId: user._id },
        };
      })
    );
    res.status(200).json(await usersData);
  } catch (error) {
    console.log("Error", error);
  }
});

app.post("/api/uploadfile", upload.single("message"), async (req, res) => {
  try {
    console.log("req.file", req.file);

    res.status(200).json(req.file);
  } catch (error) {
    console.log("error", error);
  }
});

async function sendmessage(senderId, receiverId, message, type) {
  try {
    // const { senderId, message, receiverId = "", type } = req.body;
    console.log(senderId, receiverId, message, type);
    if (!senderId || !type || !receiverId || !message) {
      return res.status(200).send("All fields are required");
    }

    const checkConversation = await Conversations.find({
      members: { $all: [senderId, receiverId] },
    });
    console.log(
      "checkConversation",
      checkConversation,
      checkConversation.length
    );
    // if (conversationId === "new" && receiverId) {
    if (checkConversation.length == 0) {
      const newConversation = new Conversations({
        members: [senderId, receiverId],
      });
      await newConversation.save();
      const newMessage = new Messages({
        conversationId: newConversation._id,
        senderId,
        message,
        type,
      });
      console.log("newMessage", newMessage);
      return await newMessage.save();
      // return res.status(200).json("Message send successfully");
    } else {
      const conversationIds = checkConversation[0]._id;
      console.log("id", checkConversation[0]._id);
      console.log("messages123", message);
      const newMessage = new Messages({
        conversationId: conversationIds,
        senderId,
        message,
        type,
      });
      console.log("newMessage", newMessage);
      return await newMessage.save();
      // res.status(200).json("Message send successfully");
    }
  } catch (error) {
    console.log("error", error);
  }
}

app.listen(PORT, () => {
  console.log(`Listing on port ${PORT}`);
});
