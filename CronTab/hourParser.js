/* ========================================================
	File Description: This file contains helper functions to
	parse the hour part of the cron expression.
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

    explanation += hourParser(expItem);
  });

  return explanation;
}

function convertTo12HourFormat(time) {
  let period = "AM";

  if (time > 12) {
    time -= 12;
    period = "PM";
  } else if (time === 0) {
    time = 12;
  } else if (time === 12) {
    period = "PM";
  }

  return [time, period];
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
    if (frequency > 23) throw "Invalid hour step frequency";
  }

  start = parseInt(start);
  end = parseInt(end);

  if (start < 0 || start > 23)
    throw "Invalid start value specified in hour expression";
  if (end < 0 || end > 23)
    throw "Invalid end value specified in hour expression";
  if (start > end)
    throw "Start value should be less than end in hour expression";

  const [startHour, startAM] = convertTo12HourFormat(start);
  const [endHour, endAM] = convertTo12HourFormat(end);

  if (frequency !== null)
    return `every ${frequency} hours between ${startHour}:00 ${startAM} and ${endHour}:59 ${endAM}`;

  return `between ${startHour}:00 ${startAM} and ${endHour}:59 ${endAM}`;
}

function parseStep(expression) {
  if (!expression.includes("/")) {
    return null;
  }

  let [every, frequency] = expression.split("/");
  frequency = parseInt(frequency);

  if (frequency < 0) throw "Negative values are not allowed";
  if (frequency > 23) throw "Invalid hour step frequency";
  if (every === "0" || every === "*") return `every ${frequency} hours`;

  every = parseInt(every);
  if (every < 0 || every > 23)
    throw "Invalid value specified in hour expression";

  const [everyHour, everyAM] = convertTo12HourFormat(every);

  return `every ${frequency} hours starting at ${everyHour}:00 ${everyAM}`;
}

function hourParser(expression) {
  var explanation =
    parseCommaSeparated(expression) ||
    parseRange(expression) ||
    parseStep(expression);

  if (explanation === null) {
    expression = parseInt(expression);
    if (expression < 0 || expression > 23)
      throw "Invalid value specified in hour expression";
    
    const [hour, am] = convertTo12HourFormat(expression);
    explanation = `through ${hour} ${am} hour`;
  }

  return explanation;
}

module.exports = hourParser;
