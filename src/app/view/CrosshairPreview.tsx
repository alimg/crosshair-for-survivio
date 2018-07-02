import { DOMSource } from "@cycle/dom";
import Snabbdom = require("snabbdom-pragma");
import xs, { Stream } from "xstream";
import Popup from "./Popup";
import { SVG, SVGEditableProps } from "./SvgElement";

export type CrosshairPreviewSources = {
  DOM: DOMSource
  props$: Stream<SVGEditableProps>,
  svg$: Stream<string>
};

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

export default function CrosshairPreview({DOM, props$, svg$}: CrosshairPreviewSources) {
  const crosshairLink$ = DOM.select("#crosshair-svg svg").element()
    .map((e: HTMLElement) => svgToPng(e)).flatten().startWith("").remember();
  const showImport$ = xs.merge(
      DOM.select("#import").events("click").mapTo(true),
      DOM.select("document").events("mousedown").mapTo(false),
      svg$.mapTo(false))
    .fold((state, shouldOpen) => !state && shouldOpen, false);

  const svgSelect$ = xs.create<string>({
    // tslint:disable-next-line:no-empty
    stop() {},
    start(listener) {
      DOM.select("#svg-input").events("change")
        .map((e) => (e.target as HTMLInputElement).files[0])
        .filter((f) => !!f)
        .addListener({
          next: (f) => {
            const fr = new FileReader();
            fr.onload = () => listener.next(fr.result);
            fr.readAsText(f);
          }
        });
    }
  });
  return {
    DOM: view(),
    svgSelect$
  };
  function view() {
    return xs.combine(svg$, props$)
    .map(([svg, props]) => <SVG svg={svg} props={props}/>)
    .map((svg) => xs.combine(crosshairLink$, showImport$).map(([crosshairLink, showImport]) => (
      <div attrs-class="card-panel brown lighten-5">
        <a id="import" href="javascript:void(0)">
          <i attrs-class="tiny material-icons">cloud_upload</i> Import .svg...</a>
        {showImport ? renderImportPopup() : ""}
        {svg}
        {crosshairLink ?
        <ul>
          <h6><i attrs-class="tiny material-icons">help</i> How do I use this?</h6>
          <li>1. Drag this to your bookmark bar:<br/>
            <a attrs-class="btn red darken-3"
                href={crosshairLink}>Crosshair for Surviv.io</a>
          </li>
          <li>2. Switch to the game tab</li>
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

function renderImportPopup() {
  return (
    <Popup class="brown lighten-4">
      <div attrs-class="modal-content">
        <h4>Import from file</h4>
        <p>
          Download the sample .svg file from <a href="./crosshair.svg" attrs-download>here</a>,
          modify it then submit below.
        </p>
        <form action="#">
          <div attrs-class="file-field input-field">
            <div attrs-class="btn">
              <span>File</span>
              <input id="svg-input" type="file" accept="image/svg+xml"/>
            </div>
            <div attrs-class="file-path-wrapper">
              <input attrs-class="file-path validate" attrs-type="text"/>
            </div>
          </div>
        </form>
      </div>
    </Popup>
  );
}
