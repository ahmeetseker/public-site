import{l as e}from"./iframe-DXHzNi9d.js";import{t}from"./react-B4BxEtKI.js";import{t as n}from"./jsx-runtime-Yq6KkvIc.js";import{t as r}from"./cn-BiX_BwfA.js";import{t as i}from"./x-iUXaAjFt.js";import{t as a}from"./proxy-DcJuFcuY.js";import{t as o}from"./AnimatePresence-CE5txF5i.js";import{t as s}from"./squircle-style-jxY5rgS8.js";var c=e(t(),1),l=n(),u={sm:`max-w-sm`,md:`max-w-md`,lg:`max-w-xl`};function d({open:e,onClose:t,title:n,description:d,children:f,footer:p,size:m=`md`,className:h}){return(0,c.useEffect)(()=>{if(!e)return;let n=e=>{e.key===`Escape`&&t()};return window.addEventListener(`keydown`,n),()=>window.removeEventListener(`keydown`,n)},[e,t]),(0,l.jsx)(o,{children:e&&(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(a.div,{className:`fixed inset-0 z-[60] bg-black/20`,initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:.2},onClick:t},`dialog-overlay`),(0,l.jsxs)(a.div,{initial:{opacity:0,scale:.95},animate:{opacity:1,scale:1},exit:{opacity:0,scale:.95},transition:{duration:.2,ease:[.22,1,.36,1]},className:r(`fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-h-[calc(100dvh-6rem)] -translate-x-1/2 -translate-y-1/2`,u[m]),children:[(0,l.jsx)(`div`,{"aria-hidden":`true`,style:{position:`absolute`,inset:`calc(-1 * var(--lq-halo-extend, 80px))`,pointerEvents:`none`,borderRadius:`calc(var(--radius-surface, 24px) + var(--lq-halo-extend, 80px))`,backdropFilter:`blur(var(--lq-halo-blur, 16px)) saturate(130%)`,WebkitBackdropFilter:`blur(var(--lq-halo-blur, 16px)) saturate(130%)`,background:`transparent`,maskImage:`radial-gradient(ellipse at center, black 0%, black calc(100% - var(--lq-halo-edge-fade, 15%)), transparent 100%)`,WebkitMaskImage:`radial-gradient(ellipse at center, black 0%, black calc(100% - var(--lq-halo-edge-fade, 15%)), transparent 100%)`}}),(0,l.jsxs)(`div`,{role:`dialog`,"aria-modal":`true`,"data-squircle":``,"data-lq-lens":`strong`,style:s(`surface`),className:r(`lg-surface relative flex max-h-full w-full flex-col overflow-hidden`,h),children:[(0,l.jsxs)(`div`,{className:`flex flex-none items-start justify-between gap-3 border-b border-[color:var(--glass-border)] px-4 pb-2.5 pt-3`,children:[(0,l.jsxs)(`div`,{className:`min-w-0`,children:[(0,l.jsx)(`h2`,{className:`font-serif text-base font-medium leading-tight tracking-tight`,children:n}),d&&(0,l.jsx)(`p`,{className:`mt-0.5 text-[11px] text-muted-foreground`,children:d})]}),(0,l.jsx)(`button`,{type:`button`,onClick:t,"aria-label":`Kapat`,"data-squircle":``,style:s(`control`),className:`lg-tile flex h-7 w-7 flex-none items-center justify-center text-muted-foreground hover:text-foreground`,children:(0,l.jsx)(i,{className:`h-3 w-3`})})]}),(0,l.jsx)(`div`,{className:`flex-1 overflow-y-auto px-4 py-3 lg-edge-y`,children:f}),p&&(0,l.jsx)(`div`,{className:`flex flex-none items-center justify-end gap-2 border-t border-[color:var(--glass-border)] px-4 py-2`,children:p})]})]},`dialog-wrap`)]})})}function f({label:e,hint:t,children:n}){return(0,l.jsxs)(`label`,{className:`block space-y-1.5`,children:[(0,l.jsx)(`span`,{className:`font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground`,children:e}),n,t&&(0,l.jsx)(`span`,{className:`block text-[11px] text-muted-foreground`,children:t})]})}try{d.displayName=`Dialog`,d.__docgenInfo={description:`FAZ 4 — Dialog primitive migration.

Concentricity:
  panel radius   = --radius-surface  (= 24px)
  panel padding  = px-4              (= 16px) on header / body
  header → close button concentric:
    radiusInner(24, 16) = 8 = --radius-control  ✓

Migrated:
  - Panel: rounded-lg-2xl (legacy --lg-r-2xl 24px) → --radius-surface (24px) [zero visual delta]
  - Close button: rounded-lg-md (legacy --lg-r-md 10px) → --radius-control (8px) [-2px]

Squircle equivalent: corner-shape declaration emitted inline alongside
border-radius (same CSS pattern Squircle component emits). framer-motion
+ TS button props don't compose cleanly with the React Squircle wrapper,
so we inline the equivalent style here.`,displayName:`Dialog`,props:{open:{defaultValue:null,description:``,name:`open`,required:!0,type:{name:`boolean`}},onClose:{defaultValue:null,description:``,name:`onClose`,required:!0,type:{name:`() => void`}},title:{defaultValue:null,description:``,name:`title`,required:!0,type:{name:`ReactNode`}},description:{defaultValue:null,description:``,name:`description`,required:!1,type:{name:`ReactNode`}},footer:{defaultValue:null,description:``,name:`footer`,required:!1,type:{name:`ReactNode`}},size:{defaultValue:{value:`md`},description:``,name:`size`,required:!1,type:{name:`enum`,value:[{value:`undefined`},{value:`"sm"`},{value:`"lg"`},{value:`"md"`}]}},className:{defaultValue:null,description:``,name:`className`,required:!1,type:{name:`string | undefined`}}}}}catch{}try{f.displayName=`Field`,f.__docgenInfo={description:``,displayName:`Field`,props:{label:{defaultValue:null,description:``,name:`label`,required:!0,type:{name:`string`}},hint:{defaultValue:null,description:``,name:`hint`,required:!1,type:{name:`string | undefined`}}}}}catch{}var p={title:`Primitives/Dialog`,component:d,parameters:{layout:`fullscreen`,docs:{description:{component:"Modal dialog with framer-motion fade + scale. ESC closes; overlay click closes. Concentric radii (panel = `--radius-surface`, close button = `--radius-control`). Size variants: sm | md | lg."}}},tags:[`autodocs`]};function m({size:e=`md`}){let[t,n]=(0,c.useState)(!0);return(0,l.jsxs)(`div`,{className:`min-h-screen bg-background p-12`,children:[(0,l.jsxs)(`button`,{type:`button`,onClick:()=>n(!0),className:`rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background`,children:[`Aç (`,e,`)`]}),(0,l.jsx)(d,{open:t,onClose:()=>n(!1),title:`Yeni ilan oluştur`,description:`Aşağıdaki bilgileri doldurarak ilanı yayına al.`,size:e,footer:(0,l.jsxs)(`div`,{className:`flex justify-end gap-2`,children:[(0,l.jsx)(`button`,{type:`button`,className:`rounded-lg border border-border px-3 py-1.5 text-sm`,onClick:()=>n(!1),children:`Vazgeç`}),(0,l.jsx)(`button`,{type:`button`,className:`rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background`,children:`Yayına al`})]}),children:(0,l.jsx)(`p`,{className:`text-sm text-muted-foreground`,children:`Bu, Liquid Glass Dialog primitive'inin demo içeriğidir. Gerçek formlar burada render edilir.`})})]})}var h={args:{open:!0,onClose:()=>{},title:`Default`,children:null},render:()=>(0,l.jsx)(m,{size:`md`})},g={args:{open:!0,onClose:()=>{},title:`Small`,children:null},render:()=>(0,l.jsx)(m,{size:`sm`})},_={args:{open:!0,onClose:()=>{},title:`Large`,children:null},render:()=>(0,l.jsx)(m,{size:`lg`})};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    open: true,
    onClose: () => {},
    title: 'Default',
    children: null
  },
  render: () => <DialogDemo size="md" />
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    open: true,
    onClose: () => {},
    title: 'Small',
    children: null
  },
  render: () => <DialogDemo size="sm" />
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    open: true,
    onClose: () => {},
    title: 'Large',
    children: null
  },
  render: () => <DialogDemo size="lg" />
}`,..._.parameters?.docs?.source}}};var v=[`Default`,`Small`,`Large`];export{h as Default,_ as Large,g as Small,v as __namedExportsOrder,p as default};