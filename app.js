// load environment variables from .env file
require("dotenv").config();

// Import required modules
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const saltRounds = 12;
const Joi = require("joi");
const app = express();

// Specify the view engine
app.set('view engine', 'ejs');

// Set port and cookie expiration time
const PORT = process.env.PORT || 3000;
const expireTime = 1 * 60 * 60 * 1000; // 1 hour

// MongoDB .env values
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_SESSION_SECRET = process.env.MONGODB_SESSION_SECRET;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE;

// Node session secret
const NODE_SESSION_SECRET = process.env.NODE_SESSION_SECRET;

// Cloudinary .env values
const cloudinary = require('cloudinary').v2;

// Cloudinary configuration
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
const scamQuizCollection = database.db(MONGODB_DATABASE).collection("questions");


// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session setup
const mongoStore = MongoStore.create({
  mongoUrl: `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}/${MONGODB_DATABASE}`,
  crypto: { secret: MONGODB_SESSION_SECRET },
});

// Set up session middleware
app.use(
  session({
    secret: NODE_SESSION_SECRET,
    store: mongoStore,
    saveUninitialized: false,
    resave: true,
    cookie: { maxAge: expireTime },
  })
);

//Helper function to format leaderboard time as #:##
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

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

// Middleware to check if the request is coming from the game pages
// This is to prevent direct access to the image URLs
// and the scam quiz question APIs
function fromGamePage(req, res, next) {
  const referer = req.get("referer") || "";

  if (referer.includes("/real-vs-ai-game")) {
    return next(); // Allow access if request came from the game
  }
  else if (referer.includes("/have-i-been-scammed")) {
    return next(); // Allow access if request came from the scam quiz game
  }

  // if not coming from game page, then this page does not exist
  return res.status(404).render("404", {
    title: 'Page not found'
  });
}

// Middleware - added for a responsive navbar
app.use((req, res, next) => {
  // Make user session data available in all templates
  if (req.session.authenticated) {
    res.locals.user = {
      username: req.session.username,
      authenticated: true,
      role: req.session.role,
      profileImageUrl: req.session.profileImageUrl || '/icons/account_circle_black.svg'
    };
  } else {
    res.locals.user = null;
  }
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

// /home rout loads the home page like the index page (/)
app.get("/home", (req, res) => {
  res.render("home", {
    title: 'Home'
  });
});

// Load the games page
app.get("/games", (req, res) => {
  res.render("games", {
    title: 'Games'
  });
});

// Load signup and page with error message if it exists
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

// Load login page with error message if it exists
app.get("/login", (req, res) => {
  res.render("login", {
    title: 'Log In',
    errorMessage: req.session.errorMessage || null,
    email: req.session.email || null,
    fieldError: req.session.fieldError || null
  });
  // Clear the error message after displaying it
  req.session.errorMessage = null;
  req.session.email = null;
  req.session.fieldError = null;
});

// Load the real vs AI game page
app.get("/real-vs-ai-game", (req, res) => {
  res.render("real-vs-ai-game", {
    title: 'Real vs AI Game',
    isLoggedIn: req.session.authenticated || false
  });
});

// Load the have I been scammed game page
app.get("/have-i-been-scammed", (req, res) => {
  res.render("have-i-been-scammed", {
    title: 'Have I Been Scammed?',
    isLoggedIn: req.session.authenticated || false
  });
});

// Load the about page
app.get("/about", (req, res) => {
  res.render("about", {
    title: 'About Us'
  });
});

// Load the leaderboard page
// This page will show the top 6 scores for the selected game
app.get("/leaderboard", async (req, res) => {

  // get the game type from the query string
  const gameFilter = req.query.game || "real-vs-ai";

  // get scores from the database and store in a array
  try {
    const leaderboard = await scoresCollection.aggregate([
      { $match: { game: gameFilter } },   // filter by game type
      { $sort: { score: -1, time: 1 } },  // sort by score descending and time ascending
      { $limit: 6 },                      // limit to top 6 scores
      {
        $lookup: {
          from: "users",             // join with the 'users' collection
          localField: "userId",      // match this field from 'scores'
          foreignField: "_id",       // with this field from 'users'
          as: "user"                 // call the joined data 'user'
        }
      },
      { $unwind: "$user" },          // convert user array to an object
      {
        $project: {
          score: 1,
          total: 1,
          time: 1,
          username: "$user.username",
          profileImageUrl: "$user.profileImageUrl"
        }
      }
    ]).toArray();

    // load leaderboard page with the leaderboard data
    res.render('leaderboard', {
      leaderboard,
      title: gameFilter === "quiz" ? 'Have I been Scammed? Leaderboard' : 'Real vs AI Leaderboard',
      isLoggedIn: req.session.authenticated === true,
      extraStyles: "/css/leaderboard.css",
      gameFilter: gameFilter
    });
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    res.status(500).render("404", { title: 'Server Error' });
  }
});

// Load the account page
// This page will show the user their profile image and username
app.get("/account", isAuthenticated, (req, res) => {

  const message = req.session.message;
  delete req.session.message;

  // Render the account page with the user's data
  res.render("account", {
    title: 'Account',
    isLoggedIn: req.session.authenticated === true,
    username: req.session.username,
    profileImageUrl: req.session.profileImageUrl || '/icons/account_circle_black.svg',
    message
  });
});


// Signup Form Submission
app.post("/signup", async (req, res) => {

  // Get form data from the request body
  const username = req.body.username.trim();
  const email = req.body.email.trim();
  const password = req.body.password.trim();

  // Store form data in session in case we need to redirect back
  req.session.formData = { username, email };

  // Validate form data using Joi
  // The schema requires username, email, and password to be present
  const schema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(4).max(20).required(),
  });

  // Validate the data against the schema
  const validation = schema.validate({ username, email, password });
  if (validation.error) {
    req.session.errorMessage = "Invalid input. Please check your entries.";
    return res.redirect("/signup");
  }

  // Check if the email already exists in the database
  // If it does, set an error message and redirect back to the signup page
  const existingUser = await userCollection.findOne({ email });
  if (existingUser) {
    req.session.errorMessage = "User with this email already exists.";
    return res.redirect("/signup");
  }

  // Hash the password using bcrypt
  const hashed = await bcrypt.hash(password, saltRounds);
  await userCollection.insertOne({ username, email, password: hashed, role: "user" });

  // Set session variables for the new user
  // This will be used to keep the user logged in after signup
  req.session.authenticated = true;
  req.session.username = username;
  req.session.email = email;
  req.session.role = "user";

  // Redirect to the home page after successful signup
  res.redirect("/");
});

// Login Form Submission
app.post("/login", async (req, res) => {

  // Get form data from the request body
  const email = req.body.email.trim();
  const password = req.body.password.trim();

  // Validate form data using Joi
  // The schema requires email and password to be present
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required(),
  });

  // Validate the data against the schema
  // If validation fails, set an error message and redirect back to the login page
  const validation = schema.validate({ email, password });
  if (validation.error) {
    req.session.errorMessage = "Invalid input format";
    req.session.email = email; // Preserve the email they entered
    req.session.fieldError = validation.error.details[0].path[0]; // Preserve the field that caused the error
    return res.redirect("/login");
  }

  // Check if the user exists in the database
  // If not, set an error message and redirect back to the login page
  const user = await userCollection.findOne({ email });
  if (!user) {
    req.session.errorMessage = "User not found";
    req.session.email = email; // Preserve the email they entered
    req.session.fieldError = "email";
    return res.redirect("/login");
  }

  // Compare the entered password with the hashed password in the database
  // If they don't match, set an error message and redirect back to the login page
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    req.session.errorMessage = "Incorrect password";
    req.session.email = email; // Preserve the email they entered
    req.session.fieldError = "password";
    return res.redirect("/login");
  }

  // If everything is correct, set session variables for the logged-in user to keep them logged in
  req.session.authenticated = true;
  req.session.username = user.username;
  req.session.email = user.email;
  req.session.role = user.role;
  req.session.profileImageUrl = user.profileImageUrl || '/icons/account_circle_black.svg';

  // Redirect to the home page after successful login
  res.redirect("/");
});

// routes to get image urls from the database
// if rout is accessed from the game page (real-vs-ai-game.js), then it will return a random image url
// if not, then it will return a 404 error
// this is to prevent direct access to the image urls
app.get("/api/image/:type", fromGamePage, async (req, res) => {

  // Check if the type is either "real" or "ai"
  const type = req.params.type;

  // Validate the type parameter
  if (type !== "real" && type !== "ai") {
    return res.status(404).render("404", {
      title: 'Page not found'
    });
  }

  // Find images in the database that match the type
  const images = await imageCollection.find({ type }).toArray();
  if (!images.length) {
    return res.status(404).render("404", {
      title: 'No images found'
    });
  }

  // Randomly select an image from the array
  const random = images[Math.floor(Math.random() * images.length)];

  // Send the image URL and description as JSON, and the description tag will be used to generate a hint
  res.json({ url: random.url, description: random.description });
});

// Route to get a scam quiz question from the database
// If route is accessed from the game page (have-i-been-scammed.js), then it will return a random question
// If not, then it will return a 404 error
app.get("/api/scam-quiz", fromGamePage, async (req, res) => {

  // try to get a random question from the database
  // if no question is found, return a 404 error
  try {
    const questions = await database.db(MONGODB_DATABASE)
      .collection("questions")
      .aggregate([{ $sample: { size: 1 } }])
      .toArray();

    if (!questions.length) {
      return res.status(404).render("404", {
        title: 'No questions found'
      });
    }

    // Only send necessary fields to the client
    const { _id, question, options, correctIndex, explanation } = questions[0];
    res.json({
      question: {
        id: _id,
        question,
        options,
        correctIndex,
        explanation
      }
    });
  } catch (error) {
    console.error("Error fetching scam quiz question:", error);
    res.status(500).render("500", { title: 'Server Error' });
  }
});

//Creating scammer joke with ChatGPT API
const OpenAI = require("openai");

// Initialize OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Endpoint to get a joke
app.get("/api/joke", async (req, res) => {

  // try to get a joke from the OpenAI API
  // if no joke is found, return a 500 error
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          // System message to set the context for the AI
          role: "system",
          content: "You are a witty assistant who tells short jokes about online scammers.",
        },
        {
          // User message to prompt the AI for a joke
          role: "user",
          content: "Tell me a joke about scammers.",
        },
      ],
      // Set the temperature to control randomness
      temperature: 0.9,
    });

    // Extract the joke from the response
    const joke = completion.choices[0].message.content;
    res.json({ joke });
  } catch (error) {
    console.error("Error generating joke:", error);
    res.status(500).json({ error: "Failed to get joke" });
  }
});

// Information Hub Routes
app.get("/admin/information", isAuthenticated, isAdmin, async (req, res) => {

  // try to get all the information pages from the database
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

    const message = req.session.message || null;

    res.render("admin-information", {
      title: 'Manage Information Pages',
      existingPages,
      message,
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

  // try to get the information page from the database
  try {
    const slug = req.params.slug;
    const content = await database.db(MONGODB_DATABASE)
      .collection("information")
      .findOne({ slug });

    // If no content is found, return a 404 error
    if (!content) {
      return res.status(404).render("404", { title: 'Page Not Found' });
    }

    // Render the information page with the content
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

  // try to get a hint from the OpenAI API
  try {
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            // System message to set the context for the AI
            role: "system",
            content: "You are an assistant that generates quick. short and subtle hints to assist in spotting real and ai generated fake images. Do not provide any headings titles, or bold text, simply respond with the hint itself.",
          },
          {
            // User message to prompt the AI for a hint
            role: "user",
            content: `Provide a hint relating to spotting an ai generated ${req.params.description} image.`,
          },
        ],
        // Set the temperature to control randomness
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

// Admin Dashboard Page
// Only accessible to authenticated users with admin role
// This page will be used to access the admin panel
// which leads to managing the games and information pages
app.get("/admin", isAuthenticated, isAdmin, (req, res) => {
  res.render("admin-dashboard", {
    title: "Admin Dashboard"
  });
});

// Admin rout for real vs ai game to upload images
app.get("/admin/real-vs-ai", isAuthenticated, isAdmin, (req, res) => {
  const message = req.session.message;
  delete req.session.message;

  res.render("admin-real-vs-ai", {
    title: "Manage Real vs AI Game",
    message
  });
});

// Admin rout for scam quiz to uplaod questions
app.get("/admin/scam-quiz", isAuthenticated, isAdmin, (req, res) => {
  const message = req.session.message;
  delete req.session.message;

  res.render("admin-scam-quiz", {
    title: "Manage Scam Quiz Questions",
    message
  });
});

// Admin Image Upload
// This route is used to upload images for the real vs ai game
app.post("/admin/real-vs-ai/upload", isAuthenticated, isAdmin, upload.single('image'), async (req, res) => {

  // try to upload the image to cloudinary
  try {
    if (!req.file) {
      req.session.message = 'No image file uploaded.';
      return res.redirect('/admin/real-vs-ai');
    }

    // Validate the type and description fields
    const type = req.body.type.toLowerCase();
    const description = req.body.description;
    const schema = Joi.object({
      type: Joi.string().valid('ai', 'real').required()
    });
    const { error } = schema.validate({ type });
    if (error) {
      req.session.message = 'Invalid type: must be "ai" or "real"';
      return res.redirect('/admin/real-vs-ai');
    }

    // create a unique id for the image
    const image_uuid = uuid();
    const base64Image = req.file.buffer.toString('base64');

    // Upload the image to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${base64Image}`,
      {
        public_id: image_uuid,
        folder: 'ai-vs-real-images'
      }
    );

    // Check if the upload was successful
    if (!result?.secure_url) {
      req.session.message = 'Cloudinary upload failed';
      return res.redirect('/admin/real-vs-ai');
    }

    // Insert the image URL and type into the database
    await imageCollection.insertOne({
      url: result.secure_url,
      type: type,
      description: description
    });

    // Store the public ID in the database for future deletion
    req.session.message = 'Image successfully uploaded!';
    return res.redirect('/admin/real-vs-ai');

  } catch (err) {
    console.error(err);
    req.session.message = 'Error uploading image';
    res.redirect('/admin/real-vs-ai');
  }
});

// Admin Scam Quiz Upload
// This route is used to add a new question to the scam quiz
app.post("/admin/scam-quiz/add", isAuthenticated, isAdmin, async (req, res) => {

  // try to add a new question to the database
  try {

    // get the question, options, correct index and explanation from the request body
    const { question, options, correctIndex, explanation } = req.body;

    // Validate the input using Joi
    const schema = Joi.object({
      question: Joi.string().min(10).required(),
      options: Joi.array().items(Joi.string().required()).length(3).required(),
      correctIndex: Joi.number().valid(0, 1, 2).required(),
      explanation: Joi.string().min(5).required()
    });

    // Validate the data against the schema
    const validation = schema.validate({ question, options, correctIndex: parseInt(correctIndex), explanation });

    // Check for validation errors
    if (validation.error) {
      req.session.message = 'Invalid form input: ' + validation.error.details[0].message;
      return res.redirect("/admin/scam-quiz");
    }

    // create a new question object
    const newQuestion = {
      question,
      options,
      correctIndex: parseInt(correctIndex),
      explanation
    };

    // insert the new question into the database
    await scamQuizCollection.insertOne(newQuestion);

    req.session.message = "Question added successfully!";
    res.redirect("/admin/scam-quiz");
  } catch (error) {
    console.error("Error adding scam quiz question:", error);
    req.session.message = "Failed to add question.";
    res.redirect("/admin/scam-quiz");
  }
});

// This route is used to update the user's profile image and username
// takes the username and profileImage file from the form on the account page
// and updates the user in the database, uploading the new image to cloudinary
// if the user wants to remove the image or replace it, it will delete the old image from cloudinary
app.post("/account/update", isAuthenticated, upload.single('profileImage'), async (req, res) => {

  // try to update the user's profile image and username
  try {
    // Get the username and profile image from the request body
    const username = req.body.username.trim();
    const removeProfileImage = req.body.removeProfileImage === 'true';
    const profileImage = req.file;

    // Validate username
    const schema = Joi.object({
      username: Joi.string().min(3).max(20).required()
    });

    // Validate the data against the schema
    const { error } = schema.validate({ username });
    if (error) {
      req.session.message = 'Invalid username';
      return res.status(400).send('Invalid username');
    }

    // Check if no updates were made so we can skip the update (dont need to write to the database)
    const currentUser = await userCollection.findOne({ email: req.session.email });
    const usernameUnchanged = currentUser.username === username;
    const imageUnchanged = !removeProfileImage && !profileImage;

    // If no changes were made, send a message and return
    if (usernameUnchanged && imageUnchanged) {
      req.session.message = 'No changes made.';
      return res.status(200).send('No changes made.');
    }

    // Prepare update data
    const updateData = { username };

    // Delete old image if needed
    if ((removeProfileImage || profileImage) && currentUser.profileImageId) {
      await cloudinary.uploader.destroy(currentUser.profileImageId);
    }

    // if removing the image, set the profileImageUrl and profileImageId to null
    if (removeProfileImage) {
      updateData.profileImageUrl = null;
      updateData.profileImageId = null;
    } else if (profileImage) {
      const result = await cloudinary.uploader.upload(
        `data:${profileImage.mimetype};base64,${profileImage.buffer.toString('base64')}`,
        { folder: 'profile-images' }
      );
      updateData.profileImageUrl = result.secure_url;

      // Store the public ID in the database for future deletion
      updateData.profileImageId = result.public_id;
    }

    // Update the user in the database
    await userCollection.updateOne(
      { email: req.session.email },
      { $set: updateData }
    );

    // Update session data
    req.session.username = username;
    if ('profileImageUrl' in updateData) {
      req.session.profileImageUrl = updateData.profileImageUrl ?? '/icons/account_circle_black.svg';
    }

    req.session.message = 'Profile updated successfully!';
    res.status(200).send('Profile updated');
  } catch (error) {
    console.error("Error updating account:", error);
    req.session.message = 'Failed to update account.';
    res.status(500).send('Failed to update account');
  }
});

// Submit Score if user is authenticated
// This route is used to submit the score for both games
app.post("/api/score", isAuthenticated, async (req, res) => {

  // try to save the score to the database
  try {
    // Get the score, total, time taken and game type from the request body
    const { score, total, timeTaken, game } = req.body;
    // find the user in the database using the email stored in the session
    const user = await userCollection.findOne({ email: req.session.email });

    // if game is not provided, return an error
    if (!game || !["real-vs-ai", "quiz"].includes(game)) {
      return res.status(400).send("Invalid game type.");
    }

    //Format time
    const formattedTime = formatTime(Number(timeTaken));

    // insert the score into the database
    await scoresCollection.insertOne({
      userId: user._id,
      score,
      total,
      time: formattedTime,
      game,
      timestamp: new Date()
    });

    res.send("Score saved successfully.");
  } catch (error) {
    console.error("Error saving score:", error);
    res.status(500).send("Failed to save score.");
  }
});

// post rout to add a new information page
app.post("/admin/information/add", isAuthenticated, isAdmin, upload.single('image'), async (req, res) => {

  // try to add a new information page to the database
  try {
    // Get the title, slug, description and body from the request body
    const { title, slug, description, body } = req.body;

    // Validate the input using Joi
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

    // Validate the data against the schema
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

    // If a page with the same slug already exists, set an error message and redirect
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
      // try to upload the image to Cloudinary
      // uploads the image to a folder called 'information-pages'
      // If the upload fails, set an error message and redirect
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

    // Check if the insertion was successful
    if (!insertResult.acknowledged) {
      throw new Error('Database insertion failed');
    }

    // set a success message and redirect to the information page
    req.session.message = { type: 'success', text: 'Page created successfully!' };

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

// Edit Information Page Route
// This route is used to edit an existing information page
app.get("/admin/information/edit/:slug", isAuthenticated, isAdmin, async (req, res) => {

  // try to get the page from the database
  // if the page is not found, set an error message and redirect
  try {
    // Get the page from the database using the slug
    const page = await database.db(MONGODB_DATABASE)
      .collection("information")
      .findOne({ slug: req.params.slug });

    // If no page is found, set an error message and redirect
    if (!page) {
      req.session.message = { type: 'error', text: 'Page not found' };
      return res.redirect('/admin/information');
    }

    // Render the edit page with the page data
    res.render("admin-information-edit", {
      title: 'Edit Page: ' + page.title,
      page,
      message: req.session.message
    });
  } catch (error) {
    console.error("Error fetching page:", error);
    res.status(500).render("500", { title: 'Server Error' });
  }
});

// Delete Information Page Route
// This route is used to delete an existing information page
app.post("/admin/information/delete/:slug", isAuthenticated, isAdmin, async (req, res) => {

  // try to delete the page from the database
  try {
    // Delete the page from the database using the slug
    const result = await database.db(MONGODB_DATABASE)
      .collection("information")
      .deleteOne({ slug: req.params.slug });

    // If no page is found, set an error message and redirect
    // If the page is deleted, set a success message and redirect
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

// Information List Route
// This route is used to display a list of all information pages
app.get("/information", async (req, res) => {

  // try to get all the information pages from the database
  try {
    // Determine current page number; default to 1 if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Fetch paginated pages and total count from the database
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

    // Render the list view with pagination and authentication info
    res.render("information-list", {
      title: 'Information Hub',
      pages,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      isLoggedIn: req.session.authenticated || false
    });
  } catch (error) {
    console.error("Error loading information list:", error);
    res.status(500).render("500", { title: 'Server Error' });
  }
});

// Update Page Route
// This route is used to update an existing information page
app.post("/admin/information/update/:slug", isAuthenticated, isAdmin, upload.single('image'), async (req, res) => {

  // try to update the page in the database
  try {
    // Get the slug from the request parameters and the body data
    const slug = req.params.slug;
    const { title, description, body } = req.body;

    // Fetch existing page
    const existing = await database.db(MONGODB_DATABASE)
      .collection("information")
      .findOne({ slug });

    // If no page is found, set an error message and redirect
    if (!existing) {
      req.session.message = { type: 'error', text: 'Page not found.' };
      return res.redirect('/admin/information');
    }

    // Track changes
    const changes = {};
    if (title && title !== existing.title) changes.title = title;
    if (description && description !== existing.description) changes.description = description;
    if (body && body !== existing.body) changes.body = body;

    // Handle image upload
    if (req.file) {

      // try to upload the new image to Cloudinary
      // If the upload fails, set an error message and redirect
      try {
        const result = await cloudinary.uploader.upload(
          `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
          { folder: 'information-pages' }
        );
        changes.imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        req.session.message = { type: 'error', text: 'Image upload failed.' };
        return res.redirect(`/admin/information/edit/${slug}`);
      }
    }

    // No changes made
    if (Object.keys(changes).length === 0) {
      req.session.message = { type: 'error', text: 'No changes to update.' };
      return res.redirect(`/admin/information/edit/${slug}`);
    }

    changes.updatedAt = new Date();

    // Update the page in the database
    await database.db(MONGODB_DATABASE)
      .collection("information")
      .updateOne({ slug }, { $set: changes });

    // Set a success message and redirect
    req.session.message = { type: 'success', text: 'Page updated successfully.' };
    res.redirect(`/admin/information/edit/${slug}`);
  } catch (err) {
    console.error("Update error:", err);
    req.session.message = { type: 'error', text: 'Something went wrong. Please try again.' };
    res.redirect(`/admin/information/edit/${req.params.slug}`);
  }
});

// Logout
app.get("/logout", (req, res) => {

  // Destroy the session and redirect to the home page
  req.session.destroy();
  res.redirect("/");
});

// Middleware to serve static files
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


