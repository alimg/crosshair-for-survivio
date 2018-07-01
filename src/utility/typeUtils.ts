export type SourcesType<T> = T extends (sources: infer SourcesArg, ...rest: any[]) => any ? SourcesArg : any;
