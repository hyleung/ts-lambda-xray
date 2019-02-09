import { Context, KinesisStreamEvent } from "aws-lambda";
import AWS from "aws-sdk";
import AWSXray from "aws-xray-sdk";
import pino from "pino";
import { ulid } from "ulid";

const logger = pino();
const wrapped = AWSXray.captureAWS(AWS);
const dynamoClient = new wrapped.DynamoDB.DocumentClient();
const kinesisClient = new wrapped.Kinesis();
export const handler = (event: any, context: Context) => {
  logger.info("event received", { ...event, ...context });
  dynamoClient
    .put({
      TableName: "ts-lambda-xray",
      Item: { key: ulid(), payload: event }
    })
    .promise()
    .then(r => {
      logger.info("persisted", r);
      kinesisClient
        .putRecord({
          StreamName: "ts_lambda_xray",
          PartitionKey: ulid(),
          Data: "foo"
        })
        .promise()
        .then(kr => logger.info("published", kr))
        .catch(er => logger.error(er));
    })
    .catch(e => logger.error(e));
};

export const kinesisHandler = (event: KinesisStreamEvent, context: Context) => {
  logger.info("kinesis event received", { ...event, ...context });
};
