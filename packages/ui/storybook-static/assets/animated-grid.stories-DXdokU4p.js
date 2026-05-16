import{l as e}from"./iframe-DXHzNi9d.js";import{t}from"./react-B4BxEtKI.js";import{t as n}from"./jsx-runtime-Yq6KkvIc.js";import{a as r,o as i,r as a,s as o,t as s,u as c}from"./proxy-DcJuFcuY.js";import{t as l}from"./page-shell-C-JUkDSj.js";var u=e(t(),1);function d(e){let t=c(()=>r(e)),{isStatic:n}=(0,u.useContext)(a);if(n){let[,n]=(0,u.useState)(e);(0,u.useEffect)(()=>t.on(`change`,n),[])}return t}function f(e){let t=(0,u.useRef)(0),{isStatic:n}=(0,u.useContext)(a);(0,u.useEffect)(()=>{if(n)return;let r=({timestamp:n,delta:r})=>{t.current||=n,e(n-t.current,r)};return o.update(r,!0),()=>i(r)},[e])}var p=n(),m=48,h=.025,g=.018;function _(){let e=d(0),t=d(0),n=(0,u.useRef)(0),r=(0,u.useRef)(0),i=(0,u.useRef)(0);return(0,u.useEffect)(()=>{let e=e=>{let t=window.innerWidth/2,i=window.innerHeight/2;n.current=-(e.clientX-t)*h,r.current=-(e.clientY-i)*h};return window.addEventListener(`pointermove`,e),()=>window.removeEventListener(`pointermove`,e)},[]),f((a,o)=>{let s={x:e.get(),y:t.get()};i.current-=g*o;let c=r.current+i.current;e.set(s.x+(n.current-s.x)*.06),t.set(s.y+(c-s.y)*.06)}),(0,p.jsx)(`div`,{"aria-hidden":!0,className:`pointer-events-none fixed inset-0 z-0 overflow-hidden`,style:{background:`radial-gradient(1200px 800px at 50% 0%, hsl(var(--accent) / 0.05), transparent 60%), hsl(var(--background))`},children:(0,p.jsxs)(`svg`,{className:`h-full w-full`,children:[(0,p.jsxs)(`defs`,{children:[(0,p.jsx)(s.pattern,{id:`landx-grid`,width:m,height:m,patternUnits:`userSpaceOnUse`,x:e,y:t,children:(0,p.jsx)(`path`,{d:`M ${m} 0 L 0 0 0 ${m}`,fill:`none`,stroke:`currentColor`,strokeWidth:1,className:`text-muted-foreground/25`})}),(0,p.jsxs)(`radialGradient`,{id:`landx-grid-mask`,cx:`50%`,cy:`50%`,r:`60%`,children:[(0,p.jsx)(`stop`,{offset:`0%`,stopColor:`white`,stopOpacity:1}),(0,p.jsx)(`stop`,{offset:`100%`,stopColor:`white`,stopOpacity:0})]}),(0,p.jsx)(`mask`,{id:`landx-grid-mask-fade`,children:(0,p.jsx)(`rect`,{width:`100%`,height:`100%`,fill:`url(#landx-grid-mask)`})})]}),(0,p.jsx)(`rect`,{width:`100%`,height:`100%`,fill:`url(#landx-grid)`,mask:`url(#landx-grid-mask-fade)`})]})})}var v={title:`Shell/AnimatedGrid`,component:_,parameters:{layout:`fullscreen`,backgrounds:{default:`transparent`},docs:{description:{component:`Animated SVG grid background — parallax to pointer + slow vertical drift. Renders fixed-position behind content; pointer-events: none. Page-level decoration only — never inside a card.`}}},tags:[`autodocs`]},y={render:()=>(0,p.jsxs)(`div`,{className:`relative min-h-screen`,children:[(0,p.jsx)(_,{}),(0,p.jsx)(l,{title:`Animated grid demo`,description:`Fareyi sayfada hareket ettir — grid parallax + sürekli aşağı kayan drift.`,children:(0,p.jsx)(`div`,{className:`rounded-2xl border border-border bg-card/80 p-6 backdrop-blur`,children:(0,p.jsxs)(`p`,{className:`text-sm text-muted-foreground`,children:[`Grid sayfa arkaplanı için tasarlandı; içerik üzerinde`,(0,p.jsx)(`code`,{className:`mx-1 font-mono`,children:`bg-card/80 + backdrop-blur`}),`ile okunabilirlik kazanır.`]})})})]})},b={render:()=>(0,p.jsx)(`div`,{className:`relative h-screen`,children:(0,p.jsx)(_,{})})},x={render:()=>(0,p.jsx)(`div`,{className:`grid min-h-screen place-items-center bg-background p-8`,children:(0,p.jsxs)(`div`,{className:`relative h-[420px] w-[640px] overflow-hidden rounded-2xl border border-border bg-card`,children:[(0,p.jsx)(_,{}),(0,p.jsx)(`div`,{className:`relative z-10 flex h-full items-center justify-center`,children:(0,p.jsx)(`p`,{className:`text-sm text-muted-foreground`,children:`Demo: animated grid inside a clipped card.`})})]})})};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => <div className="relative min-h-screen">
      <AnimatedGrid />
      <PageShell title="Animated grid demo" description="Fareyi sayfada hareket ettir — grid parallax + sürekli aşağı kayan drift.">
        <div className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur">
          <p className="text-sm text-muted-foreground">
            Grid sayfa arkaplanı için tasarlandı; içerik üzerinde
            <code className="mx-1 font-mono">bg-card/80 + backdrop-blur</code>
            ile okunabilirlik kazanır.
          </p>
        </div>
      </PageShell>
    </div>
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => <div className="relative h-screen">
      <AnimatedGrid />
    </div>
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <div className="grid min-h-screen place-items-center bg-background p-8">
      <div className="relative h-[420px] w-[640px] overflow-hidden rounded-2xl border border-border bg-card">
        <AnimatedGrid />
        <div className="relative z-10 flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Demo: animated grid inside a clipped card.
          </p>
        </div>
      </div>
    </div>
}`,...x.parameters?.docs?.source}}};var S=[`Default`,`Standalone`,`InsideCard`];export{y as Default,x as InsideCard,b as Standalone,S as __namedExportsOrder,v as default};