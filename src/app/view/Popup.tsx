import Snabbdom = require("snabbdom-pragma");

export default function Popup(props, children) {
  const className = props.inline ? "inline-popup" : "popup";
  return (
    <div attrs-class={`${className} ${props.class}`} props={{onmousedown: (e) => e.stopPropagation()}}>
      {...children}
    </div>
  );
}
