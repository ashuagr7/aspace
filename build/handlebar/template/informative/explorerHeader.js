const explorerHeader = `
<article>
    <h1>{{title}}</h1>
    <p>{{description}}</p>
  </article>
  <article>
  {{#if buttons}}
  {{#each buttons}}
  <button>{{this}}</button>
  {{/each}}
  {{/if}}
    
    
  </article>
`

export {explorerHeader}