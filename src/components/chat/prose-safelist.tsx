import React from "react";

// Dummy component to force Tailwind v4 JIT compiler to generate prose styles
// for markdown elements that are injected dynamically by ReactMarkdown.
export function ProseSafelist() {
  return (
    <div className="hidden prose font-serif prose-emerald dark:prose-invert">
      <h1>h1</h1><h2>h2</h2><h3>h3</h3><h4>h4</h4><h5>h5</h5><h6>h6</h6>
      <p>p</p>
      <ul><li>ul li</li></ul>
      <ol><li>ol li</li></ol>
      <blockquote>blockquote</blockquote>
      <code>code</code>
      <pre>pre</pre>
      <table><thead><tr><th>th</th></tr></thead><tbody><tr><td>td</td></tr></tbody></table>
      <a href="#">a</a>
      <strong>strong</strong>
      <em>em</em>
      <hr />
    </div>
  );
}
