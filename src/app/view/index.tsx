import Snabbdom = require("snabbdom-pragma");

export const pageContent = (size, editors, preview) => (
  <div attrs-class="container">
    <div attrs-class="row">
      <h2 attrs-class="col s12 white-text">Crosshair Generator for Surviv.io</h2>
      <div attrs-class="col s12 m7 xl9 row">
          {...editors}
      </div>
      <div attrs-class="col s12 m5 xl3 row">
        {size}
        <div attrs-class="col s12">
          {preview}
        </div>
      </div>
    </div>
  </div>
);
