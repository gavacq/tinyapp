// TODO: use custom log message format with colorizing
// TODO: temporary route for POST testing. Send delete request to /urls , not urls/{url}/delete
const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// TODO: use better RNG and generate capital letters
const generateRandomString = () => {
  return Math.random().toString(36).replace(/[^a-z0-9]+/g, '').substr(0, 6);
};

app.use(express.urlencoded({extended: true}));
app.use(morgan("dev"));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello!asdfasdfas");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies.username
  };
  res.render("urls_index", templateVars);
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
    username: req.cookies.username
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies.username
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

app.post("/login", (req, res) => {
  res.cookie("username", `${req.body.username}`);
  res.redirect(303, "/urls");
});

// 404 handler
app.use("*", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies.username
  };
  res.status(404).render("404", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
