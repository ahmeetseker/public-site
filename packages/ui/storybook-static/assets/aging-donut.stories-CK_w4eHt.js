import{t as e}from"./jsx-runtime-Yq6KkvIc.js";import{U as t,a as n,mn as r,n as i}from"./theme-D_ZC-UTA.js";import{i as a}from"./tooltipContext-CGLZfsKQ.js";import{n as o,t as s}from"./PieChart-WNP2fKfI.js";import{r as c}from"./format-BW8f4jTV.js";var l=e(),u=[i.emerald,i.amber,i.rose];function d({data:e}){let d=e.reduce((e,t)=>e+t.amount,0);return(0,l.jsxs)(`div`,{className:`relative h-full w-full`,children:[(0,l.jsx)(r,{width:`100%`,height:`100%`,children:(0,l.jsxs)(s,{children:[(0,l.jsx)(o,{data:e,dataKey:`amount`,nameKey:`label`,innerRadius:`58%`,outerRadius:`92%`,paddingAngle:2,stroke:`none`,children:e.map((e,t)=>(0,l.jsx)(a,{fill:u[t]??i.secondary},t))}),(0,l.jsx)(t,{contentStyle:n,formatter:(e,t,n)=>{let r=n?.payload;return[`${c(Number(e))} · ${r?.count??0} işlem`,r?.label??``]}})]})}),(0,l.jsxs)(`div`,{className:`pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center`,children:[(0,l.jsx)(`span`,{className:`font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground`,children:`Toplam`}),(0,l.jsx)(`span`,{className:`mt-0.5 font-serif text-xl font-light tracking-tight`,children:c(d)})]})]})}try{d.displayName=`AgingDonut`,d.__docgenInfo={description:``,displayName:`AgingDonut`,props:{data:{defaultValue:null,description:``,name:`data`,required:!0,type:{name:`AgingBucket[]`}}}}}catch{}var f={title:`Charts/AgingDonut`,component:d,parameters:{layout:`centered`,docs:{description:{component:`Aging buckets donut — receivables bucketed by age, sums to center label. Recharts under the hood; container must give explicit height (ResponsiveContainer).`}}},tags:[`autodocs`],decorators:[e=>(0,l.jsx)(`div`,{className:`h-[320px] w-[420px] rounded-2xl border border-border bg-card p-5`,children:(0,l.jsx)(e,{})})]},p={args:{data:[{label:`0–30 gün`,count:18,amount:124e4},{label:`31–60 gün`,count:7,amount:46e4},{label:`60+ gün`,count:3,amount:18e4}]}},m={args:{data:[{label:`0–30 gün`,count:24,amount:19e5},{label:`31–60 gün`,count:2,amount:8e4},{label:`60+ gün`,count:0,amount:0}]}},h={args:{data:[{label:`0–30 gün`,count:3,amount:12e4},{label:`31–60 gün`,count:9,amount:54e4},{label:`60+ gün`,count:14,amount:132e4}]}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    data: SAMPLE
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    data: [{
      label: '0–30 gün',
      count: 24,
      amount: 1_900_000
    }, {
      label: '31–60 gün',
      count: 2,
      amount: 80_000
    }, {
      label: '60+ gün',
      count: 0,
      amount: 0
    }]
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    data: [{
      label: '0–30 gün',
      count: 3,
      amount: 120_000
    }, {
      label: '31–60 gün',
      count: 9,
      amount: 540_000
    }, {
      label: '60+ gün',
      count: 14,
      amount: 1_320_000
    }]
  }
}`,...h.parameters?.docs?.source}}};var g=[`Default`,`Healthy`,`Distressed`];export{p as Default,h as Distressed,m as Healthy,g as __namedExportsOrder,f as default};