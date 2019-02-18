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
  AWSXray.captureAsyncFunc("handler", s => {
    const itemId = ulid();
    s.addAnnotation("requestId", context.awsRequestId);
    s.addAnnotation("itemId", itemId);
    dynamoClient
      .put({
        TableName: "ts-lambda-xray",
        Item: { key: itemId, payload: event }
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
          .then(kr => {
            logger.info("published", kr);
            s.close();
          });
      })
      .catch(e => {
        logger.error(e);
        s.close(e);
      });
  });
};

export const kinesisHandler = (event: KinesisStreamEvent, context: Context) => {
  logger.info("kinesis event received", { ...event, ...context });
};
