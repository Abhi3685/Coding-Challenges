/* ================================================================
Consumer service program handling message consumption from AWS SQS,
posting tweets to Twitter, and deleting messages from SQS
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

const params = {
  MaxNumberOfMessages: 1,
  QueueUrl:
    "https://sqs.ap-south-1.amazonaws.com/044925836749/SocialMediaChallenge.fifo",
  VisibilityTimeout: 60, // 1 min wait time for anyone else to process.
  WaitTimeSeconds: 5,
};

async function worker() {
  while (true) {
    try {
      const data = await SQS.receiveMessage(params).promise();

      if (!data) {
        throw new Error("Failed to receive message from SQS", err);
      }

      if (data.Messages.length == 0) {
        throw new Error("No messages received from SQS");
      }

      const response = await fetch(`${process.env.DEPLOYMENT_URL}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(JSON.parse(data.Messages[0].Body)),
      });

      if (!response.ok) {
        throw new Error("Failed to tweet message", res);
      }

      const res = await response.json();
      console.log("Tweet posted successfully", res.data);

      // delete the message from queue
      const deleteParams = {
        QueueUrl:
          "https://sqs.ap-south-1.amazonaws.com/044925836749/SocialMediaChallenge.fifo",
        ReceiptHandle: data.Messages[0].ReceiptHandle,
      };

      const deleteData = await SQS.deleteMessage(deleteParams).promise();
      console.log("Message Deleted from SQS", deleteData);
    } catch (err) {
      console.error("Failed to receive message from SQS", err);
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds
    }
  }
}

console.log("Consumer is up and running!");
worker();
