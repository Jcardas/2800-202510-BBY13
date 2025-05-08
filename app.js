require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const saltRounds = 12;
const Joi = require("joi");
const app = express();

const PORT = process.env.PORT || 3000;
const expireTime = 1 * 60 * 60 * 1000; // 1 hour

// MongoDB .env values
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_SESSION_SECRET = process.env.MONGODB_SESSION_SECRET;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE;

const NODE_SESSION_SECRET = process.env.NODE_SESSION_SECRET;

// MongoDB client
var { database } = require("./databaseConnection");
const userCollection = database.db(MONGODB_DATABASE).collection("users");

// Middleware
app.use(express.urlencoded({ extended: true }));

// Session setup
const mongoStore = MongoStore.create({
  mongoUrl: `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}/${MONGODB_DATABASE}`,
  crypto: { secret: MONGODB_SESSION_SECRET },
});

app.use(
  session({
    secret: NODE_SESSION_SECRET,
    store: mongoStore,
    saveUninitialized: false,
    resave: true,
    cookie: { maxAge: expireTime },
  })
);

// Routes

// Home Page
app.get("/", (req, res) => {
  if (req.session.authenticated) {
    // If user is authenticated, show the home page as well (TODO: make a separate page)
    res.redirect("/home");
  } else {
    res.redirect("/home");
  }
});

app.get("/home", (req, res) => {
  res.sendFile(__dirname + "/public/home.html");
}
);

app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/public/signup.html");
}
);
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
}
);

app.get("/real-vs-ai", (req, res) => {
  res.sendFile(__dirname + "/public/real-vs-ai.html");
}
);

app.get("/real-vs-ai-game", (req, res) => {
  res.sendFile(__dirname + "/public/real-vs-ai-game.html");
}
);


// Signup Form Submission
app.post("/signup", async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  const schema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(4).max(20).required(),
  });

  const validation = schema.validate({ username, email, password });
  if (validation.error) {
    return res.send("Invalid input. <a href='/signup'>Try again</a>");
  }

  const existingUser = await userCollection.findOne({ email });
  if (existingUser) {
    return res.send(
      "User already exists. <a href='/signup'>Try again</a>"
    );
  }

  const hashed = await bcrypt.hash(password, saltRounds);
  await userCollection.insertOne({ username, email, password: hashed });

  req.session.authenticated = true;
  req.session.username = username;

  res.redirect("/");
});

// Login Form Submission
app.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required(),
  });

  const validation = schema.validate({ email, password });
  if (validation.error) {
    return res.send("Invalid input. <a href='/login'>Try again</a>");
  }

  const user = await userCollection.findOne({ email });
  if (!user) {
    return res.send("User not found. <a href='/login'>Try again</a>");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.send("Incorrect password. <a href='/login'>Try again</a>");
  }

  req.session.authenticated = true;
  req.session.username = user.username;

  res.redirect("/");
});


// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.use(express.static(__dirname + "/public"));

// 404 Fallback
app.get("/*dummy", (req, res) => {
  res.status(404);
  res.sendFile(__dirname + "/public/404.html");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
