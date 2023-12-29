/* ================================================================
Scheduler service program handling periodic scan of AWS DynamoDB,
scheduled posting of tweets to Twitter, and updating DynamoDB
================================================================ */

require("dotenv").config();
const AWS = require("aws-sdk");
AWS.config.update({ region: "ap-south-1" });

const SQS = new AWS.SQS({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const DynamoDB = new AWS.DynamoDB({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function UpdateItemPostedOnDynamoDB(itemId) {
  const params = {
    TableName: "Tweets",
    Key: {
      tweetId: { S: itemId },
    },
    UpdateExpression: "set PostedOn = :postedOn",
    ExpressionAttributeValues: {
      ":postedOn": { N: new Date().getTime().toString() },
    },
  };

  try {
    const data = await DynamoDB.updateItem(params).promise();
    console.log("DynamoDB entry updated successfully", data);
  } catch (err) {
    console.error("Error while updating DynamoDB entry", err);
  }
}

var startKey = undefined;

async function worker() {
  while (true) {
    const params = {
      TableName: "Tweets",
      FilterExpression:
        "attribute_not_exists(PostedOn) AND #ts <= :currentTime",
      ExpressionAttributeNames: {
        "#ts": "timestamp",
      },
      ExpressionAttributeValues: {
        ":currentTime": { N: new Date().getTime().toString() },
      },
      Limit: 10,
      ExclusiveStartKey: startKey,
    };

    try {
      const data = await DynamoDB.scan(params).promise();
      startKey = data.LastEvaluatedKey; // Set the start key for the next scan
      for (const item of data.Items) {
        const params = {
          MessageBody: JSON.stringify({
            tweet: item.tweetBody.S,
            token: item.token.S,
          }),
          QueueUrl:
            "https://sqs.ap-south-1.amazonaws.com/044925836749/SocialMediaChallenge.fifo",
          MessageDeduplicationId: "TheWhistler", // Required for FIFO queues
          MessageGroupId: "POST", // Required for FIFO queues
        };

        const data = await SQS.sendMessage(params).promise();
        console.log("Message Queued Successfully", data);
        await UpdateItemPostedOnDynamoDB(item.tweetId.S); // Update DynamoDB entry
      }
    } catch (err) {
      console.error("Error while consuming messages from SQS", err);
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds
      continue;
    }
  }
}

console.log("Scheduler is up and running");
worker();
