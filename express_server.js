const express = require("express");
const morgan = require("morgan");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = () => {
  return Math.random().toString(36).replace(/[^a-z0-9]+/g, '').substr(0, 6);
};

app.use(express.urlencoded({extended: true}));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Hello!asdfasdfas");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const tinyURL = generateRandomString();
  urlDatabase[tinyURL] = req.body.longURL;
  console.log(`New URL stored: {${tinyURL} : ${urlDatabase[tinyURL]}}`);
  
  res.redirect(`urls/${tinyURL}`);         // Respond with 'Ok' (we will replace this)
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (!longURL) {
    // TODO: not DRY
    res.status(404).render("404_error");
    
    return;
  }

  res.redirect(longURL);
});

// 404 handler
app.get("*", (req, res) => {
  res.status(404).render("404_error");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
