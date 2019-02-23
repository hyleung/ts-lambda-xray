declare module "aws-xray-sdk" {
  import AWS from "aws-sdk";
  export class Segment {
    constructor(name: string, rootId?: string, parentId?: string);
    // Getters
    trace_id(): string;
    id(): string;
    addAnnotation(key: string, value: boolean | number | string): void;
    addError(err: Error | string, remote?: boolean): void;
    addErrorFlag(): void;
    addFaultFlag(): void;
    addIncomingRequestData(data: IncomingRequestData): void;
    addMetadata(
      key: string,
      value: object | undefined,
      namespace?: string
    ): void;
    addNewSubsegment(name: string): Subsegment;
    addPluginData(data: object): void;
    addSubsegment(subsegment: Subsegment): void;
    addThrottleFlag(): void;
    close(err?: Error | string, remote?: boolean): void;
    decrementCounter(): void;
    flush(): void;
    incrementCounter(additional?: number): void;
    isClosed(): boolean;
    removeSubsegment(): void;
    setSDKData(data: object): void;
    setServiceData(data: object): void;
  }

  export class Subsegment extends Segment {
    constructor(name: string);
    addAttribute(name: string, data: object): void;
    addPrecursorId(id: string): void;
  }

  export class IncomingRequestData {
    constructor(req: any);
    close(res: any): void;
  }

  export function captureAWS<T>(sdk: T): T;
  export function captureAWSClient<T>(client: T): T;
  export function captureFunc<T>(
    name: string,
    fcn: () => void,
    parent?: Segment | Subsegment
  ): void;
  export function captureAsyncFunc(
    name: string,
    fcn: (segment: Subsegment) => void,
    parent?: Segment | Subsegment
  ): void;
  export function capturePromise(): void;
  export function enableAutomaticMode(): void;
  export function enableManualMode(): void;
  export function getSegment(): Segment | Subsegment;
}
