/* ================================================================
Driver service program handling user sessions, accepting new
posts from users, saving to AWS DynamoDB, trigger sending them

- node ./index.js - start driver server program
- node ./scheduler.js - start the scheduler service
- node ./consumer.js - start the consumer service
================================================================ */

const express = require("express");
const AWS = require("aws-sdk");
const cookies = require("cookie-parser");
const bodyParser = require("body-parser");
const TwitterApi = require("twitter-api-v2").default;
const { randomUUID } = require("crypto");
require("dotenv").config();

const app = express();
AWS.config.update({ region: "ap-south-1" });
app.use(cookies());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

const DynamoDB = new AWS.DynamoDB({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const authDictionary = {};
const loggedClients = {}; // Maybe a separate session store would be better?

app.get("/login", async (req, res) => {
  const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_ACCESS_KEY,
    appSecret: process.env.TWITTER_ACCESS_SECRET,
  });

  const authLink = await twitterClient.generateAuthLink(
    `${process.env.DEPLOYMENT_URL}/authCallback`,
    { linkMode: "authorize" }
  );

  authDictionary[authLink.oauth_token] = authLink.oauth_token_secret;
  res.redirect(authLink.url);
});

app.get("/authCallback", async (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;
  const oauth_token_secret = authDictionary[oauth_token];
  delete authDictionary[oauth_token];

  if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
    return res.status(400).send("You denied the app or your session expired!");
  }

  // Create client from temporary tokens to obtain the persistent tokens
  const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_ACCESS_KEY,
    appSecret: process.env.TWITTER_ACCESS_SECRET,
    accessToken: oauth_token,
    accessSecret: oauth_token_secret,
  });

  const { client: loggedClient } = await twitterClient.login(oauth_verifier);
  if (!loggedClient)
    return res.status(403).send("Invalid verifier or access tokens!");

  console.log("Logged in client for token", oauth_token, loggedClient);
  loggedClients[oauth_token] = loggedClient;
  res.setHeader("Set-Cookie", `token=${oauth_token}; HttpOnly`);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.redirect("/home");
});

app.get("/home", (req, res) => {
  if (!req.cookies.token)
    return res.status(401).json({ error: "Unauthorized" });

  res.sendFile(__dirname + "/public/index.html");
});

app.post("/tweet", async (req, res) => {
  if (!req.cookies.token)
    return res.status(401).json({ error: "Unauthorized" });

  const { tweetBody, timestamp } = req.body;
  const token = req.cookies.token;

  var params = {
    TableName: "Tweets",
    Item: {
      tweetId: { S: randomUUID() },
      tweetBody: { S: tweetBody },
      timestamp: { N: new Date(timestamp).getTime().toString() },
      token: { S: token },
    },
  };

  try {
    const data = await DynamoDB.putItem(params).promise();
    console.log("Tweet Saved Successfully");
    res.json({ id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
});

app.post("/trigger", async (req, res) => {
  const { token, tweet } = req.body;
  const client = loggedClients[token];

  if (!client)
    return res.status(403).json({ error: "Logged client not found for token" });

  const response = await client.v2.tweet(tweet);
  console.log("Tweet posted", response);

  res.json({ data: response });
});

app.get("/tweets", async (req, res) => {
  try {
    const data = await DynamoDB.scan({
      TableName: "Tweets",
    }).promise();

    // TODO: paginate the results

    res.json({ data: data.Items });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
