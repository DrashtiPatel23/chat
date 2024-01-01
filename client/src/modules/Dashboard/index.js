import { useState, useEffect, useRef, useCallback } from "react";
import Avtar from "../../assets/avatar.svg";
import Textarea from "../../components/Textarea";
import { io } from "socket.io-client";
import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";
import { useDropzone } from "react-dropzone";
import Button from "../../components/Button";
import moment from "moment";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
const Dashboard = () => {
  const loggedInUser = JSON.parse(localStorage.getItem("user:detail"));
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState([]);
  const messageRef = useRef(null);
  const [receive, setReceive] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // console.log("conversations", conversations);
  console.log("showEmojiPicker", showEmojiPicker);
  console.log("message", message);
  console.log("messages", messages);
  console.log("active", active);
  console.log("loggedInUser?.id", loggedInUser?.id);
  console.log("uploadedFile", uploadedFile);

  const onOpenModal = () => setOpen(true);
  const onCloseModal = () => setOpen(false);

  useEffect(() => {
    setSocket(io("ws://localhost:8083"));
  }, []);

  useEffect(() => {
    console.log("hellohello", socket);
    if (socket != null) {
      console.log("123456");
      socket?.emit("adduser", loggedInUser?.id);
      socket?.on("getusers", (users) => {
        console.log("Active users", users);
      });
      socket?.on("getMessage", (data) => {
        console.log("data123", data);
        console.log("conversationid", messages.conversationId);
        console.log("data.conversationId", data.conversationId);
        console.log(
          "data?.senderId",
          data?.senderId,
          "active",
          active,
          "data?.receiverId",
          data?.receiverId
        );
        setReceive(data);
      });
    }
  }, [socket]);
  useEffect(() => {
    console.log("receive", receive, "loggedInUser", loggedInUser.id);
    if (receive != "") {
      if (receive.senderId == active || receive.senderId == loggedInUser.id) {
        setMessages((prev) => ({
          ...prev,
          messages: [
            ...(prev.messages || []),
            {
              user: receive.user,
              message: {
                message: receive.message,
                createdAt: new Date().toISOString(),
                type: receive.type,
                // createdAt: new Date().toISOString("en-US", {
                //   timeZone: "Asia/Kolkata",
                // }),
              },
            },
          ],
        }));
      }
      setReceive("");
    }
  }, [receive]);
  useEffect(() => {
    messageRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.messages]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const validateFile = (file) => {
    const allowedImageExtensions = [".jpg", ".jpeg", ".png"];
    const allowedVideoExtensions = [".mp4", ".avi", ".mkv"];
    const allowedDocumentExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".ppt",
      ".pptx",
    ];
    const allowedCsvExtension = [".csv"];

    if (
      file.type.startsWith("image/") &&
      allowedImageExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      )
    ) {
      return true;
    }

    if (
      file.type.startsWith("video/") &&
      allowedVideoExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      )
    ) {
      return true;
    }

    if (
      allowedDocumentExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      )
    ) {
      return true;
    }

    if (
      allowedCsvExtension.some((ext) => file.name.toLowerCase().endsWith(ext))
    ) {
      return true;
    }

    return false;
  };

  const handleDownload = (imageUrl) => {
    console.log("imageUrl", imageUrl);
    const link = document.createElement("a");
    link.href = imageUrl;
    link.target = "_blank"; // Open the link in a new tab
    link.download = "downloaded_image.jpg"; // Specify the desired file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // const a = document.createElement("a");

    // a.setAttribute("download", imageUrl);
    // a.setAttribute("href", imageUrl);
    // a.click();
    // fetch(imageUrl)
    //   .then((response) => {
    //     if (!response.ok) {
    //       throw new Error("Network response was not ok");
    //     }
    //     return response.blob();
    //   })
    //   .then((blob) => {
    //     const url = URL.createObjectURL(blob);
    //     const a = document.createElement("a");
    //     a.href = url;
    //     a.download = imageUrl;
    //     a.click();
    //   })
    //   .catch((error) => {
    //     console.error("Error downloading image:", error);
    //   });
  };

  const renderContent = (message) => {
    console.log("message", message);
    const isImage = /\.(jpg|jpeg|png)$/i.test(message);
    const isPDF = /\.pdf$/i.test(message);
    const isDocx = /\.(doc|docx|ppt|pptx|xls|xlsx)$/i.test(message);
    const isVideo = /\.(mp4|webm|ogg)$/i.test(message);
    if (isImage) {
      return (
        <>
          {/* <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <div style={{ position: "relative", marginRight: "10px" }}>
              <img
                src={`http://localhost:8003/uploads/${message}`}
                alt="Message"
                style={{
                  height: "250px",
                  width: "250px",
                  borderRadius: "8px",
                  objectFit: "cover",
                }}
              />
              <a
                href={`http://localhost:8003/uploads/${message}`}
                download
                style={{
                  position: "absolute",
                  bottom: "8px",
                  right: "8px",
                  background: "rgba(255, 255, 255, 0.8)",
                  padding: "5px",
                  borderRadius: "4px",
                  textDecoration: "none",
                  color: "#333",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: "5px" }}
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Download
              </a>
            </div>
          </div> */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={`http://localhost:8003/uploads/${message}`}
              style={{
                height: "200px",
                width: "200px",
                marginRight: "5px",
                objectFit: "cover",
              }}
            />
            <a
              href={`http://localhost:8003/uploads/${message}`}
              download
              target="_blank"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ cursor: "pointer" }}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              {/* <div
              // className="ml-4 p-2 cursor-pointer bg-light rounded-full"
              onClick={() =>
                handleDownload(`http://localhost:8003/uploads/${message}`)
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ cursor: "pointer" }}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
            </div> */}
            </a>
          </div>
        </>
      );
    } else if (isPDF) {
      return (
        <iframe
          src={`http://localhost:8003/uploads/${message}`}
          title={`PDF Viewer`}
          width="240"
          height="300"
        ></iframe>
      );
    } else if (isDocx) {
      return (
        <a
          href={`http://localhost:8003/uploads/${message}`}
          className="docx-link"
          download
          style={{ textDecoration: "underline" }}
        >
          {message}
        </a>
      );
    } else if (isVideo) {
      return (
        <video controls>
          <source
            src={`http://localhost:8003/uploads/${message}`}
            type="video/mp4"
          />
          {message}
        </video>
      );
    }
    // return (
    //   <div style={{ display: "flex", justifyContent: "space-between" }}>
    //     <img src={`http://localhost:8003/uploads/${message}`} />
    //     <a href={`http://localhost:8003/uploads/${message}`} download>
    //       <svg
    //         xmlns="http://www.w3.org/2000/svg"
    //         viewBox="0 0 24 24"
    //         width="24"
    //         height="24"
    //         fill="none"
    //         stroke="currentColor"
    //         strokeWidth="2"
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         style={{ cursor: "pointer" }}
    //       >
    //         <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    //       </svg>
    //     </a>
    //   </div>
    // );
  };

  const fetchConversations = async () => {
    const res = await fetch(
      `http://localhost:8003/api/conversations/${loggedInUser?.id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const resData = await res.json();
    setConversations(resData);
  };

  const fetchMessages = async (conversationId, receiver) => {
    const res = await fetch(
      `http://localhost:8003/api/message/${conversationId}?senderId=${loggedInUser?.id}&&receiverId=${receiver?.receiverId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const resData = await res.json();
    // console.log("resData", resData);
    setMessages({ resData, loggedInUser });
    setMessages({ messages: resData, receiver, conversationId });
    setActive(receiver?.receiverId);
  };

  const sendMessage = async (type) => {
    console.log("type", type);
    if (message || uploadedFile.length != 0) {
      if (type == "text") {
        var usermessage = message;
      } else if (type == "media") {
        const formData = new FormData();
        formData.append("message", uploadedFile);

        const res = await axios.post(
          "http://localhost:8003/api/uploadfile",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              accept: "application/json",
            },
          }
        );
        console.log("res.filename", res);
        usermessage = res.data.filename;
      }

      socket?.emit("sendMessage", {
        conversationId: messages?.conversationId,
        senderId: loggedInUser?.id,
        message: usermessage,
        type,
        receiverId: messages?.receiver?.receiverId,
      });
      setOpen(false);
      setUploadedFile([]);
      setMessage("");
      setShowEmojiPicker(false);
      {
        messages?.conversationId == "new" && fetchConversations();
      }
    } else {
      if (type === "media" && uploadedFile.length == 0) {
        console.log("if");
        alert("Please Upload File");
      }
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch(
        `http://localhost:8003/api/users/${loggedInUser?.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const resData = await res.json();
      setUsers(resData);
    };
    fetchUsers();
  }, []);

  const keyDownHandler = (event) => {
    if (!event.shiftKey && event.key === "Enter") {
      event.preventDefault();
      // 👇️ your logic here
      sendMessage("text");
    }
  };

  const logout = () => {
    localStorage.removeItem("user:token");
    localStorage.removeItem("user:detail");
    window.location.reload();
  };

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "30px",
    width: "500px",
  };

  const dropzoneStyle = {
    width: "100%",
    height: "100px",
    border: "2px dashed #ccc",
    borderRadius: "4px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    marginBottom: "16px",
  };

  const ulstyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const onDrop = useCallback((acceptedFiles) => {
    console.log("acceptedFiles[0]", acceptedFiles[0]);
    if (acceptedFiles.length == 1) {
      console.log(acceptedFiles[0]);
      const file = validateFile(acceptedFiles[0]);
      if (
        file
        // acceptedFiles[0].type.startsWith("image/") &&
        // (acceptedFiles[0].name.endsWith(".jpg") ||
        //   acceptedFiles[0].name.endsWith(".jpeg") ||
        //   acceptedFiles[0].name.endsWith(".png"))
      ) {
        console.log("elseif");
        setUploadedFile(acceptedFiles[0]);
      } else {
        alert("Upload png file");
      }
    } else {
      alert("Upload one file");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: [
      "image/*",
      // "video/*",
      // ".pdf",
      // ".doc",
      // ".docx",
      // ".ppt",
      // ".pptx",
      // ".csv",
    ],
    maxFiles: 1,
  });

  const handleEmojiClick = (emoji) => {
    console.log("emoji", emoji);
    setMessage((prevMessage) => prevMessage + emoji?.emoji);
  };

  const emojiPickerStyles = {
    position: "absolute",
    bottom: "60px", // Adjust the positioning based on your layout
    margin: " 7px 526px",
    zIndex: "999",
    border: "1px solid #ccc",
    background: "#fff",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  };
  let gumStream = null;
  let recorder = null;
  let audioContext = null;

  const startRecording = () => {
    let constraints = {
      audio: true,
      video: false,
    };

    audioContext = new window.AudioContext();
    console.log("sample rate: " + audioContext.sampleRate);

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function (stream) {
        console.log("initializing Recorder.js ...");

        gumStream = stream;

        let input = audioContext.createMediaStreamSource(stream);

        console.log("input", input);

        recorder = new window.Recorder(input, {
          numChannels: 1,
        });

        console.log("recorder", recorder);

        recorder.record();
        console.log("Recording started");
      })
      .catch(function (err) {
        //enable the record button if getUserMedia() fails
      });
    console.log("hello");
  };

  return (
    <div className="flex">
      <div className="w-[25%] border h-screen bg-secondary overflow-scroll">
        <div className="flex items-center m-2 p-2">
          <div className="border border-primary p-[2px] rounded-full">
            <img src={Avtar} width={75} height={75} />
          </div>
          <div className="ml-8">
            <h3 className="text-2xl">{loggedInUser?.name}</h3>
            <p className="text-lg font-light">My Account</p>
          </div>
        </div>
        <hr />
        <div className="mx-2">
          <div className="text-primary text-xl p-2">Messages</div>
          <div>
            {conversations.length > 0 ? (
              conversations.map(({ conversationId, user }) => {
                return (
                  <div
                    className={`border-b border-b-gray-300 p-2 cursor-pointer ${
                      user?.receiverId === active && "active"
                    }`}
                    onClick={() => {
                      fetchMessages(conversationId, user);
                      setMessage("");
                    }}
                  >
                    {/* <div
                      className="cursor-pointer flex items-center"
                      onClick={() => {
                        fetchMessages(conversationId, user);
                        setMessage("");
                      }}
                    > */}
                    {console.log("qwerty", user.receiverId, active)}
                    <div className="flex items-center justify-between">
                      <div className="cursor-pointer flex items-center">
                        <div>
                          <img src={Avtar} width={50} height={50} />
                        </div>
                        <div className="ml-6">
                          <h3 className="text-lg font-semibold">{user.name}</h3>
                          <p className="text-sm font-light">{user.email}</p>
                        </div>
                      </div>
                      <div style={{border:"1px solid #000",borderRadius:"100%",padding:"0px 4px"}}> 
                        <p className="text-sm font-light">10</p>
                      </div>
                    </div>
                    {/* </div> */}
                  </div>
                );
              })
            ) : (
              <div className="text-center text-lg font-semibold mt-24">
                No Conversations
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-[50%] border h-screen bg-white flex flex-col items-center">
        {messages?.receiver?.name ? (
          <>
            <div className="w-[75%] bg-secondary h-[80px] my-8 rounded-full flex items-center px-5">
              <div className="cursor-pointer">
                <img src={Avtar} width={50} height={50} />
              </div>
              <div className="ml-6 mr-auto">
                <h3 className="text-lg">{messages?.receiver?.name}</h3>
                <p className="text-sm font-light text-gray-600">
                  {messages?.receiver?.email}
                </p>
              </div>
            </div>

            <div className="h-[75%] w-full overflow-y-scroll shadow-sm">
              <div className="px-10 py-8">
                {messages?.messages?.length > 0 ? (
                  messages?.messages?.map(({ message, user: { id } = {} }) => {
                    return (
                      <>
                        <div
                          className={`max-w-[40%] rounded-b-xl p-2 mb-4  ${
                            id == loggedInUser?.id
                              ? "bg-primary ml-auto rounded-tl-xl text-white"
                              : "bg-secondary rounded-tr-xl"
                          }`}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <small style={{ alignSelf: "flex-end" }}>
                            {moment(
                              message?.createdAt,
                              "YYYY-MM-DD HH:mm:ss"
                            ).format("DD-MM-YYYY")}
                          </small>
                          <p className="message-text">
                            {message?.type === "text"
                              ? message?.message
                              : renderContent(message?.message)}
                          </p>
                          <small style={{ alignSelf: "flex-end" }}>
                            {moment(
                              message?.createdAt,
                              "YYYY-MM-DD HH:mm:ss"
                            ).format("hh:mm A")}
                          </small>
                        </div>
                        <div ref={messageRef}></div>
                      </>
                    );
                  })
                ) : (
                  <div className="text-center text-lg font-semibold mt-24">
                    No Messages
                  </div>
                )}
              </div>
            </div>

            <div className="p-[10px] w-full flex items-center">
              <Textarea
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={keyDownHandler}
                className="w-[75%]"
                inputClassName="p-4 border-0 shadow-md rounded-full bg-light focus:ring-0 focus:border-0 outline-none"
              />
              {showEmojiPicker && (
                <div style={emojiPickerStyles}>
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
              <div
                className="ml-4 p-2 cursor-pointer bg-light rounded-full"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2s4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </div>
              <div
                className="ml-4 p-2 cursor-pointer bg-light rounded-full"
                onClick={() => startRecording()}
              >
                <svg
                  fill="#000000"
                  height="24"
                  width="24"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  xlink="http://www.w3.org/1999/xlink"
                  enable-background="new 0 0 512 512"
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <g>
                      {" "}
                      <g>
                        {" "}
                        <path d="m439.5,236c0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,70-64,126.9-142.7,126.9-78.7,0-142.7-56.9-142.7-126.9 0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,86.2 71.5,157.4 163.1,166.7v57.5h-23.6c-11.3,0-20.4,9.1-20.4,20.4 0,11.3 9.1,20.4 20.4,20.4h88c11.3,0 20.4-9.1 20.4-20.4 0-11.3-9.1-20.4-20.4-20.4h-23.6v-57.5c91.6-9.3 163.1-80.5 163.1-166.7z"></path>{" "}
                        <path d="m256,323.5c51,0 92.3-41.3 92.3-92.3v-127.9c0-51-41.3-92.3-92.3-92.3s-92.3,41.3-92.3,92.3v127.9c0,51 41.3,92.3 92.3,92.3zm-52.3-220.2c0-28.8 23.5-52.3 52.3-52.3s52.3,23.5 52.3,52.3v127.9c0,28.8-23.5,52.3-52.3,52.3s-52.3-23.5-52.3-52.3v-127.9z"></path>{" "}
                      </g>{" "}
                    </g>{" "}
                  </g>
                </svg>
              </div>
              <div
                className="ml-4 p-2 cursor-pointer bg-light rounded-full"
                onClick={() => sendMessage("text")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-send"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="#2c3e50"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M10 14l11 -11" />
                  <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
                </svg>
              </div>
              <div
                className="ml-4 p-2 cursor-pointer bg-light rounded-full"
                onClick={onOpenModal}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-circle-plus"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="#2c3e50"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
                  <path d="M9 12h6" />
                  <path d="M12 9v6" />
                </svg>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-lg font-semibold mt-24">
            No Conversation
          </div>
        )}
      </div>

      {/* <div className="w-[25%] border h-screen"></div> */}
      <div className="w-[25%] h-screen bg-light mx-2 overflow-scroll">
        <div className="flex justify-center p-4">
          <button
            data-toggle="tooltip"
            title="Log Out"
            onClick={() => {
              logout();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="feather feather-log-out"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
        <hr />
        <div className="text-primary text-lg p-2">People</div>
        <div>
          {users.length > 0 ? (
            users.map(({ userId, user }) => {
              return (
                <div
                  className={`flex items-center border-b border-b-gray-300 p-2 ${
                    user?.receiverId === active && "active"
                  }`}
                >
                  <div
                    className="cursor-pointer flex items-center"
                    onClick={() => {
                      fetchMessages("new", user);
                      setMessage("");
                    }}
                  >
                    <div>
                      <img
                        src={Avtar}
                        className="w-[60px] h-[60px] rounded-full p-[2px] border border-primary"
                      />
                    </div>
                    <div className="ml-6">
                      <h3 className="text-lg font-semibold">{user?.name}</h3>
                      <p className="text-sm font-light">{user?.email}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-lg font-semibold mt-24">
              No Conversations
            </div>
          )}
        </div>
      </div>
      <Modal
        open={open}
        onClose={() => {
          onCloseModal();
          setUploadedFile([]);
        }}
        center
      >
        <div style={containerStyle}>
          <div {...getRootProps()} style={dropzoneStyle}>
            <input {...getInputProps()} />
            {isDragActive ? <p>Upload File</p> : <p>Upload File</p>}
          </div>
          {uploadedFile?.name && (
            <>
              <p>
                <b>Uploaded Files:</b>
              </p>
              <ul style={ulstyle}>
                {uploadedFile?.name}
                {/* {uploadedFile.map((fileName, index) => (
                  <li key={index}>{fileName}</li>
                ))} */}
              </ul>
            </>
          )}
          <Button
            label="Upload"
            onClick={() => {
              sendMessage("media");
            }}
          />
        </div>
      </Modal>
    </div>
  );
};
export default Dashboard;
