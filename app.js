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

// Cloudinary .env values
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_SECRET
});

// Variables needed for image upload
const multer = require('multer');
const { v4: uuid } = require('uuid');
const upload = multer({ storage: multer.memoryStorage() });

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

// Middleware functions

// Middleware to check if user is authenticated (logged in)
function isAuthenticated(req, res, next) {
  if (req.session.authenticated) {
    return next();
  } else {
    res.redirect("/login");
  }
}

// Middleware to check if the logged in user is an admin
function isAdmin(req, res, next) {
  if (req.session.role === "admin") {
    return next();
  } else {
    return res.status(403).render("404");
  }
}

// Middleware to check if the request is coming from the game page
function fromGamePage(req, res, next) {
  const referer = req.get("referer") || "";

  if (referer.includes("/real-vs-ai-game")) {
    return next(); // Allow access if request came from the game
  }

  // if not coming from game page, then this page does not exist
  return res.status(404).render("404");
}

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

app.get("/games", (req, res) => {
  res.render("games", {
    title: 'Games'
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
  await userCollection.insertOne({ username, email, password: hashed, role: "user" });

  req.session.authenticated = true;
  req.session.username = username;
  req.session.role = "user";

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
  req.session.role = user.role;

  res.redirect("/");
});

// routes to get image urls from the database
// if rout is accessed from the game page (real-vs-ai-game.js), then it will return a random image url
// if not, then it will return a 404 error
// this is to prevent direct access to the image urls
app.get("/api/image/:type", fromGamePage, async (req, res) => {
  const type = req.params.type;

  if (type !== "real" && type !== "ai") {
    return res.status(404).render("404");
  }

  const images = await imageCollection.find({ type }).toArray();
  if (!images.length) return res.status(404).send("No images found");

  const random = images[Math.floor(Math.random() * images.length)];
  res.json({ url: random.url });
});

//Creating scammer joke with ChatGPT API
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


app.get("/api/joke", async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a witty assistant who tells short jokes about online scammers.",
        },
        {
          role: "user",
          content: "Tell me a joke about scammers.",
        },
      ],
      temperature: 0.8,
    });

    const joke = completion.choices[0].message.content;
    res.json({ joke });
  } catch (error) {
    console.error("Error generating joke:", error);
    res.status(500).json({ error: "Failed to get joke" });
  }
});

// Information Hub Routes
app.get("/information", async (req, res) => {
  try {
      // Get all information pages for listing
      const pages = await database.db(MONGODB_DATABASE)
          .collection("information")
          .find({}, { projection: { title: 1, slug: 1, description: 1 } })
          .toArray();

      res.render("information-list", { 
          title: 'Information Hub',
          pages 
      });
  } catch (error) {
      console.error("Error fetching information pages:", error);
      res.status(500).render("500");
  }
});

// Dynamic Information Page
app.get("/information/:slug", async (req, res) => {
  try {
      const slug = req.params.slug;
      
      const content = await database.db(MONGODB_DATABASE)
          .collection("information")
          .findOne({ slug });

      res.render("information", { 
          title: content?.title || 'Information',
          content 
      });
  } catch (error) {
      console.error("Error fetching information page:", error);
      res.status(500).render("500");
  }
});

// Admin Page
// Only accessible to authenticated users with admin role
// This page will be used to add new images to the database
app.get("/admin", isAuthenticated, isAdmin, (req, res) => {
  const message = req.session.message;
  delete req.session.message;

  res.render('admin', { message });
});

// Admin Image Upload
app.post("/admin/upload", isAuthenticated, isAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      req.session.message = 'No image file uploaded.';
      return res.redirect('/admin');
    }

    const type = req.body.type.toLowerCase();
    const schema = Joi.object({
      type: Joi.string().valid('ai', 'real').required()
    });
    const { error } = schema.validate({ type });
    if (error) {
      req.session.message = 'Invalid type: must be "ai" or "real"';
      return res.redirect('/admin');
    }

    const image_uuid = uuid();
    const base64Image = req.file.buffer.toString('base64');

    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${base64Image}`,
      {
        public_id: image_uuid,
        folder: 'ai-vs-real-images'
      }
    );

    if (!result?.secure_url) {
      req.session.message = 'Cloudinary upload failed';
      return res.redirect('/admin');
    }

    await imageCollection.insertOne({
      url: result.secure_url,
      type: type
    });

    req.session.message = 'Image successfully uploaded!';
    return res.redirect('/admin');

  } catch (err) {
    console.error(err);
    req.session.message = 'Error uploading image';
    res.redirect('/admin');
  }
});

// Admin Information Pages Routes
app.get("/admin/information", isAuthenticated, isAdmin, async (req, res) => {
  try {
      const existingPages = await database.db(MONGODB_DATABASE)
          .collection("information")
          .find({}, { projection: { title: 1, slug: 1 } })
          .toArray();

      res.render("admin-information", {
          title: 'Manage Information Pages',
          existingPages
      });
  } catch (error) {
      console.error("Error fetching information pages:", error);
      res.status(500).render("500");
  }
});

app.post("/admin/information/add", isAuthenticated, isAdmin, upload.single('image'), async (req, res) => {
  try {
      const { title, slug, description, body } = req.body;
      
      // Validation
      const schema = Joi.object({
          title: Joi.string().required(),
          slug: Joi.string().required().pattern(/^[a-z0-9-]+$/),
          description: Joi.string().required(),
          body: Joi.string().required()
      });

      const { error } = schema.validate({ title, slug, description, body });
      if (error) {
          req.session.message = { type: 'error', text: error.details[0].message };
          return res.redirect('/admin/information');
      }

      // Check if slug already exists
      const existingPage = await database.db(MONGODB_DATABASE)
          .collection("information")
          .findOne({ slug });

      if (existingPage) {
          req.session.message = { type: 'error', text: 'Slug already exists' };
          return res.redirect('/admin/information');
      }

      // Handle image upload if present
      let imageUrl = '';
      if (req.file) {
          const result = await cloudinary.uploader.upload(
              `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
              { folder: 'information-pages' }
          );
          imageUrl = result.secure_url;
      }

      // Insert new page
      await database.db(MONGODB_DATABASE)
          .collection("information")
          .insertOne({
              title,
              slug,
              description,
              body,
              imageUrl,
              createdAt: new Date(),
              updatedAt: new Date()
          });

      req.session.message = { type: 'success', text: 'Page created successfully' };
      res.redirect('/admin/information');
  } catch (error) {
      console.error("Error adding information page:", error);
      req.session.message = { type: 'error', text: 'Failed to create page' };
      res.redirect('/admin/information');
  }
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


