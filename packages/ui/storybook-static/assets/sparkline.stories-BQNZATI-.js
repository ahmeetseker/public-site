import{t as e}from"./jsx-runtime-Yq6KkvIc.js";var t=e();function n({data:e,width:n=80,height:r=24,className:i}){if(e.length===0)return null;let a=Math.max(...e,1),o=e.length>1?n/(e.length-1):n,s=e.map((e,t)=>`${t*o},${r-e/a*(r-4)-2}`).join(` `),c=e[e.length-1],l=(e.length-1)*o,u=r-c/a*(r-4)-2,d=e.length>1?e[e.length-1]>=e[0]:!0,f=d?`rgb(16, 185, 129)`:`rgb(225, 29, 72)`,p=d?`rgba(16, 185, 129, 0.10)`:`rgba(225, 29, 72, 0.10)`;return(0,t.jsxs)(`svg`,{width:n,height:r,viewBox:`0 0 ${n} ${r}`,className:i,"aria-hidden":`true`,children:[(0,t.jsx)(`polyline`,{fill:`none`,stroke:f,strokeWidth:1.5,strokeLinecap:`round`,strokeLinejoin:`round`,points:s}),(0,t.jsx)(`polyline`,{fill:p,stroke:`none`,points:`0,${r} ${s} ${n},${r}`}),(0,t.jsx)(`circle`,{cx:l,cy:u,r:2,fill:f})]})}try{n.displayName=`Sparkline`,n.__docgenInfo={description:``,displayName:`Sparkline`,props:{data:{defaultValue:null,description:``,name:`data`,required:!0,type:{name:`number[]`}},width:{defaultValue:{value:`80`},description:``,name:`width`,required:!1,type:{name:`number | undefined`}},height:{defaultValue:{value:`24`},description:``,name:`height`,required:!1,type:{name:`number | undefined`}},className:{defaultValue:null,description:``,name:`className`,required:!1,type:{name:`string | undefined`}}}}}catch{}var r={title:`Atoms/Sparkline`,component:n,parameters:{layout:`centered`,docs:{description:{component:`SVG sparkline atom — used inside table rows and KPI cards. Stroke + fill color flip emerald/rose based on first-vs-last trend. No external chart lib (zero recharts dependency).`}}},tags:[`autodocs`]},i=[4,6,5,7,9,8,10,12,11,14],a=[14,12,13,10,11,9,8,7,5,4],o=[8,8,9,8,9,8,8,9,8,9],s={args:{data:i,width:120,height:32}},c={args:{data:a,width:120,height:32}},l={args:{data:i},render:()=>(0,t.jsxs)(`div`,{className:`flex flex-col items-start gap-3`,children:[(0,t.jsx)(n,{data:i,width:60,height:18}),(0,t.jsx)(n,{data:o,width:120,height:32}),(0,t.jsx)(n,{data:a,width:200,height:48})]})};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    data: UP_TREND,
    width: 120,
    height: 32
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    data: DOWN_TREND,
    width: 120,
    height: 32
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    data: UP_TREND
  },
  render: () => <div className="flex flex-col items-start gap-3">
      <Sparkline data={UP_TREND} width={60} height={18} />
      <Sparkline data={FLAT} width={120} height={32} />
      <Sparkline data={DOWN_TREND} width={200} height={48} />
    </div>
}`,...l.parameters?.docs?.source}}};var u=[`Upward`,`Downward`,`Sizes`];export{c as Downward,l as Sizes,s as Upward,u as __namedExportsOrder,r as default};