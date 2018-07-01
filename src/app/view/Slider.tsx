import { DOMSource } from "@cycle/dom";
import Snabbdom = require("snabbdom-pragma");
import { SourcesType } from "utility/typeUtils";
import xs, { Stream } from "xstream";

export type SliderSources = {
  DOM: DOMSource,
  Props: Stream<{defaultValue: number, label: string, min: number, max: number}>
};

export default function Slider({DOM, Props}: SliderSources) {
  const value$ = xs.merge(
    xs.merge(
        DOM.select("#slider").events("change"),
        DOM.select("#slider").events("input"))
      .map((e: any) => Number(e.target.value)),
    Props.map(({defaultValue}) => defaultValue)).remember();
  return {
    DOM: view(),
    value$
  };

  function view() {
    return Props.map(({defaultValue, label, min, max}) => value$.map((value) => (
      <div attrs-class="col s12">
        <div attrs-class="card-panel brown lighten-5">
          <label>{label}</label>
          <input type="range" id="slider" min={min} max={max} value={defaultValue}/>
          <span attrs-class="helper-text">{value} px</span>
        </div>
      </div>
    ))).flatten();
  }
}
