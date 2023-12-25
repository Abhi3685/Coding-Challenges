/* ========================================================
	File Description: This file contains helper functions to
	parse the month part of the cron expression.
	======================================================== */

const validDayOfMonthValues = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
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

    explanation += monthParser(expItem);
  });

  return explanation;
}

function convertMonthToName(month) {
  switch (month) {
    case 1:
      return "January";
    case 2:
      return "February";
    case 3:
      return "March";
    case 4:
      return "April";
    case 5:
      return "May";
    case 6:
      return "June";
    case 7:
      return "July";
    case 8:
      return "August";
    case 9:
      return "September";
    case 10:
      return "October";
    case 11:
      return "November";
    case 12:
      return "December";
    default:
      throw "Invalid month specified";
  }
}

function convertNameToMonth(name) {
  switch (name) {
    case "JAN":
      return "1";
    case "FEB":
      return "2";
    case "MAR":
      return "3";
    case "APR":
      return "4";
    case "MAY":
      return "5";
    case "JUN":
      return "6";
    case "JUL":
      return "7";
    case "AUG":
      return "8";
    case "SEP":
      return "9";
    case "OCT":
      return "10";
    case "NOV":
      return "11";
    case "DEC":
      return "12";
    default:
      throw "Invalid month specified";
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
    if (frequency > 12) throw "Invalid month step frequency";
  }

  if (validDayOfMonthValues.indexOf(start) !== -1)
    start = convertNameToMonth(start);

  if (validDayOfMonthValues.indexOf(end) !== -1) end = convertNameToMonth(end);

  start = parseInt(start);
  end = parseInt(end);

  if (start < 0 || start > 12)
    throw "Invalid start value specified in month expression";
  if (end < 0 || end > 12)
    throw "Invalid end value specified in month expression";
  if (start > end)
    throw "Start value should be less than end in month expression";

  const startMonth = convertMonthToName(start);
  const endMonth = convertMonthToName(end);

  if (frequency !== null)
    return `every ${frequency} months, ${startMonth} through ${endMonth}`;

  return `${startMonth} through ${endMonth}`;
}

function parseStep(expression) {
  if (!expression.includes("/")) {
    return null;
  }

  let [start, frequency] = expression.split("/");
  frequency = parseInt(frequency);

  if (frequency < 0) throw "Negative values are not allowed";
  if (frequency > 12) throw "Invalid month step frequency";

  if (validDayOfMonthValues.indexOf(start) !== -1) {
    start = convertNameToMonth(start);
  }

  if (start === "1" || start === "*") return `every ${frequency} months`;

  start = parseInt(start);
  if (start <= 0 || start > 12)
    throw "Invalid value specified in month expression";

  const month = convertMonthToName(start);
  return `every ${frequency} months, ${month} through December`;
}

function monthParser(expression) {
  var explanation =
    parseCommaSeparated(expression) ||
    parseRange(expression) ||
    parseStep(expression);

  if (explanation === null) {
    if (validDayOfMonthValues.indexOf(expression) !== -1) {
      expression = convertNameToMonth(expression);
    }

    expression = parseInt(expression);

    if (expression <= 0 || expression > 12)
      throw "Invalid value specified in month expression";

    explanation = `in ${convertMonthToName(expression)}`;
  }

  return explanation;
}

module.exports = monthParser;
