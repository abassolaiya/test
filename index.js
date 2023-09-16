const axios = require("axios");
const TurndownService = require("turndown");
const mongoose = require("mongoose");
const express = require("express");
const cron = require("node-cron");

const app = express();

const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB, {
  serverSelectionTimeoutMS: 5000,
});

function addFriggingToConcepts(sentence) {
  // Regular expression to find determiners (e.g., "the", "a", "an")
  const determinerRegex = /\b(a|an|the)\b/gi;
  
  sentence = sentence.replace(determinerRegex, "$& frigging");

  return sentence;
}

const articleSchema = new mongoose.Schema({
  title: String,
  content: String,
  dateAccessed: Date,
});

const Article = mongoose.model("Article", articleSchema);

async function fetchAndStoreFeaturedArticlesForDate(date) {
  try {
    // Format the date as yyyy/mm/dd
    const formattedDate = date.toISOString().split("T")[0].replace(/-/g, "/");
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/feed/featured/${formattedDate}`;

    const response = await axios.get(apiUrl);
    const articlesData = response.data;
    // console.log(articlesData)

    const featuredArticlesObj = articlesData;

    for (const articles in featuredArticlesObj) {
      const articleData = featuredArticlesObj[articles];
      // console.log(articles);
      if (articles === 'tfa'){
        const title = articleData.title;
        // console.log(title);

        const extract = articleData.extract || "";

        const paragraphs = extract.split("\n");
        const firstParagraph = paragraphs[0];
        // console.log(firstParagraph);

        const modifiedContent = addFriggingToConcepts(firstParagraph);
        console.log(modifiedContent)

        const newArticle = new Article({
          title: title,
          content: modifiedContent,
          dateAccessed: new Date(),
        });

        await saveArticleToDatabase(newArticle);

        console.log("Article saved:", title);

        
      }
      if (articles === 'mostread') {
        x= articleData["articles"].length
        y= articleData["articles"]
        console.log(x)
        // console.log(y)
        for (let i = 0; i < x; i++) {
          const title = y[i].title;
          console.log(title);

          const extract = y[i].extract || "";
          console.log(extract)

          const paragraphs = extract.split("\n");
          const firstParagraph = paragraphs[0];
          // console.log(firstParagraph);

          const modifiedContent = addFriggingToConcepts(firstParagraph);
          console.log(modifiedContent)

          const newArticle = new Article({
            title: title,
            content: modifiedContent,
            dateAccessed: new Date(),
          });

          await saveArticleToDatabase(newArticle);

          console.log("Article saved:", title);

        }
      }

    }
  } catch (error) {
    console.error("Error fetching and storing articles:", error);
  }
}

async function saveArticleToDatabase(newArticle) {
  try {
    await newArticle.save();
  } catch (error) {
    console.error("Error fetching and storing article:", error);
  }
}

// Schedule the task to run once a day, e.g., at midnight
cron.schedule('0 0 * * *', () => {
  const today = new Date();
  fetchAndStoreFeaturedArticlesForDate(today);
});

app.get("/articles", async (req, res) => {
  try {
    const articles = await Article.find({}, "title dateAccessed content").sort(
      "-dateAccessed"
    );
    res.json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
