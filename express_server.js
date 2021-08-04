// TODO: use custom log message format with colorizing
// TODO: temporary route for POST testing. Send delete request to /urls , not urls/{url}/delete
const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "123": {
    id: 123,
    email: "test@test.com",
    password: "test"
  }
};

// TODO: use better RNG and generate capital letters
const generateRandomString = () => {
  return Math.random().toString(36).replace(/[^a-z0-9]+/g, '').substr(0, 6);
};

const getIdFromEmail = email => {
  for (const userId in users) {
    if (users[userId].email === email) {
      return userId;
    }
  }

  return undefined;
};

app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));
app.use(morgan("dev"));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello!asdfasdfas");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {user: users[req.cookies.user_id]};
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {user: users[req.cookies.user_id]};
  res.render("login", templateVars);
});

// Create new URL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  console.log(`New URL stored: {${shortURL} : ${urlDatabase[shortURL]}}`);
  
  res.redirect(`urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies.user_id]
  };
  res.render("urls_show", templateVars);
});

// Edit longURL for a given shortURL
app.post("/urls/:shortURL", (req, res) => {
  // TODO: input validation
  urlDatabase[req.params.shortURL] = req.body.longURL;

  console.log(`URL for ${req.params.shortURL} changed to ${req.body.longURL}`);

  res.redirect(303, `/urls/${req.params.shortURL}`);
});

// Delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];

  console.log(`URL for ${req.params.shortURL} was deleted`);
  
  res.redirect(303, "/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (!longURL) {
    // TODO: not DRY
    return res.status(404).render("404");
  }

  res.redirect(longURL);
});

// Login user
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userId = getIdFromEmail(email);
  if (!userId) {
    console.log(`Error: Email ${email} not found`);
    
    return res.sendStatus(403);
  }

  if (users[userId].password !== password) {
    console.log(`Error: Password ${password} not correct`);

    return res.sendStatus(403);
  }

  res.cookie("user_id", userId);
  res.redirect("/urls");
});

// Logout user
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// Register new user
app.post("/register", (req, res) => {
  const newUserId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    console.log("Error: Empty email or password");
    
    return res.sendStatus(400);
  }

  if (getIdFromEmail(email)) {
    console.log(`Error: Email ${email} already registered`);
    
    return res.sendStatus(400);
  }
  
  users[newUserId] = {
    id: newUserId,
    email,
    password
  };

  console.log(users[newUserId]);
  
  res.cookie("user_id", newUserId);
  res.redirect("/urls");
});

// 404 handler
app.use("*", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  res.status(404).render("404", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
