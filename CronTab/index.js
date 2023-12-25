const express = require("express");
const app = express();

const minuteParser = require("./minuteParser");
const hourParser = require("./hourParser");
const dayOfMonthParser = require("./dayOfMonthParser");
const monthParser = require("./monthParser");
const dayOfWeekParser = require("./dayOfWeekParser");

const testcases = [
  "*/15 * * * *",
  "0 0 * * 1-5",
  "30 2,14 * * 0,3,6",
  "0 12 1 */2 *",
  "0 0 * * SUN",
  "15,30 9-17 * * MON-FRI",
  "0 4 * * 1/3",
  "0 0 1,15 * *",
  "0 23 1 * 1",
  "*/10 8-17 * * *",
  "*/15,30-45 0 1,15 * 1-5",
  "0 0 1 JAN *",
];

function cronTabParser(string) {
  const cronTab = string.split(" ");
  const minute = cronTab[0];
  const hour = cronTab[1];
  const dayOfMonth = cronTab[2];
  const month = cronTab[3];
  const dayOfWeek = cronTab[4];

  let cronTabExplanation = "";

  try {
    cronTabExplanation = `${minuteParser(minute)}`;

    if (hour !== "*") cronTabExplanation += `, ${hourParser(hour)}`;
    if (dayOfMonth !== "*")
      cronTabExplanation += `, ${dayOfMonthParser(dayOfMonth)}`;
    if (month !== "*") cronTabExplanation += `, ${monthParser(month)}`;
    if (dayOfWeek !== "*")
      cronTabExplanation += `, ${dayOfWeekParser(dayOfWeek)}`;
  } catch (err) {
    console.error(err);
    return "Error: " + err;
  }

  return cronTabExplanation;
}

testcases.forEach((expression) => {
  console.log(`Cron Expression: ${expression}`);
  console.log(`Explanation: ${cronTabParser(expression)}`);
  console.log("============================");
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/decodeCron", (req, res) => {
  const data = cronTabParser(req.query.cronTab);
  if (data.startsWith("Error")) {
    return res.status(400).json({ error: data });
  }
  return res.json({ data });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
