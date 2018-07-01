import { DOMSource, VNode } from "@cycle/dom";
import isolate from "@cycle/isolate";
import ColorPicker from "cycle-color-picker";
import Snabbdom = require("snabbdom-pragma");
import xs, { Stream } from "xstream";

type ColorPickerSinks = {
  DOM: Stream<VNode>,
  color$: Stream<string>
};

export type ColorEditorSinks = ReturnType<typeof ColorEditor>;
export type ColorEditorSources = {
  DOM: DOMSource,
  Props: Stream<{defaultValue: string, label: string}>
};

export default function ColorEditor({DOM, Props}: ColorEditorSources) {
  const colorPicker: ColorPickerSinks = ColorPicker(
    {DOM, props$: Props.map(({defaultValue}) => ({color: defaultValue}))});
  const value$ = xs.merge(colorPicker.color$, Props.map(({defaultValue}) => defaultValue)).remember();
  const togglepicker$ = xs.merge(
    DOM.select(".color-text").events("click", {preventDefault: true})
      .map((e) => e.stopPropagation())
      .mapTo(true),
    DOM.select("document").events("mousedown")
      .mapTo(false)
  ).fold((state, shouldOpen) => !state && shouldOpen, false);
  const state$ = xs.combine(value$, togglepicker$).map(([color, toggle]) => ({color, toggle}));

  /* hack to apply stopPropagation for closing the popup only when clicked outside*/
  DOM.select(".picker-popup")
    .events("mousedown")
    .addListener({next: (e) => e.stopPropagation()});

  return {
    DOM: view(),
    value$
  };

  function view() {
    return xs.combine(state$ , Props).map(([{color, toggle}, {label}]) => colorPicker.DOM.map((colorPickerDom) => (
      <div attrs-class="col m12 l6">
        <div attrs-class="card brown lighten-5">
          <div attrs-class="card-content">
            <span attrs-class="card-title">{label}</span>
            <div style={{"background-color": color}} attrs-class="color-text">
              <span><i attrs-class="tiny material-icons">color_lens</i> {color}</span>
            </div>
            {toggle ? <div attrs-class="picker-popup">{colorPickerDom}</div> : ""}
          </div>
        </div>
      </div>
    ))).flatten();
  }
}
