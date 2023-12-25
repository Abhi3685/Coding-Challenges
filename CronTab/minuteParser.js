/* ========================================================
	File Description: This file contains helper functions to
	parse the minute part of the cron expression.
	======================================================== */

function parseStar(expression) {
  if (expression === "*") {
    return "Every minute";
  }

  return null;
}

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

    explanation += minuteParser(expItem);
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
    if (frequency > 59) throw "Invalid minute step frequency";
  }

  start = parseInt(start);
  end = parseInt(end);

  if (start < 0 || start > 59)
    throw "Invalid start value specified in minute expression";
  if (end < 0 || end > 59)
    throw "Invalid end value specified in minute expression";
  if (start > end)
    throw "Start value should be less than end in minute expression";

  if (frequency !== null)
    return `Every ${frequency} minutes between ${start} and ${end}`;

  return `${start} through ${end} minutes past the hour`;
}

function parseStep(expression) {
  if (!expression.includes("/")) {
    return null;
  }

  let [start, frequency] = expression.split("/");
  frequency = parseInt(frequency);

  if (frequency < 0) throw "Negative values are not allowed";
  if (frequency > 59) throw "Invalid minute step frequency";
  if (start === "0" || start === "*") return `Every ${frequency} minutes`;

	start = parseInt(start);
	if (start < 0 || start > 59)
    throw "Invalid value specified in minute expression";

  return `Every ${frequency} minutes starting at minute ${start}`;
}

function minuteParser(expression) {
  let explanation =
    parseStar(expression) ||
    parseCommaSeparated(expression) ||
    parseRange(expression) ||
    parseStep(expression);

  if (explanation === null) {
    expression = parseInt(expression);
    if (expression < 0 || expression > 59)
      throw "Invalid value specified in minute expression";
    explanation = `At ${expression} minutes past the hour`;
  }

  return explanation;
}

module.exports = minuteParser;
