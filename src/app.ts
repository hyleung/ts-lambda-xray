import { Context } from "aws-lambda";
import AWS from "aws-sdk";
import pino from "pino";
import { ulid } from "ulid";

const logger = pino();
const dynamoClient = new AWS.DynamoDB.DocumentClient();
export const handler = (event: any, context: Context) => {
  logger.info("event received", { ...event, ...context });
  dynamoClient
    .put({
      TableName: "ts-lambda-xray",
      Item: { key: ulid(), payload: event }
    })
    .promise()
    .then(r => logger.info("persisted", r))
    .catch(e => logger.error(e));
};
