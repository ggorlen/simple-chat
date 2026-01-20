(() => {
  console.log("connecting...");
  const socket = io.connect();
  let username = "guest";
  let loggedIn = false;
  const loginFormElem = document.querySelector("#login-form");
  const loginElem = document.querySelector("#login");
  const messagesElem = document.querySelector("#messages");
  const messageFormElem = document.querySelector("#message-form");
  const usersElem = document.querySelector("#users");
  const usersHeaderElem = document.querySelector("#users-header");
  
  const appendMsg = (elem, msg) => {
    const msgElem = document.createElement("li");
    const timeElem = document.createElement("span");
    const textElem = document.createElement("span");
    msgElem.className = "message";
    textElem.className = "text";
    timeElem.className = "timestamp";
    msgElem.innerText = `<${msg.username}> ${msg.text}`;
    timeElem.innerText = `[${msg.time}]`;
    msgElem.appendChild(textElem);
    msgElem.appendChild(timeElem);
    elem.appendChild(msgElem);
    elem.scrollTop = elem.scrollHeight;
  };
  
  const clearChildren = elem => {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  };
  
  socket.on("connect", attemptNumber => {
    console.log("connected!");
  });
  
  socket.on("reconnect", attemptNumber => {
    console.log("reconnecting...");
    if (loggedIn && username) {
      socket.emit("set username", username, msg => {
        if (msg && msg.messages) {
          clearChildren(messagesElem);
          msg.messages.forEach(e => appendMsg(messagesElem, e));
        }
      });
    }
  });
  
  socket.on("users", msg => {
    usersHeaderElem.innerText = `online (${msg.users.length})`;
    clearChildren(usersElem);
    
    msg.users.sort().forEach(e => {
      const userElem = document.createElement("li");
      userElem.innerText = e;
      usersElem.appendChild(userElem);
    });
  });
  
  socket.on("chat message", msg => {
    appendMsg(messagesElem, msg);
  });
  
  messageFormElem.addEventListener("submit", e => {
    e.preventDefault();
  
    if (e.target.elements[0].value) {
      socket.emit("chat message", e.target.elements[0].value);
      e.target.reset();
    }
  });
  
  loginFormElem.addEventListener("submit", e => {
    e.preventDefault();
  
    if (!loggedIn && (username = e.target.elements[0].value)) {
      socket.emit("set username", username, msg => {
        if (msg && msg.messages) {
          msg.messages.forEach(e => appendMsg(messagesElem, e));
          loginElem.style.display = "none";
        }
        
        loggedIn = true;
        e.target.reset();
      });
    }
  });
})();

