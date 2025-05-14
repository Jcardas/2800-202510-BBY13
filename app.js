require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const saltRounds = 12;
const Joi = require("joi");
const app = express();

// Specify the view engine
app.set('view engine', 'ejs');

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
const imageCollection = database.db(MONGODB_DATABASE).collection("images");

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

// Middleware- added for a responsive navbar
app.use((req, res, next) => {
  // Make user session data available in all templates
  res.locals.user = req.session.authenticated ? {
    username: req.session.username,
    authenticated: true
  } : null;
  next();
});

// Routes

// Home Page
app.get("/", (req, res) => {
  if (req.session.authenticated) {
    console.log("Authenticated user: " + req.session.username);
  }
  res.redirect("/home");
});

app.get("/home", (req, res) => {
  res.render("home", {
    title: 'Home'
  });
});

app.get("/signup", (req, res) => {
  res.render("signup", {
    title: 'Sign Up'
  });
}
);
app.get("/login", (req, res) => {
  res.render("login", {
    title: 'Log In'
  });
}
);

app.get("/real-vs-ai", (req, res) => {
  res.render("real-vs-ai", {
    title: 'Real vs AI'
  });
}
);

app.get("/real-vs-ai-game", (req, res) => {
  res.render("real-vs-ai-game", {
    title: 'Real vs AI Game'
  });
}
);

app.get("/about", (req, res) => {
  res.render("about", {
    title: 'About Us'
  });
}
);

app.get("/leaderboard", (req, res) => {
  // Sample data to simulate a leaderboard
  const leaderboard = [
    { name: 'Alice', score: 10, total: 10, time: '02:15' },
    { name: 'Bob', score: 9, total: 10, time: '03:10' },
    { name: 'Charlie', score: 8, total: 10, time: '04:05' },
    { name: 'Diana', score: 7, total: 10, time: '05:00' },
    { name: 'Eve', score: 6, total: 10, time: '06:30' }
  ];
  res.render('leaderboard', { 
    leaderboard,
    title: 'Leaderboard',
    isLoggedIn: req.session.authenticated
   });
});

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
    return res.send("Invalid input. IMPLEMENT THIS PAGE");
  }

  const existingUser = await userCollection.findOne({ email });
  if (existingUser) {
    return res.send(
      "User already exists. IMPLEMENT THIS PAGE"
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
    return res.send("Invalid input. IMPLEMENT THIS PAGE");
  }

  const user = await userCollection.findOne({ email });
  if (!user) {
    return res.send("User not found. IMPLEMENT THIS PAGE");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.send("Incorrect password. IMPLEMENT THIS PAGE");
  }

  req.session.authenticated = true;
  req.session.username = user.username;

  res.redirect("/");
});

// routes to get image urls from the database
// might need to add middleware to check if user is authenticated to access this route (currently anyone can access it and see image urls)
app.get("/api/image/:type", async (req, res) => {
  const type = req.params.type;

  if (type !== "real" && type !== "ai") {
    return res.status(404).sendFile(__dirname + "/404");
  }

  const images = await imageCollection.find({ type }).toArray();
  if (!images.length) return res.status(404).send("No images found");

  const random = images[Math.floor(Math.random() * images.length)];
  res.json({ url: random.url });
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
  res.render("404", {
    title: 'Page not found'
  })
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
