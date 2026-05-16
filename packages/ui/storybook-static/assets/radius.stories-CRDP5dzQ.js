import{t as e}from"./jsx-runtime-Yq6KkvIc.js";import{t}from"./radius-BA2pUG07.js";var n=e(),r=[{name:`shell`,value:`var(--radius-shell)`,description:`Outer page shell + sticky header dock`},{name:`surface`,value:`var(--radius-surface)`,description:`Cards, dialogs, large containers`},{name:`container`,value:`var(--radius-container)`,description:`Default block container — generic panels`},{name:`control`,value:`var(--radius-control)`,description:`Buttons, inputs, dropdown menus`},{name:`chip`,value:`var(--radius-chip)`,description:`Pill-shaped chips & badges`}];function i({name:e,value:t,description:r}){return(0,n.jsxs)(`div`,{className:`flex items-center gap-4 border-b border-border/60 py-3`,children:[(0,n.jsx)(`div`,{"aria-hidden":!0,className:`h-16 w-16 shrink-0 bg-foreground/10`,style:{borderRadius:t}}),(0,n.jsxs)(`div`,{className:`min-w-0 flex-1`,children:[(0,n.jsxs)(`div`,{className:`flex items-baseline gap-2`,children:[(0,n.jsx)(`span`,{className:`font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground`,children:e}),(0,n.jsx)(`span`,{className:`font-mono text-[11px] tabular-nums text-foreground/70`,children:t})]}),(0,n.jsx)(`p`,{className:`mt-0.5 text-sm text-muted-foreground`,children:r})]})]})}var a={title:`Tokens/Radius`,parameters:{layout:`padded`,docs:{description:{component:"Five-tier radius scale — concentric rule of thumb: outer surface > inner surface, never the other way around. Pair with `Squircle` for G2-continuous corners."}}},tags:[`autodocs`]},o={render:()=>(0,n.jsxs)(`div`,{className:`w-[640px] rounded-2xl border border-border bg-card p-4`,children:[r.map(e=>(0,n.jsx)(i,{...e},e.name)),(0,n.jsxs)(`p`,{className:`mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground`,children:[`radius.* export — `,Object.keys(t).length,` adet`]})]})},s={render:()=>(0,n.jsx)(`div`,{className:`grid place-items-center p-6`,children:(0,n.jsx)(`div`,{className:`bg-foreground/[0.05] p-4`,style:{borderRadius:`var(--radius-shell)`},children:(0,n.jsx)(`div`,{className:`bg-foreground/[0.06] p-4`,style:{borderRadius:`var(--radius-surface)`},children:(0,n.jsx)(`div`,{className:`bg-foreground/[0.08] p-4`,style:{borderRadius:`var(--radius-container)`},children:(0,n.jsx)(`div`,{className:`bg-foreground/10 p-3`,style:{borderRadius:`var(--radius-control)`},children:(0,n.jsx)(`span`,{className:`inline-flex items-center bg-foreground/15 px-3 py-1 text-sm`,style:{borderRadius:`var(--radius-chip)`},children:`chip`})})})})})})};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-[640px] rounded-2xl border border-border bg-card p-4">
      {TOKENS.map(t => <Swatch key={t.name} {...t} />)}
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        radius.* export — {Object.keys(radius).length} adet
      </p>
    </div>
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <div className="grid place-items-center p-6">
      <div className="bg-foreground/[0.05] p-4" style={{
      borderRadius: 'var(--radius-shell)'
    }}>
        <div className="bg-foreground/[0.06] p-4" style={{
        borderRadius: 'var(--radius-surface)'
      }}>
          <div className="bg-foreground/[0.08] p-4" style={{
          borderRadius: 'var(--radius-container)'
        }}>
            <div className="bg-foreground/10 p-3" style={{
            borderRadius: 'var(--radius-control)'
          }}>
              <span className="inline-flex items-center bg-foreground/15 px-3 py-1 text-sm" style={{
              borderRadius: 'var(--radius-chip)'
            }}>
                chip
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
}`,...s.parameters?.docs?.source}}};var c=[`Scale`,`ConcentricExample`];export{s as ConcentricExample,o as Scale,c as __namedExportsOrder,a as default};