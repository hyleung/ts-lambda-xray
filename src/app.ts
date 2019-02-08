import { Context } from "aws-lambda";
import pino from "pino";

const logger = pino();
export const handler = (event: any, context: Context) => {
  logger.info("event received", { ...event, ...context });
};
