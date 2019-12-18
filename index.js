// https://glitch.com/edit/#!/uneven-tendency



require("dotenv").config();

const express = require("express"),
  mongo = require("mongodb"),
  mongoose = require("mongoose"),
  bodyParser = require("body-parser"),
  dns = require("dns"),
  cors = require("cors"),
  app = express();

/** this project needs a db !! **/

const Urls = require("./models/Urls");

const dataBaseUrl = process.env.MONGO_ATLAS_URI;
mongoose
  .connect(dataBaseUrl, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log("Connected to DB!");
  })
  .catch(err => {
    console.log("ERROR:", err.message);
  });

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", (req, res) => {
  res.json({ greeting: "hello API" });
});

app.get("/api/shorturl/new/:shortenedUrl", async (req, res) => {
  const shortenedUrl = req.params.shortenedUrl;
  const url = await Urls.findOne({
    shortened: shortenedUrl
  });
  if (url) {
    return res.redirect(url.name);
  } else {
    return res.send({ error: "No short url found for given input" });
  }
});

app.post("/api/shorturl/new", (req, res) => {

  const enteredUrl = req.body.url;

  // ensure that entered url follows the http(s)://www.example.com(/more/routes) format
  const re = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
  if (!re.test(enteredUrl)) {
    return res.send({ error: "invalid URL" });
  } else {
    // extract hostname from valid entered url to check if it is valid through dns.lookup function, taken from - https://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
    const urlParts = /^(?:\w+\:\/\/)?([^\/]+)(.*)$/.exec(enteredUrl);
    const hostname = urlParts[1]; // www.example.com

    dns.lookup(hostname, async (err, addresses, family) => {
      // console.log(err)
      if (err) {
        console.log(err);
        return res.send({ error: "invalid URL" });
      } else {
        const existingUrl = await Urls.findOne({ name: enteredUrl }); // find entered url in database
        if (existingUrl) {
          const { name, shortened } = existingUrl;
          return res.send({ original_url: name, short_url: shortened });
        } else {
          let randomNumber;
          let existingShortUrl = true;
          do {
            randomNumber = Math.floor(Math.random() * 100000);
            existingShortUrl = await Urls.findOne({
              shortened: randomNumber
            });
          } while (existingShortUrl);

          const newUrl = new Urls({
            name: enteredUrl,
            shortened: randomNumber
          }).save((err, createdUrl) => {
            if (err) {
              console.log(err);
            } else {
              res.send({
                original_url: createdUrl.name,
                short_url: createdUrl.shortened
              });
            }
          });
        }
      }
    });
  }
});

// Basic Configuration
const port = process.env.PORT || 3002;

app.listen(port, () => {
  console.log("Node.js listening ...");
});
