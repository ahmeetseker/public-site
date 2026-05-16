import{t as e}from"./jsx-runtime-Yq6KkvIc.js";import{t}from"./cn-BiX_BwfA.js";var n=e();function r({className:e,...r}){return(0,n.jsx)(`div`,{className:t(`animate-pulse rounded-lg bg-foreground/[0.06] dark:bg-foreground/[0.08]`,e),"aria-busy":`true`,"aria-live":`polite`,...r})}function i({cells:e=5}){return(0,n.jsx)(`div`,{className:`flex items-center gap-3 px-3 py-3`,children:Array.from({length:e}).map((e,i)=>(0,n.jsx)(r,{className:t(`h-4`,i===0?`flex-[2]`:`flex-1`)},i))})}function a({rows:e=6,cells:t=5}){return(0,n.jsx)(`div`,{className:`divide-y divide-border/60`,children:Array.from({length:e}).map((e,r)=>(0,n.jsx)(i,{cells:t},r))})}function o({className:e}){return(0,n.jsxs)(`div`,{className:t(`space-y-3 rounded-2xl border border-border bg-card p-4`,e),children:[(0,n.jsx)(r,{className:`h-3 w-20`}),(0,n.jsx)(r,{className:`h-8 w-32`}),(0,n.jsx)(r,{className:`h-3 w-full`})]})}function s({className:e}){return(0,n.jsxs)(`div`,{className:t(`rounded-2xl border border-border bg-card p-5`,e),children:[(0,n.jsx)(r,{className:`mb-4 h-4 w-32`}),(0,n.jsx)(`div`,{className:`flex h-48 items-end gap-3`,children:Array.from({length:12}).map((e,t)=>(0,n.jsx)(r,{className:`flex-1`,style:{height:`${30+t*7%60}%`}},t))})]})}try{r.displayName=`Skeleton`,r.__docgenInfo={description:``,displayName:`Skeleton`,props:{}}}catch{}try{i.displayName=`SkeletonRow`,i.__docgenInfo={description:``,displayName:`SkeletonRow`,props:{cells:{defaultValue:{value:`5`},description:``,name:`cells`,required:!1,type:{name:`number | undefined`}}}}}catch{}try{a.displayName=`SkeletonTable`,a.__docgenInfo={description:``,displayName:`SkeletonTable`,props:{rows:{defaultValue:{value:`6`},description:``,name:`rows`,required:!1,type:{name:`number | undefined`}},cells:{defaultValue:{value:`5`},description:``,name:`cells`,required:!1,type:{name:`number | undefined`}}}}}catch{}try{o.displayName=`SkeletonCard`,o.__docgenInfo={description:``,displayName:`SkeletonCard`,props:{className:{defaultValue:null,description:``,name:`className`,required:!1,type:{name:`string | undefined`}}}}}catch{}try{s.displayName=`SkeletonChart`,s.__docgenInfo={description:``,displayName:`SkeletonChart`,props:{className:{defaultValue:null,description:``,name:`className`,required:!1,type:{name:`string | undefined`}}}}}catch{}var c={title:`Feedback/Skeleton`,component:r,parameters:{layout:`padded`,docs:{description:{component:"Loading skeletons. All use `bg-foreground/[0.06]` token + `animate-pulse`. Variants compose primitives → SkeletonRow → SkeletonTable → SkeletonChart / SkeletonCard."}}},tags:[`autodocs`]},l={args:{className:`h-6 w-48`}},u={render:()=>(0,n.jsx)(`div`,{className:`w-[640px] rounded-2xl border border-border bg-card`,children:(0,n.jsx)(a,{rows:5,cells:5})})},d={render:()=>(0,n.jsxs)(`div`,{className:`grid grid-cols-3 gap-4`,children:[(0,n.jsx)(o,{}),(0,n.jsx)(o,{}),(0,n.jsx)(o,{})]})},f={render:()=>(0,n.jsx)(`div`,{className:`w-[480px]`,children:(0,n.jsx)(s,{})})},p={render:()=>(0,n.jsx)(`div`,{className:`w-[640px] rounded-2xl border border-border bg-card`,children:(0,n.jsx)(i,{cells:4})})};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    className: 'h-6 w-48'
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-[640px] rounded-2xl border border-border bg-card">
      <SkeletonTable rows={5} cells={5} />
    </div>
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div className="grid grid-cols-3 gap-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-[480px]">
      <SkeletonChart />
    </div>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-[640px] rounded-2xl border border-border bg-card">
      <SkeletonRow cells={4} />
    </div>
}`,...p.parameters?.docs?.source}}};var m=[`Primitive`,`Table`,`Card`,`Chart`,`Row`];export{d as Card,f as Chart,l as Primitive,p as Row,u as Table,m as __namedExportsOrder,c as default};