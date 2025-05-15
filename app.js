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
const scoresCollection = database.db(MONGODB_DATABASE).collection("scores");


// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
    return res.status(403).render("404", {
      title: 'Cannot access this page'
    })
  }
}

// Middleware to check if the request is coming from the game page
function fromGamePage(req, res, next) {
  const referer = req.get("referer") || "";

  if (referer.includes("/real-vs-ai-game")) {
    return next(); // Allow access if request came from the game
  }

  // if not coming from game page, then this page does not exist
  return res.status(404).render("404", {
    title: 'Page not found'
  });
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).render('500', {
      title: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err : {}
  });
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
    title: 'Sign Up',
    errorMessage: req.session.errorMessage || null,
    email: req.session.email || null
  });
  // Clear the error message after displaying it
  req.session.errorMessage = null;
  req.session.email = null;
});

app.get("/login", (req, res) => {
  res.render("login", {
    title: 'Log In',
    errorMessage: req.session.errorMessage || null,
    email: req.session.email || null
  });
  // Clear the error message after displaying it
  req.session.errorMessage = null;
  req.session.email = null;
});


app.get("/real-vs-ai-game", (req, res) => {
  res.render("real-vs-ai-game", {
    title: 'Real vs AI Game',
    isLoggedIn: req.session.authenticated || false
  });
});

app.get("/about", (req, res) => {
  res.render("about", {
    title: 'About Us'
  });
});

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
    isLoggedIn: req.session.authenticated === true
  });
});

// Signup Form Submission
app.post("/signup", async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

    // Store form data in session in case we need to redirect back
    req.session.formData = { username, email };

  const schema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(4).max(20).required(),
  });

  const validation = schema.validate({ username, email, password });
  if (validation.error) {
    req.session.errorMessage = "Invalid input. Please check your entries.";
    return res.redirect("/signup");
  }

  const existingUser = await userCollection.findOne({ email });
  if (existingUser) {
    req.session.errorMessage = "User with this email already exists.";
    return res.redirect("/signup");
  }

  const hashed = await bcrypt.hash(password, saltRounds);
  await userCollection.insertOne({ username, email, password: hashed, role: "user" });

  req.session.authenticated = true;
  req.session.username = username;
  req.session.email = email;
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
    req.session.errorMessage = "Invalid input format";
    req.session.email = email; // Preserve the email they entered
    return res.redirect("/login");
  }

  const user = await userCollection.findOne({ email });
  if (!user) {
    req.session.errorMessage = "User not found";
    req.session.email = email; // Preserve the email they entered
    return res.redirect("/login");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    req.session.errorMessage = "Incorrect password";
    req.session.email = email; // Preserve the email they entered
    return res.redirect("/login");
  }
  req.session.authenticated = true;
  req.session.username = user.username;
  req.session.email = user.email;
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
    return res.status(404).render("404", {
      title: 'Page not found'
    });
  }

  const images = await imageCollection.find({ type }).toArray();
  if (!images.length) {
    return res.status(404).render("404", {
      title: 'No images found'
    });
  }

  const random = images[Math.floor(Math.random() * images.length)];

  // Send the image URL and description as JSON, and the description tag will be used to generate a hint
  res.json({ url: random.url, description: random.description });
});

//Creating scammer joke with ChatGPT API
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Endpoint to get a joke
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
      temperature: 0.9,
    });

    const joke = completion.choices[0].message.content;
    res.json({ joke });
  } catch (error) {
    console.error("Error generating joke:", error);
    res.status(500).json({ error: "Failed to get joke" });
  }
});

// Information Hub Routes
app.get("/admin/information", isAuthenticated, isAdmin, async (req, res) => {
  try {
      const existingPages = await database.db(MONGODB_DATABASE)
          .collection("information")
          .find({}, { 
              projection: { 
                  title: 1, 
                  slug: 1,
                  updatedAt: 1 
              },
              sort: { updatedAt: -1 }
          })
          .toArray();

      // Get form data from session if it exists
      const formData = req.session.formData || {};
      delete req.session.formData;

      res.render("admin-information", {
          title: 'Manage Information Pages',
          existingPages,
          message: req.session.message,
          formData // Pass form data back to the template
      });
      delete req.session.message;
  } catch (error) {
      console.error("Error fetching information pages:", error);
      res.status(500).render("500", { title: 'Server Error' });
  }
});

// Dynamic Information Page
app.get("/information/:slug", async (req, res) => {
  try {
      const slug = req.params.slug;
      const content = await database.db(MONGODB_DATABASE)
          .collection("information")
          .findOne({ slug });

      if (!content) {
          return res.status(404).render("404", { title: 'Page Not Found' });
      }

      res.render("information", { 
          title: content.title,
          content,
          isLoggedIn: req.session.authenticated || false
      });
  } catch (error) {
      console.error("Error fetching information page:", error);
      res.status(500).render("500", { title: 'Server Error' });
    }
  });

// Endpoint to get a hint related to the description tag of the image pulled from database
app.get("/api/hint/:description", async (req, res) => {
  // Set a timeout promise that rejects after 10 seconds
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), 10000)
  );

  try {
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an assistant that generates quick. short and subtle hints to assist in spotting real and ai generated fake images. Do not provide any headings titles, or bold text, simply respond with the hint itself.",
          },
          {
            role: "user",
            content: `Provide a hint relating to spotting an ai generated ${req.params.description} image.`,
          },
        ],
        temperature: 0.9,
      }),
      timeoutPromise,
    ]);

    const hint = completion.choices[0].message.content;
    res.json({ hint });
  } catch (error) {
    if (error.message === "timeout") {
      res.json({ hint: "Failed to get a hint in time, sorry" });
    } else {
      console.error("Error generating hint:", error);
      res.status(500).json({ error: "Server Error: Failed to get hint." });
    }
  }
});

// Admin Page
// Only accessible to authenticated users with admin role
// This page will be used to add new images to the database
app.get("/admin", isAuthenticated, isAdmin, (req, res) => {
    const message = req.session.message;
    delete req.session.message;

  res.render('admin', {
    title: 'Admin Dashboard',
    message
  });
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

// Submit Score if user is authenticated
app.post("/api/score", isAuthenticated, async (req, res) => {
  try {
    const { score, total, timeTaken } = req.body;

    await scoresCollection.insertOne({
      email: req.session.email,
      username: req.session.username,
      score,
      total,
      time: timeTaken,
      timestamp: new Date()
    });

    console.log("Score saved successfully:", {
      email: req.session.email,
      username: req.session.username,
      score,
      total,
      time: timeTaken
    });

    res.send("Score saved successfully.");
  } catch (error) {
    console.error("Error saving score:", error);
    res.status(500).send("Failed to save score.");
  }
});

// Admin Information Management
app.get("/admin/information", isAuthenticated, isAdmin, async (req, res) => {
  try {
      const existingPages = await database.db(MONGODB_DATABASE)
          .collection("information")
          .find({}, { 
              projection: { 
                  title: 1, 
                  slug: 1,
                  updatedAt: 1 
              },
              sort: { updatedAt: -1 }
          })
          .toArray();

      res.render("admin-information", {
          title: 'Manage Information Pages',
          existingPages,
          message: req.session.message
      });
      delete req.session.message;
  } catch (error) {
      console.error("Error fetching information pages:", error);
      res.status(500).render("500", { title: 'Server Error' });
  }
});

app.post("/admin/information/add", isAuthenticated, isAdmin, upload.single('image'), async (req, res) => {
  try {
      const { title, slug, description, body } = req.body;
      
      const schema = Joi.object({
          title: Joi.string().min(3).max(100).required(),
          slug: Joi.string().pattern(/^[a-z0-9-]+$/).required(),
          description: Joi.string().min(10).max(200).required()
              .messages({
                  'string.min': 'Description must be at least 10 characters',
                  'string.max': 'Description cannot exceed 200 characters'
              }),
          body: Joi.string().min(10).required()
      });

      const { error } = schema.validate({ title, slug, description, body });
      if (error) {
          // Preserve form data in session to repopulate the form
          req.session.formData = { title, slug, description, body };
          req.session.message = { 
              type: 'error', 
              text: error.details[0].message 
            
          };
          return res.redirect('/admin/information');
      }

      // Check for existing slug
      const existingPage = await database.db(MONGODB_DATABASE)
          .collection("information")
          .findOne({ slug });

      if (existingPage) {
          req.session.message = { 
              type: 'error', 
              text: 'This URL slug is already in use' 
          };
          return res.redirect('/admin/information');
      }

      // Handle image upload
      let imageUrl = '';
      if (req.file) {
          try {
              const result = await cloudinary.uploader.upload(
                  `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
                  { 
                      folder: 'information-pages',
                      quality: 'auto:good',
                      fetch_format: 'auto'
                  }
              );
              imageUrl = result.secure_url;
          } catch (uploadError) {
              console.error("Cloudinary upload failed:", uploadError);
              req.session.message = { 
                  type: 'error', 
                  text: 'Failed to upload image' 
              };
              return res.redirect('/admin/information');
          }
      }

      // Create document
      const now = new Date();
      const document = {
          title,
          slug,
          description,
          body,
          imageUrl: imageUrl || null,
          createdAt: now,
          updatedAt: now
      };

      // Insert into database
      const insertResult = await database.db(MONGODB_DATABASE)
          .collection("information")
          .insertOne(document);

      if (!insertResult.acknowledged) {
          throw new Error('Database insertion failed');
      }

      req.session.message = { 
          type: 'success', 
          text: 'Page created successfully!' 
      };
      return res.redirect('/admin/information');

    } catch (error) {
      console.error("Error in form submission:", error);
      req.session.message = { 
          type: 'error', 
          text: 'Failed to create page. Please try again.' 
      };
      return res.redirect('/admin/information');
  }
});

// Edit Page Route
app.get("/admin/information/edit/:slug", isAuthenticated, isAdmin, async (req, res) => {
  try {
      const page = await database.db(MONGODB_DATABASE)
          .collection("information")
          .findOne({ slug: req.params.slug });

      if (!page) {
          req.session.message = { type: 'error', text: 'Page not found' };
          return res.redirect('/admin/information');
      }

      res.render("admin-information-edit", {
          title: 'Edit Page',
          page
      });
  } catch (error) {
      console.error("Error fetching page:", error);
      res.status(500).render("500", { title: 'Server Error' });
  }
});

app.post("/admin/information/delete/:slug", isAuthenticated, isAdmin, async (req, res) => {
  try {
      const result = await database.db(MONGODB_DATABASE)
          .collection("information")
          .deleteOne({ slug: req.params.slug });

      if (result.deletedCount === 0) {
          req.session.message = { type: 'error', text: 'Page not found' };
      } else {
          req.session.message = { type: 'success', text: 'Page deleted successfully' };
      }
      res.redirect('/admin/information');
  } catch (error) {
      console.error("Error deleting page:", error);
      req.session.message = { type: 'error', text: 'Failed to delete page' };
      res.redirect('/admin/information');
  }
});

app.get("/information", async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const [pages, count] = await Promise.all([
          database.db(MONGODB_DATABASE)
              .collection("information")
              .find({}, { 
                  projection: { title: 1, slug: 1, description: 1 },
                  sort: { createdAt: -1 },
                  skip,
                  limit
              })
              .toArray(),
          database.db(MONGODB_DATABASE)
              .collection("information")
              .countDocuments()
      ]);

      res.render("information-list", { 
          title: 'Information Hub',
          pages,
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          isLoggedIn: req.session.authenticated || false
      });
  } catch (error) {
      // Error handling
  }
});

// Update Page Route
app.post("/admin/information/update/:slug", isAuthenticated, isAdmin, upload.single('image'), async (req, res) => {
  // Similar to add route but with update logic
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


