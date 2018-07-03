import isolate, { Component } from "@cycle/isolate";

export default function<T extends Component<So, Si>, So, Si>(component: T, scope?: string): T {
  return isolate<So, Si>(component, scope) as T;
}
