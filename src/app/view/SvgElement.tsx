import { VNode } from "@cycle/dom";
import Snabbdom = require("snabbdom-pragma");

export type SVGEditableProps = {
  size: number
  paths: {
    [selector: string]: {
      name: string
      style: Partial<CSSStyleDeclaration>
    }
  }
};

export function SVG({svg, props}: {svg: string, props: SVGEditableProps}) {
  function updateSVG(oldVnode: VNode, vnode: VNode) {
    const elm = vnode.elm as Element;
    const oldSVG = oldVnode.data.svg;
    if (oldSVG !== svg) {
      elm.innerHTML = svg;
    }
    vnode.data.svg = svg;
    const svgElm = elm.querySelector("svg");
    if (!svg) {
      console.log("error: failed to find <svg> tag");
      return;
    }
    svgElm.setAttribute("width", String(props.size));
    svgElm.setAttribute("height", String(props.size));
    Object.keys(props.paths).forEach((selector) => {
      const paths = Array.from<HTMLElement>(svgElm.querySelectorAll(selector));
      paths.forEach((path) => {
        Object.assign(path.style, props.paths[selector].style);
      });
    });
  }
  return <div id="crosshair-svg" hook={{
    create: updateSVG,
    update: updateSVG
  }}/>;
}

export function parseSVGProps(svgData: string) {
  const divElm = document.createElement("div");
  divElm.innerHTML = svgData;
  const props: SVGEditableProps = {
    size: Number(divElm.querySelector("svg").getAttribute("width")),
    paths: {}
  };
  for (const elm of Array.from<HTMLElement>(divElm.querySelectorAll("g > *"))) {
    if (!elm.id) {
      continue;
    }
    props.paths[`#${elm.id}`] = {
      name: elm.id,
      style: {
        fill: elm.style.fill,
        stroke: elm.style.stroke
      }
    };
  }
  return props;
}
