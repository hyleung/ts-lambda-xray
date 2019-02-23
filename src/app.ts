import { Context, KinesisStreamEvent } from "aws-lambda";
import AWS from "aws-sdk";
import AWSXray from "aws-xray-sdk";
import pino from "pino";
import { ulid } from "ulid";
import { InvocationRequest } from "aws-sdk/clients/lambda";

const logger = pino();
const wrapped = AWSXray.captureAWS(AWS);
const dynamoClient = new wrapped.DynamoDB.DocumentClient();
const kinesisClient = new wrapped.Kinesis();
export const handler = (event: any, context: Context) => {
  const traceId = AWSXray.getSegment().trace_id;

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
        const data = {
          message: "foo",
          xray_trace_id: traceId,
          xray_segment_id: s.id
        };
        logger.info("emitted", data);
        kinesisClient
          .putRecord({
            StreamName: "ts_lambda_xray",
            PartitionKey: ulid(),
            Data: JSON.stringify(data)
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

interface XRayTraceContext {
  xray_trace_id: string;
  xray_segment_id: string;
}
export const kinesisHandler = (event: KinesisStreamEvent, context: Context) => {
  logger.info("kinesis event received", { ...event, ...context });
  for (const record of event.Records) {
    const stringData = Buffer.from(record.kinesis.data, "base64").toString();
    const data: XRayTraceContext = JSON.parse(stringData);
    const seg = new AWSXray.Segment(
      context.functionName,
      data.xray_trace_id,
      data.xray_segment_id
    );
    AWSXray.setSegment(seg);
    logger.info("received", data);
    const params: InvocationRequest = {
      FunctionName: "ts-lambda-invoke",
      Payload: stringData
    };
    const client = AWSXray.captureAWSClient(new AWS.Lambda());
    client
      .invoke(params)
      .promise()
      .then(r => {
        logger.info("done!", r);
        AWSXray.getSegment().close();
      })
      .catch(e => AWSXray.getSegment().close(e));
  }
};

// plain old handler
export const lambdaHandler = (event: any, _context: Context) => {
  logger.info("received", event);
};
