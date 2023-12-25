/* ========================================================
	File Description: This file contains helper functions to
	parse the day of month part of the cron expression.
	======================================================== */

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

    explanation += dayOfMonthParser(expItem);
  });

  return explanation;
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
    if (frequency > 31) throw "Invalid day of month step frequency";
  }

  start = parseInt(start);
  end = parseInt(end);

  if (start < 0 || start > 31)
    throw "Invalid start value specified in day of month expression";
  if (end < 0 || end > 31)
    throw "Invalid end value specified in day of month expression";
  if (start > end)
    throw "Start value should be less than end in day of month expression";

  if (frequency !== null)
    return `every ${frequency} days between day ${start} and ${end} of the month`;

  return `between ${start} and ${end} of the month`;
}

function parseStep(expression) {
  if (!expression.includes("/")) {
    return null;
  }

  let [start, frequency] = expression.split("/");
  frequency = parseInt(frequency);

  if (frequency < 0) throw "Negative values are not allowed";
  if (frequency > 31) throw "Invalid day of month step frequency";
  if (start === "1" || start === "*") return `every ${frequency} days`;

  start = parseInt(start);
  if (start <= 0 || start > 31)
    throw "Invalid value specified in day of month expression";

  return `every ${frequency} days starting on day ${start} of the month`;
}

function dayOfMonthParser(expression) {
  var explanation =
    parseCommaSeparated(expression) ||
    parseRange(expression) ||
    parseStep(expression);

  if (explanation === null) {
    expression = parseInt(expression);
    if (expression <= 0 || expression > 31)
      throw "Invalid value specified in day of month expression";
    explanation = `on day ${expression} of the month`;
  }

  return explanation;
}

module.exports = dayOfMonthParser;
