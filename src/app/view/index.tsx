import Snabbdom = require("snabbdom-pragma");

export const pageContent = (size, editors, preview) => (
  <div attrs-class="container">
    <h2>Crosshair Generator for Surviv.io</h2>
    <div attrs-class="row">
      <div attrs-class="col s12 m9 row">
          {...editors}
      </div>
      <div attrs-class="col s12 m3 row">
        {size}
        <div attrs-class="col s12">
          {preview}
        </div>
      </div>
    </div>
  </div>
);
