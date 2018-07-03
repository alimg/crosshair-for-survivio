import { DOMSource, VNode } from "@cycle/dom";
import { HTTPSource, RequestOptions } from "@cycle/http";
import { pageContent } from "app/view";
import ColorEditor from "app/view/ColorEditor";
import CrosshairPreview from "app/view/CrosshairPreview";
import Slider from "app/view/Slider";
import isolate from "utility/isolate";
import { errorResponse } from "utility/stream";
import xs, { Stream } from "xstream";
import { defaultState } from "./model";
import { parseSVGProps, SVGEditableProps } from "./view/SvgElement";

type EditorSinks = {
  DOM: Stream<VNode>
  valueReducer$: Stream<(state: SVGEditableProps) => any>
};

function capFirstLetter(str: string) {
  return str.replace(/^\w/, (c) => c.toUpperCase());
}

function buildEditors(DOM: DOMSource, svgProps: SVGEditableProps) {
  const editors: EditorSinks[] = [];
  const sizeEditorSinks = isolate(Slider, "size-slider")({
    DOM,
    props$: xs.of({
      label: "Size",
      defaultValue: svgProps.size,
      min: 1,
      max: 128
    }).remember()
  });
  editors.push({
    DOM: sizeEditorSinks.DOM,
    valueReducer$: sizeEditorSinks.value$.map((value) =>
      (state: SVGEditableProps) => Object.assign(state, ({size: value})))
  });
  Object.keys(svgProps.paths).forEach((selector) => {
    const path = svgProps.paths[selector];
    for (const colorEditable of ["fill", "stroke"]) {
      const style: string = path.style[colorEditable];
      if (style === undefined) {
        continue;
      }
      const sinks = isolate(ColorEditor, `color_${selector}-${colorEditable}`)({
        DOM,
        props$: xs.of({ label: capFirstLetter(`${path.name} ${colorEditable} Color`), defaultValue: style }).remember()
      });
      editors.push({
        DOM: sinks.DOM,
        valueReducer$: sinks.value$.map((value) =>
          (state: SVGEditableProps) => {
            state.paths[selector] = state.paths[selector] || {...path};
            state.paths[selector].style = Object.assign(state.paths[selector].style || {}, {[colorEditable]: value});
            return state;
          })
      });
    }
  });
  return {editors, initalProps: svgProps};
}

export function main({DOM, HTTP}: {DOM: DOMSource, HTTP: HTTPSource}) {
  const svgResponse$ = HTTP.select("crosshair-svg")
    .map((e) => errorResponse(e))
    .flatten();
  svgResponse$.filter((e) => e.httpError).addListener({next: console.log});
  const svgSelect$ = xs.create<string>();
  const svg$ = xs.merge(svgResponse$.map((e) => e.text), svgSelect$).remember();
  const editors$ = svg$.map(parseSVGProps)
    .map((svgProps) => buildEditors(DOM, svgProps));
  const previewSinks = CrosshairPreview({
    DOM,
    props$: editors$.map(({editors, initalProps}) => xs.merge(...editors.map((editor) => editor.valueReducer$))
      .fold((state, reducer) => reducer(state), initalProps)).flatten(),
    svg$
  });
  svgSelect$.imitate(previewSinks.svgSelect$);
  const svgUrl$ = xs.of(defaultState.svgProps.svgUrl);
  return {
    DOM: view(),
    HTTP: svgUrl$.map((svgUrl) => ({
      url: svgUrl,
      method: "get",
      category: "crosshair-svg"
    } as RequestOptions))
  };
  function view() {
    const previewDOM$ = previewSinks.DOM;
    const editorsDOM$ = editors$.map(({editors}) =>
      xs.combine(...editors.map((editor) => editor.DOM)) as Stream<VNode[]>).flatten();
    return xs.combine(
        editorsDOM$,
        previewDOM$)
      .map(([[size, ...colorEditors], previewDOM]) => pageContent(size, colorEditors, previewDOM));
  }
}
