
export interface IState {
  size: number;
  svgProps: ISVGProps;
}

export interface ISVGProps {
  svgUrl: string;
  crossFill: string;
  crossOutline: string;
  ringFill: string;
  ringOutline: string;
}

export const defaultState: IState = {
  size: 64,
  svgProps: {
    svgUrl: "./crosshair.svg",
    crossFill: "rgb(0, 0, 0)",
    crossOutline: "rgba(255, 255, 255, 0.2)",
    ringFill: "rgba(209, 83, 19, 0.6)",
    ringOutline: "rgba(128, 0, 0, 0.6)"
  }
};
