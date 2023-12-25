/* ========================================================
	File Description: This file contains helper functions to
	parse the day of week part of the cron expression.
	======================================================== */

const validDayOfWeekNameValues = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];

function parseCommaSeparated(expression) {
  if (!expression.includes(",")) {
    return null;
  }

  let explanation = "";
  const expressions = expression.split(",");

  expressions.forEach((expItem, idx) => {
    if (expItem === "*") throw "Invalid cron expression";

    if (idx > 0) explanation += ", ";
    if (idx === expressions.length - 1) explanation += "and ";

    explanation += dayOfWeekParser(expItem);
  });

  return explanation;
}

function convertWeekdayToName(weekday) {
  switch (weekday) {
    case 0:
      return "Sunday";
    case 1:
      return "Monday";
    case 2:
      return "Tuesday";
    case 3:
      return "Wednesday";
    case 4:
      return "Thursday";
    case 5:
      return "Friday";
    case 6:
      return "Saturday";
  }
}

function convertNameToDayNumber(name) {
  switch (name) {
    case "SUN":
      return "0";
    case "MON":
      return "1";
    case "TUE":
      return "2";
    case "WED":
      return "3";
    case "THU":
      return "4";
    case "FRI":
      return "5";
    case "SAT":
      return "6";
  }
}

function parseRange(expression) {
  if (!expression.includes("-")) {
    return null;
  }

  let [start, end] = expression.split("-");
  let frequency = null;

  if (end.includes("/")) {
    frequency = parseInt(end.split("/")[1]);
    end = end.split("/")[0];

    if (frequency < 0) throw "Negative values are not allowed";
    if (frequency > 7) throw "Invalid day of week step frequency";
  }

  if (validDayOfWeekNameValues.indexOf(start) !== -1)
    start = convertNameToDayNumber(start);

  if (validDayOfWeekNameValues.indexOf(end) !== -1)
    end = convertNameToDayNumber(end);

  start = parseInt(start);
  end = parseInt(end);

  if (start < 0 || start >= 7)
    throw "Invalid start value specified in day of week expression";
  if (end < 0 || end >= 7)
    throw "Invalid end value specified in day of week expression";
  if (start > end)
    throw "Start value should be less than end in day of week expression";

  const startWeekDay = convertWeekdayToName(start);
  const endWeekDay = convertWeekdayToName(end);

  if (frequency !== null)
    return `every ${frequency} days of the week, ${startWeekDay} through ${endWeekDay}`;

  return `${startWeekDay} through ${endWeekDay}`;
}

function parseStep(expression) {
  if (!expression.includes("/")) {
    return null;
  }

  let [start, frequency] = expression.split("/");
  frequency = parseInt(frequency);

  if (frequency < 0) throw "Negative values are not allowed";
  if (frequency > 7) throw "Invalid day of week step frequency";

  if (validDayOfWeekNameValues.indexOf(start) !== -1) {
    start = convertNameToDayNumber(start);
  }

  if (start === "0" || start === "*")
    return `every ${frequency} days of the week`;

  start = parseInt(start);

  if (start < 0 || start >= 7)
    throw "Invalid value specified in day of week expression";

  const day = convertWeekdayToName(start);
  return `every ${frequency} days of the week, ${day} through Saturday`;
}

function dayOfWeekParser(expression) {
  let explanation =
    parseCommaSeparated(expression) ||
    parseRange(expression) ||
    parseStep(expression);

  if (explanation === null) {
    if (validDayOfWeekNameValues.indexOf(expression) !== -1) {
      expression = convertNameToDayNumber(expression);
    }

    expression = parseInt(expression);
    if (expression < 0 || expression >= 7)
      throw "Invalid value specified in day of week expression";

    explanation = `on ${convertWeekdayToName(expression)}`;
  }

  return explanation;
}

module.exports = dayOfWeekParser;
