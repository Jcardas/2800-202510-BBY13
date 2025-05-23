# IsThisMyGrandson.com

## Live Website

[https://isthismygrandson.onrender.com](https://isthismygrandson.onrender.com)


## One Sentence Pitch 
IsThisMyGrandson.com, a fun, engaging game that teaches kids and adults alike the dangers of online AI-driven scams.

## Project Description
Have you ever received a phone call from someone claiming to be your grandson, brother, mother, or father, only to later realize it was a scam? Scammers often impersonate loved ones to exploit your trust and emotions, attempting to deceive you into sending money or sharing sensitive information. 

Scams affect people daily through text, phone, online, and in-person interactions. With AI scams on the rise, our game educates users on identifying scams, understanding their tactics, and avoiding them.

Users can log in to compete on a leaderboard and compare scores. Our goal is to empower people with resources to protect themselves while making learning fun, accessible, and engaging.


## 🚀 Technologies Used

### Frontend
- HTML  
- CSS (Tailwind CSS)  
- JavaScript 
- EJS Templating Engine
- Google Material Icon (icon library)

### Backend
- Node.js  
- Express.js  

### Database
- MongoDB  
- connect-mongo (session store)  

### Tools / Other
- Cloudinary (image hosting)
- OpenAI Sora (Ai Image Generation)
- Adobe Firefly (Ai Image Generation)
- Render (deployment)  
- dotenv, bcrypt, Joi  
- GitHub, Trello, Discord, Notion  

---

## 📂 Project Folder Structure

```.
│   .env
│   .gitignore
│   app.js
│   databaseConnection.js
│   package-lock.json
│   package.json
│   README.md
│   sample.env
│
├───public
│   │   ai-hand.png
│   │   favicon.png
│   │   placeholder.png
│   │   real-hand.png
│   │
│   ├───css
│   │       information.css
│   │       joke.css
│   │       leaderboard.css
│   │       location_alert.css
│   │       sliding_bar.css
│   │
│   ├───icons
│   │       accessibility_white.svg
│   │       account_circle_black.svg
│   │       account_circle_white.svg
│   │       close_black.svg
│   │       light_bulb.svg
│   │       menu_black.svg
│   │       menu_white.svg
│   │       stars.svg
│   │
│   ├───img
│   │       armaan-about-us-pfp.jpg
│   │       isthismygrandson.png
│   │       justin.png
│   │       loading.svg
│   │       mohammad.jpg
│   │       mybingowinnings.png
│   │       nerd.png
│   │       no_isthismygrandsoncom.png
│   │       scammed.jpg
│   │       that-dog.jpg
│   │       thats_not_my_grandson.png
│   │       unhappy-gma.png
│   │       yes_isthismygrandsoncom.png
│   │
│   └───scripts
│           account.js
│           have-i-been-scammed.js
│           information.js
│           joke.js
│           leaderboard.js
│           location_alert.js
│           navbar.js
│           real-vs-ai-game.js
│           sliding_bar.js
│
└───views
    │   404.ejs
    │   about.ejs
    │   account.ejs
    │   admin-dashboard.ejs
    │   admin-information-edit.ejs
    │   admin-information.ejs
    │   admin-real-vs-ai.ejs
    │   admin-scam-quiz.ejs
    │   games.ejs
    │   have-i-been-scammed.ejs
    │   home.ejs
    │   information-list.ejs
    │   information.ejs
    │   leaderboard.ejs
    │   login.ejs
    │   real-vs-ai-game.ejs
    │   signup.ejs
    │
    └───partials
        │   confirmation-popup.ejs
        │   footer.ejs
        │   header.ejs
        │   location_alert.ejs
        │   navbar.ejs
        │   sliding_bar.ejs
        │
        └───games
                have-i-been-scammed-popup.ejs
                hint.ejs
                leaderboard-popup.ejs
                no-answer-popup.ejs
                real-vs-ai-popup.ejs

```

---

## ⚙️ Installation & Development Setup

### Requirements
- Node.js (v18+)
- VS Code or other IDE
- MongoDB Atlas
- Cloudinary account
- Openai account (for API)
- Render (or other deployment platform)

### Steps

1. **Clone this repo**
```bash
git clone https://github.com/your-username/isthismygrandson.git
cd isthismygrandson
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up your environment variables**
```bash
cp sample.env .env
```
Then fill in:
- `MONGODB_HOST`
- `MONGODB_USER`
- `MONGODB_PASSWORD`
- `MONGODB_DATABASE`
- `MONGODB_SESSION_SECRET`
- `NODE_SESSION_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_CLOUD_KEY`
- `CLOUDINARY_CLOUD_SECRET`
- `OPENAI_API_KEY`

4. **Run the app locally**
```bash
node app.js
```

Visit [http://localhost:3000](http://localhost:3000)

### 🧪 Testing Plan

Manual testing was conducted through gameplay interaction, admin panel usage, and database validation.  
You can view our full testing notes here:  
[📄 Testing Plan](https://docs.google.com/spreadsheets/d/1FqBHVGLRGiZJKzDiaUi3Lrp0Molhh0Xht0IpPe8psCc/edit?usp=sharing)

---

## 🌐 Using the Product

### Main Features:
- Real vs AI Game: Distinguish between real and AI-generated images
- Scam Quiz: Answer scenario-based questions to test scam awareness
- Leaderboard: See how your score ranks
- Account creation and session-based login
- Updating account (setting profile pics and updating username)
- Admin Dashboard:
  - Upload images to Cloudinary for real vs ai game
  - Upload new questions for Scam quiz game
  - Manage information pages (create, edit, delete, upload images)

---


## 🧾 Credits, References, Licenses

- Team BBY-13: Armaan, Justin, Mohammad, Grace, Ted  
- Tailwind CSS (for frontend styling)  
- EJS Templating Engine  
- Cloudinary (image hosting and delivery)  
- Render (deployment platform)  
- MongoDB Atlas (database hosting)  
- Google Material Icons (iconography)  
- OpenAI ChatGPT was used for frontend refactoring, debugging, and documentation writing support.

### 📚 References
- Express.js Official Docs – https://expressjs.com/
- MongoDB Atlas Setup Guide – https://www.mongodb.com/atlas
- Tailwind CSS Docs – https://tailwindcss.com/docs

### 📜 License
This project is currently not licensed. All rights reserved by the authors.

---

## ⚖️ AI and API Usage

- **Cloudinary API**: Used to upload and store game images and user profile pictures.
- **OpenAI API**: Used to generate scam jokes and hints for real vs ai game.
- **ipapi.co API**: Used to detect the user's city and country based on their IP address.
- **open-meteo.com API**: Used to fetch the current temperature at the user's location for homepage disclaimer.
- **ChatGPT (OpenAI)**: Used to help with:
  - Refactoring frontend JavaScript
  - Debugging EJS rendering
  - Writing clean and organized documentation

---

>## Screenshots
>
>![Homepage](https://github.com/user-attachments/assets/9c526214-a560-4064-92bd-e79dab1a9f41)
>
>![Real vs ai game leaderboard](https://github.com/user-attachments/assets/c43bf870-8c47-4c0f-b327-d69e09b5cb69)
>
>![Information hub](https://github.com/user-attachments/assets/43d50bc8-9332-4858-829e-b913b1f72109)
>
>![Information_phishing-scams-how-to-spot-and-avoid-them](https://github.com/user-attachments/assets/9cbc1322-dc34-4a3a-8b5f-97681a7cbf8b)
>
>![Have I Been Scammed game](https://github.com/user-attachments/assets/45739aaf-d9bb-4ee2-8995-2aaddaf31c87)
>
>![real vs ai game](https://github.com/user-attachments/assets/64fe4576-2e54-48e0-b39c-71df3dd826b2)

## Planned Features

- Real vs AI voice game
- Scams Guide / Resources

## 📬 Contact Information

### About us
We're BBY-13, a term 2 BCIT projects group:

- [![GitHub](https://img.shields.io/badge/GitHub-Justin%20Cardas-blue?logo=github)](https://github.com/jcardas)
- [![GitHub](https://img.shields.io/badge/GitHub-Ted%20Ip-blue?logo=github)](https://github.com/autodataai)
- [![GitHub](https://img.shields.io/badge/GitHub-Grace%20Jung-blue?logo=github)](https://github.com/gjung20)
- [![GitHub](https://img.shields.io/badge/GitHub-Mohammad%20Sadeghi-blue?logo=github)](https://github.com/Mohammad-Sadeghi23)
- [![GitHub](https://img.shields.io/badge/GitHub-Armaan%20Brar-blue?logo=github)](https://github.com/ArmaanBrar26)

<br>

**[Back to Top](#isthismygrandsoncom)**