import { RequestOptions, Response, ResponseStream } from "@cycle/http";
import xs, { MemoryStream, Stream } from "xstream";

export type RequestOrError = Response & { httpError: any };
export type ResponseMemoryStream = MemoryStream<RequestOrError> & ResponseStream;

export function errorResponse(response$: MemoryStream<Response> & ResponseStream): MemoryStream<RequestOrError> {
  return response$.replaceError((error): MemoryStream<Response> => {
    const stream = xs.of(
      {httpError: error, request: response$.request} as Partial<Response>).remember();
    (stream as ResponseMemoryStream).request = response$.request;
    return stream as MemoryStream<Response>;
  }) as MemoryStream<RequestOrError>;
}
