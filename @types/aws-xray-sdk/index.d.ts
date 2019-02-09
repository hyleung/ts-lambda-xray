declare module "aws-xray-sdk" {
  import AWS from "aws-sdk";
  export function captureAWSClient<T>(client: T): T;
  export function captureAWS<T>(sdk: T): T;
}
