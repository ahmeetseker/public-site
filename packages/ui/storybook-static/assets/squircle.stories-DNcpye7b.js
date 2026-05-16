import{l as e}from"./iframe-DXHzNi9d.js";import{t}from"./react-B4BxEtKI.js";import{t as n}from"./jsx-runtime-Yq6KkvIc.js";import"./radius-BA2pUG07.js";var r=e(t(),1);function i(e,t,n,r){let i=Math.min(n,e/2,t/2),a=Math.max(0,Math.min(1,r));if(i<=0)return`M 0 0 L ${e} 0 L ${e} ${t} L 0 ${t} Z`;let o=i*(1+a),s=o*(.55-a*.1);return[`M ${o} 0`,`L ${e-o} 0`,`C ${e-o+s} 0, ${e} ${o-s}, ${e} ${o}`,`L ${e} ${t-o}`,`C ${e} ${t-o+s}, ${e-o+s} ${t}, ${e-o} ${t}`,`L ${o} ${t}`,`C ${o-s} ${t}, 0 ${t-o+s}, 0 ${t-o}`,`L 0 ${o}`,`C 0 ${o-s}, ${o-s} 0, ${o} 0`,`Z`].join(` `)}function a(e,t,n,r){return`path("${i(e,t,n,r)}")`}var o=n(),s=[`shell`,`surface`,`container`,`control`,`chip`];function c(e){return typeof e==`string`&&s.includes(e)}function l(e){return e===void 0?`var(--radius-container)`:typeof e==`number`?`${e}px`:c(e)?`var(--radius-${e})`:e}function u(e){if(e===void 0)return 16;if(typeof e==`number`)return e;if(c(e))return{shell:32,surface:24,container:16,control:8,chip:9999}[e];let t=/^(-?\d*\.?\d+)px$/.exec(e);return t?parseFloat(t[1]):void 0}var d=r.forwardRef(function({radius:e,smoothing:t,as:n=`div`,precise:i=!1,className:s,style:c,children:d,...f},p){let m=l(e),h=t===void 0?`var(--corner-smoothing)`:String(t),g={borderRadius:m,...c,cornerShape:`squircle ${h}`,WebkitCornerShape:`squircle ${h}`},_=r.useRef(null),v=r.useCallback(e=>{_.current=e,typeof p==`function`?p(e):p&&(p.current=e)},[p]),[y,b]=r.useState(void 0),x=u(e),S=t===void 0?.6:t;return r.useEffect(()=>{if(!i){b(void 0);return}let e=_.current;if(!e||x===void 0)return;let t=()=>{let{width:t,height:n}=e.getBoundingClientRect();t>0&&n>0&&b(a(t,n,x,S))};t();let n=new ResizeObserver(t);return n.observe(e),()=>n.disconnect()},[i,x,S]),(0,o.jsx)(n,{ref:v,"data-squircle":``,className:s,style:y?{...g,clipPath:y,WebkitClipPath:y}:g,...f,children:d})});d.displayName=`Squircle`;try{d.displayName=`Squircle`,d.__docgenInfo={description:``,displayName:`Squircle`,props:{radius:{defaultValue:null,description:"Radius. Accepts:\n- number (px): `16`\n- token name: `'container'` (resolves to `var(--radius-container)`)\n- any CSS length: `'1rem'`, `'20px'`, `'var(--my-radius)'`\n\nDefault: `'container'` (resolves to `var(--radius-container)` ≈ 16px).",name:`radius`,required:!1,type:{name:`string | number | undefined`}},smoothing:{defaultValue:null,description:`Corner smoothing factor, 0–1.
- 0   → standard circular arc
- 0.6 → iOS-style squircle (recommended default)
- 1   → maximum smoothness

Default: \`var(--corner-smoothing)\` (≈ 0.6).`,name:`smoothing`,required:!1,type:{name:`number | undefined`}},as:{defaultValue:{value:`div`},description:"Element type (polymorphic). Default `'div'`.",name:`as`,required:!1,type:{name:`ElementType<any, keyof IntrinsicElements> | undefined`}},precise:{defaultValue:{value:`false`},description:"If `true`, generates an SVG-mask `clip-path` to render an actual\nsquircle on browsers that don't yet support `corner-shape: squircle`.\nCosts a ResizeObserver subscription. Default `false`.",name:`precise`,required:!1,type:{name:`boolean | undefined`}}}}}catch{}var f={title:`Primitives/Squircle`,component:d,parameters:{layout:`centered`,docs:{description:{component:"Apple G2-continuity smooth-corner primitive. Uses native CSS `corner-shape: squircle` where supported, gracefully degrades to a circular arc elsewhere. Pass a radius token (shell/surface/container/control/chip) or any CSS length."}}},tags:[`autodocs`],argTypes:{radius:{control:`select`,options:[`shell`,`surface`,`container`,`control`,`chip`]}}},p={args:{radius:`surface`},render:e=>(0,o.jsx)(d,{...e,className:`flex h-32 w-64 items-center justify-center bg-card text-foreground border border-border`,children:(0,o.jsx)(`span`,{className:`font-serif text-lg`,children:`surface (24px)`})})},m={args:{radius:`control`},render:()=>(0,o.jsxs)(`div`,{className:`flex items-center gap-6`,children:[(0,o.jsx)(d,{radius:`control`,className:`flex h-12 w-32 items-center justify-center bg-foreground text-background`,children:`control (8px)`}),(0,o.jsx)(d,{radius:`chip`,className:`flex h-8 w-24 items-center justify-center bg-muted text-foreground`,children:`chip`})]})},h={args:{radius:`shell`},render:()=>(0,o.jsxs)(d,{radius:`shell`,className:`flex h-60 w-80 flex-col gap-3 bg-background p-6 border border-border`,children:[(0,o.jsx)(d,{radius:`surface`,className:`flex flex-1 items-center justify-center bg-card text-muted-foreground`,children:`surface`}),(0,o.jsxs)(`div`,{className:`flex gap-2`,children:[(0,o.jsx)(d,{radius:`control`,className:`flex h-10 flex-1 items-center justify-center bg-foreground text-background text-sm`,children:`control`}),(0,o.jsx)(d,{radius:`chip`,className:`flex h-10 w-20 items-center justify-center bg-muted text-foreground text-sm`,children:`chip`})]})]})};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    radius: 'surface'
  },
  render: args => <Squircle {...args} className="flex h-32 w-64 items-center justify-center bg-card text-foreground border border-border">
      <span className="font-serif text-lg">surface (24px)</span>
    </Squircle>
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    radius: 'control'
  },
  render: () => <div className="flex items-center gap-6">
      <Squircle radius="control" className="flex h-12 w-32 items-center justify-center bg-foreground text-background">
        control (8px)
      </Squircle>
      <Squircle radius="chip" className="flex h-8 w-24 items-center justify-center bg-muted text-foreground">
        chip
      </Squircle>
    </div>
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    radius: 'shell'
  },
  render: () => <Squircle radius="shell" className="flex h-60 w-80 flex-col gap-3 bg-background p-6 border border-border">
      <Squircle radius="surface" className="flex flex-1 items-center justify-center bg-card text-muted-foreground">
        surface
      </Squircle>
      <div className="flex gap-2">
        <Squircle radius="control" className="flex h-10 flex-1 items-center justify-center bg-foreground text-background text-sm">
          control
        </Squircle>
        <Squircle radius="chip" className="flex h-10 w-20 items-center justify-center bg-muted text-foreground text-sm">
          chip
        </Squircle>
      </div>
    </Squircle>
}`,...h.parameters?.docs?.source}}};var g=[`Surface`,`ControlVsChip`,`Stack`];export{m as ControlVsChip,h as Stack,p as Surface,g as __namedExportsOrder,f as default};