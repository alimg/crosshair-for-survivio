import { makeDOMDriver } from "@cycle/dom";
import { makeHTTPDriver } from "@cycle/http";
import { run } from "@cycle/run";
import { main } from "app/app";

run(main, {
  DOM: makeDOMDriver("#main-content"),
  HTTP: makeHTTPDriver()
});
