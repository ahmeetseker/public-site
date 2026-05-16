import{t as e}from"./jsx-runtime-Yq6KkvIc.js";import{U as t,a as n,i as r,mn as i}from"./theme-D_ZC-UTA.js";import{i as a}from"./tooltipContext-CGLZfsKQ.js";import{n as o,t as s}from"./PieChart-WNP2fKfI.js";var c=e();function l({data:e}){let l=e.reduce((e,t)=>e+t.count,0);return(0,c.jsxs)(`div`,{className:`relative h-full w-full`,children:[(0,c.jsx)(i,{width:`100%`,height:`100%`,children:(0,c.jsxs)(s,{children:[(0,c.jsx)(o,{data:e,dataKey:`count`,nameKey:`source`,innerRadius:`56%`,outerRadius:`92%`,paddingAngle:2,stroke:`none`,children:e.map((e,t)=>(0,c.jsx)(a,{fill:r[t%r.length]},t))}),(0,c.jsx)(t,{contentStyle:n,formatter:(e,t,n)=>{let r=n?.payload;return[`${e} müşteri · %${Math.round((r?.conversion??0)*100)} dönüşüm`,r?.source??``]}})]})}),(0,c.jsxs)(`div`,{className:`pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center`,children:[(0,c.jsx)(`span`,{className:`font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground`,children:`Toplam müşteri`}),(0,c.jsx)(`span`,{className:`mt-0.5 font-serif text-2xl font-light tracking-tight`,children:l})]})]})}try{l.displayName=`SourceDonut`,l.__docgenInfo={description:``,displayName:`SourceDonut`,props:{data:{defaultValue:null,description:``,name:`data`,required:!0,type:{name:`SourceRow[]`}}}}}catch{}var u={title:`Charts/SourceDonut`,component:l,parameters:{layout:`centered`,docs:{description:{component:`Customer source donut — segments by acquisition channel. Center label shows total customers; recharts ResponsiveContainer requires a sized parent.`}}},tags:[`autodocs`],decorators:[e=>(0,c.jsx)(`div`,{className:`h-[320px] w-[420px] rounded-2xl border border-border bg-card p-5`,children:(0,c.jsx)(e,{})})]},d={args:{data:[{source:`Organik`,count:142,conversion:.34},{source:`Referral`,count:86,conversion:.42},{source:`Sosyal`,count:64,conversion:.18},{source:`Reklam`,count:38,conversion:.22}]}},f={args:{data:[{source:`Organik`,count:200,conversion:.31}]}},p={args:{data:[{source:`Organik`,count:142,conversion:.34},{source:`Referral`,count:86,conversion:.42},{source:`Sosyal`,count:64,conversion:.18},{source:`Reklam`,count:38,conversion:.22},{source:`Email`,count:27,conversion:.51},{source:`Diğer`,count:14,conversion:.12}]}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    data: SAMPLE
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    data: [{
      source: 'Organik',
      count: 200,
      conversion: 0.31
    }]
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    data: [{
      source: 'Organik',
      count: 142,
      conversion: 0.34
    }, {
      source: 'Referral',
      count: 86,
      conversion: 0.42
    }, {
      source: 'Sosyal',
      count: 64,
      conversion: 0.18
    }, {
      source: 'Reklam',
      count: 38,
      conversion: 0.22
    }, {
      source: 'Email',
      count: 27,
      conversion: 0.51
    }, {
      source: 'Diğer',
      count: 14,
      conversion: 0.12
    }]
  }
}`,...p.parameters?.docs?.source}}};var m=[`Default`,`SingleChannel`,`ManyChannels`];export{d as Default,p as ManyChannels,f as SingleChannel,m as __namedExportsOrder,u as default};