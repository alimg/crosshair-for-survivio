import { DOMSource } from "@cycle/dom";
import { HTTPSource } from "@cycle/http";
import { pageContent } from "app/view";
import ColorEditor, { ColorEditorSinks } from "app/view/ColorEditor";
import CrosshairPreview from "app/view/CrosshairPreview";
import Slider from "app/view/Slider";
import isolate from "utility/isolate";
import xs from "xstream";
import { defaultState, IState, ISVGProps } from "./model";

export function main({DOM, HTTP}: {DOM: DOMSource, HTTP: HTTPSource}) {
  const isolateColorEditor = isolate(ColorEditor);
  const isolateSlider = isolate(Slider);
  const state$ = xs.of<IState>(defaultState).remember();
  const svgProps$ = state$.map((state) => state.svgProps);
  const editors = {
    size: isolateSlider({
      DOM,
      Props: state$.map((state) => ({
        label: "Size",
        defaultValue: state.size,
        min: 1,
        max: 128
      })).remember()
    }),
    crossFill: isolate(ColorEditor, "crossFill")({
      DOM, Props: svgProps$.map((props) => ({ label: "Cross Fill Color", defaultValue: props.crossFill }))
    }),
    crossOutline: isolate(ColorEditor, "crossOutline")({
      DOM, Props: svgProps$.map((props) => ({ label: "Cross Outline Color", defaultValue: props.crossOutline }))
    }),
    ringFill: isolate(ColorEditor, "ringFill")({
      DOM, Props: svgProps$.map((props) => ({ label: "Ring Fill Color", defaultValue: props.ringFill }))
    }),
    ringOutline: isolate(ColorEditor, "ringOutline")({
      DOM, Props: svgProps$.map((props) => ({ label: "Ring Outline Color", defaultValue: props.ringOutline }))
    })
  };
  const preview = CrosshairPreview({
    DOM,
    HTTP,
    props$: xs.merge(...Object.keys(editors)
      .map((name: keyof ISVGProps) => editors[name].value$.map((value) => ({ name, value })))
    ),
    svgUrl$: xs.of(defaultState.svgProps.svgUrl)
  });
  return {
    DOM: view(),
    HTTP: preview.HTTP
  };
  function view() {
    return xs.combine(
          xs.combine(editors.size.DOM, editors.crossFill.DOM, editors.crossOutline.DOM,
            editors.ringFill.DOM, editors.ringOutline.DOM),
          preview.DOM)
        .map(([[size, ...colorEditors], previewDOM]) => pageContent(size, colorEditors, previewDOM));
  }
}
