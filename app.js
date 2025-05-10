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

// Routes

// Home Page
app.get("/", (req, res) => {
  if (req.session.authenticated) {
    console.log("Authenticated user: " + req.session.username);
    res.redirect("/home");
  } else {
    res.redirect("/home");
  }
});

app.get("/", (req, res) => {
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

// routs to get image urls from the database
// might need to add middleware to check if user is authenticated to access this route (currently anyone can access it and see image urls)
app.get("/api/image/:type", async (req, res) => {
  const type = req.params.type;

  if (type !== "real" && type !== "ai") {
    return res.status(404).sendFile(__dirname + "/public/404.html");
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
