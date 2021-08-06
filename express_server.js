// TODO: use custom log message format with colorizing
// TODO: DRY up templateVars usage
const express = require("express");
const morgan = require("morgan");
const cookieSession = require("cookie-session");
const inspect = require("util").inspect;
const bcrypt = require("bcrypt");

// Local imports
const {generateRandomString, getUserByEmail, getUrlsOfUser, urlBelongsToUser} = require("./helpers");

const PORT = 8080;
const key1 = 'f83f6a3696bc184779bdc3c7aded56196cf107982770518a53bf7dea7736fc2dc3a3d312e4de519ccf82adf8f194c2d15307cc4efe7a426039bf564a31c93ade';
const key2 = '7feafc0683e7da49fc2405d1990ddd4d08e0623d6aca13bb48dd76ef891d12cfda7eb26f78a1820981f34b70da5b8ce2cf416000bc730ea379951d47744f0398';
const key3 = '2da54d8184202d1915ab33f10d5557f1a764847dc2d8feb8f98a4dc8d6fae216bcbe12c1ab2d33ca68d881e3ca66283d0a64861c3f62a4bbb26ae000ccd51b44';
const urlDatabase = {
  "test2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "userRandomID"
  },
  "test1":{
    longURL: "http://www.google.com",
    userId: "123"
  }
};
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    hashedPassword: "$2b$12$vvBwydxtyfw17xqsW2Q7Q.H5dDa35SMVeeJWlHINXsmMD70hvDrwy" // purple-monkey-dinosaur
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    hashedPassword: "$2b$12$GyirFMxXWE527OG2P.A6qe4rWFiVtCNcjBCgeqBhLx.5yWN1zTrmy" //dishwasher-funk
  },
  "123": {
    id: "123",
    email: "test@test.com",
    hashedPassword: "$2b$12$nJVbTmDJTbn3uSg8WTaTzO67Sm/aHdZ0lv4N9mKmLZNRJQFfj3wsq" //test
  }
};

const app = express();
app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));
app.use(morgan("dev"));
app.use(cookieSession({
  name: 'session',
  keys: [key1, key2, key3],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(express.static('public'));

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  let errorMessage = undefined;
  if (!req.session.user_id) {
    errorMessage = "You must be logged in to see this";
  }

  const templateVars = {
    urls: getUrlsOfUser(req.session.user_id, urlDatabase),
    user: users[req.session.user_id],
    errorMessage,
    button: "login"
  };

  if (errorMessage) {
    return res.status(403).render("error", templateVars);
  }

  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }

  const templateVars = {user: users[req.session.user_id]};
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }

  const templateVars = {user: users[req.session.user_id]};
  res.render("login", templateVars);
});

// Create new URL
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.sendStatus(403);
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userId: req.session.user_id
  };
  console.log(`New URL stored: { ${shortURL} : ${inspect(urlDatabase[shortURL])}}`);

  res.redirect(`urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }

  const templateVars = {user: users[req.session.user_id]};

  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  let errorMessage = undefined;
  let button = undefined;

  if (!urlDatabase[shortURL]) {
    return res.redirect("/404");
  }

  if (!req.session.user_id) {
    errorMessage = "You must be logged in to see this";
    button = "login";
  } else if (!urlBelongsToUser(shortURL, req.session.user_id, urlDatabase)) {
    errorMessage = "You do not have permission to edit this URL";
    button = "urls";
  }

  const templateVars = {
    shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id],
    errorMessage,
    button
  };

  if (errorMessage) {
    return res.status(403).render("error", templateVars);
  }

  res.render("urls_show", templateVars);
});

// Edit longURL for a given shortURL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  let errorMessage = undefined;
  let button = undefined;

  if (!urlDatabase[shortURL]) {
    return res.redirect("/404");
  }

  if (!req.session.user_id) {
    errorMessage = "You must be logged in to see this";
    button = "login";
  } else if (!urlBelongsToUser(shortURL, req.session.user_id, urlDatabase)) {
    errorMessage = "You do not have permission to edit this URL";
  }

  const templateVars = {
    shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id],
    errorMessage,
    button
  };

  if (errorMessage) {
    return res.status(403).render("error", templateVars);
  }

  urlDatabase[req.params.shortURL].longURL = req.body.longURL;

  console.log(`URL for ${req.params.shortURL} changed to ${req.body.longURL}`);

  res.redirect("/urls");
});

// Delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  // TODO: DRY this up, also used in POST, GET /urls/:shortURL
  const shortURL = req.params.shortURL;
  let errorMessage = undefined;
  let button = undefined;

  if (!urlDatabase[shortURL]) {
    return res.redirect("/404");
  }

  if (!req.session.user_id) {
    errorMessage = "You must be logged in to see this";
    button = "login";
  } else if (!urlBelongsToUser(shortURL, req.session.user_id, urlDatabase)) {
    errorMessage = "You do not have permission to edit this URL";
  }

  const templateVars = {
    shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id],
    errorMessage,
    button
  };

  if (errorMessage) {
    return res.status(403).render("error", templateVars);
  }

  delete urlDatabase[req.params.shortURL];

  console.log(`URL for ${req.params.shortURL} was deleted`);

  res.redirect(303, "/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const url = urlDatabase[req.params.shortURL];

  if (!url) {
    // TODO: DRY this up
    return res.redirect("/404");
  }

  res.redirect(url.longURL);
});

// Login user
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userId = getUserByEmail(email, users);
  let errorMessage = undefined;

  if (!userId || !password || !bcrypt.compareSync(password, users[userId].hashedPassword)) {
    errorMessage = `Email or password incorrect`;
  }

  const templateVars = {
    user: users[req.session.user_id],
    errorMessage,
    button: "login"
  };

  if (errorMessage) {
    return res.status(403).render("error", templateVars);
  }

  console.log(`User login: ${email}`);

  req.session["user_id"] = userId;
  res.redirect("/urls");
});

// Logout user
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// Register new user
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  let errorMessage = undefined;

  if (!email || !password) {
    errorMessage = "Please provide a valid email and password";
  }

  if (getUserByEmail(email, users)) {
    errorMessage = "This email is already taken";
  }

  const templateVars = {
    user: users[req.session.user_id],
    errorMessage,
    button: "register"
  };

  if (errorMessage) {
    return res.status(400).render("error", templateVars);
  }

  const hashedPassword = bcrypt.hashSync(password, 12);

  users[id] = {
    id,
    email,
    hashedPassword
  };

  console.log(`New user registered: ${inspect(users[id])}`);

  req.session["user_id"] = id;
  res.redirect("/urls");
});

// 404 handler
app.use("*", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };
  res.status(404).render("404", templateVars);
});

app.listen(PORT, () => {
  console.log(`tinyapp listening on port ${PORT}`);
});
