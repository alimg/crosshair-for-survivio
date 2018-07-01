import { DOMSource, VNode } from "@cycle/dom";
import { HTTPSource, RequestOptions } from "@cycle/http";
import Snabbdom = require("snabbdom-pragma");
import { errorResponse } from "utility/stream";
import xs, { Stream } from "xstream";
import { defaultState } from "../model";

export type CrosshairPreviewSources = {
  DOM: DOMSource
  HTTP: HTTPSource
  props$: Stream<{
    name: "size",
    value: number
  } | {
    name: "crossFill" | "crossOutline" | "ringFill" | "ringOutline"
    value: string
  }>,
  svgUrl$: Stream<string>
};

function SVG({svg, props}) {
  function update(elm: SVGSVGElement) {
    elm.setAttribute("width", props.size);
    elm.setAttribute("height", props.size);
    const cross = elm.getElementById("cross") as HTMLElement;
    cross.style.fill = props.crossFill;
    cross.style.stroke = props.crossOutline;
    const ring = elm.getElementById("ring") as HTMLElement;
    ring.style.fill = props.ringFill;
    ring.style.stroke = props.ringOutline;
  }
  return <div id="crosshair-svg" hook={{
    create: (oldVnode: VNode, vnode: VNode) => {
      const elm = vnode.elm as Element;
      elm.innerHTML = svg;
      update(elm.getElementsByTagName("svg")[0] as SVGSVGElement);
    },
    update: (oldVnode: VNode, vnode: VNode) => {
      const elm = vnode.elm as Element;
      update(elm.getElementsByTagName("svg")[0] as SVGSVGElement);
    }
  }}/>;
}

function svgToPng(svg: HTMLElement) {
  return xs.create<string>({
    start: (listener) => {
      const image = new Image();
      image.onload = () => {
        const width = Number(svg.getAttribute("width"));
        const height = Number(svg.getAttribute("height"));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        const url = canvas.toDataURL("image/png");
        listener.next(`javascript:(function(){` +
          `document.querySelector("#game-area-wrapper").style.cursor = ` +
            `'url(${url}) ${width / 2} ${height / 2}, auto';` +
        `})()`);
        listener.complete();
      };
      image.src = "data:image/svg+xml," + encodeURIComponent(svg.outerHTML);
    },
    // tslint:disable-next-line:no-empty
    stop: () => {}
  });
}

export default function CrosshairPreview({DOM, HTTP, props$, svgUrl$}: CrosshairPreviewSources) {
  const svgResponse$ = HTTP.select("crosshair-svg")
    .map((e) => errorResponse(e))
    .flatten();
  svgResponse$.filter((e) => e.httpError).addListener({next: console.log});
  const crosshairLink$ = DOM.select("#crosshair-svg svg").element()
    .map((e: HTMLElement) => svgToPng(e)).flatten().startWith("").remember();
  const svg$ = svgResponse$.map((e) => e.text);
  const svgProps = props$.fold((acc, {name, value}) => {
    acc = {...acc};
    acc[name] = value;
    return acc;
  }, {...defaultState.svgProps, size: defaultState.size});
  return {
    DOM: view(),
    HTTP: svgUrl$.map((svgUrl) => ({
      url: svgUrl,
      method: "get",
      category: "crosshair-svg"
    } as RequestOptions))
  };
  function view() {
    return xs.combine(svg$, svgProps)
    .map(([svg, props]) => <SVG svg={svg} props={props}/>)
    .map((svg) => crosshairLink$.map((crosshairLink) => (
      <div attrs-class="card-panel brown lighten-5">
        {svg}
        {crosshairLink ?
        <ul>
          <h6><i attrs-class="tiny material-icons">help</i> How do I use this?</h6>
          <li>1. Drag this to your bookmark bar:<br/>
            <a attrs-class="btn red darken-3"
                href={crosshairLink}>Crosshair for Surviv.io</a>
          </li>
          <li>2. Switch the game tab</li>
          <li>3. Click the bookmark to apply the cursor</li>
          <li>Enjoy!</li>
        </ul> : ""}
        <div attrs-class="ghbtns">
          <iframe
            // tslint:disable-next-line:max-line-length
            src="https://ghbtns.com/github-btn.html?user=alimg&repo=crosshair-for-survivio&type=star&count=true&size=large"
            frameborder="0" scrolling="0" width="160px" height="30px"></iframe>
        </div>
      </div>
    ))).flatten();
  }
}
