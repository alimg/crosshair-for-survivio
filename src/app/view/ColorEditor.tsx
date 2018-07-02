import { DOMSource, VNode } from "@cycle/dom";
import isolate from "@cycle/isolate";
import ColorPicker from "cycle-color-picker";
import Snabbdom = require("snabbdom-pragma");
import xs, { Stream } from "xstream";
import Popup from "./Popup";

type ColorPickerSinks = {
  DOM: Stream<VNode>,
  color$: Stream<string>
};

export type ColorEditorSinks = ReturnType<typeof ColorEditor>;
export type ColorEditorSources = {
  DOM: DOMSource,
  props$: Stream<{defaultValue: string, label: string}>
};

export default function ColorEditor({DOM, props$}: ColorEditorSources) {
  const colorPicker: ColorPickerSinks = isolate(ColorPicker)(
    {DOM, props$: props$.map(({defaultValue}) => ({color: defaultValue}))});
  const value$ = xs.merge(colorPicker.color$, props$.map(({defaultValue}) => defaultValue)).remember();

  const togglepicker$ = xs.merge(
    DOM.select(".color-text").events("click")
      .mapTo(true),
    DOM.select("document").events("mousedown")
      .mapTo(false)
  ).fold((state, shouldOpen) => !state && shouldOpen, false);
  const state$ = xs.combine(value$, togglepicker$).map(([color, toggle]) => ({color, toggle}));

  return {
    DOM: view(),
    value$
  };

  function view() {
    return xs.combine(state$ , props$).map(([{color, toggle}, {label}]) => colorPicker.DOM.map((colorPickerDom) => (
      <div attrs-class="col m12 l6">
        <div attrs-class="card brown lighten-5">
          <div attrs-class="card-content">
            <span attrs-class="card-title">{label}</span>
            <div style={{"background-color": color}} attrs-class="color-text">
              <span><i attrs-class="tiny material-icons">color_lens</i> {color}</span>
            </div>
            {toggle ? <Popup inline>{colorPickerDom}</Popup> : ""}
          </div>
        </div>
      </div>
    ))).flatten();
  }
}
