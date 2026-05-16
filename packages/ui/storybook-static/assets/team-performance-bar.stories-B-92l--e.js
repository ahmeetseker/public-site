import{t as e}from"./jsx-runtime-Yq6KkvIc.js";import{U as t,a as n,i as r,mn as i,n as a,r as o,t as s}from"./theme-D_ZC-UTA.js";import{i as c}from"./tooltipContext-CGLZfsKQ.js";import{n as l,t as u}from"./BarChart-DsEiPRrq.js";import{n as d,o as f,r as p}from"./CartesianChart-DdlCgTJ1.js";import{r as m}from"./format-BW8f4jTV.js";var h=e();function g({data:e}){return(0,h.jsx)(i,{width:`100%`,height:`100%`,children:(0,h.jsxs)(u,{data:e,margin:{top:10,right:16,bottom:0,left:-20},children:[(0,h.jsx)(f,{...o,vertical:!1}),(0,h.jsx)(p,{dataKey:`owner`,axisLine:!1,tickLine:!1,tick:{fill:s.stroke,fontSize:s.fontSize,fontFamily:s.fontFamily}}),(0,h.jsx)(d,{axisLine:!1,tickLine:!1,tick:{fill:s.stroke,fontSize:s.fontSize,fontFamily:s.fontFamily},tickFormatter:e=>m(e).replace(`₺ `,``),width:60}),(0,h.jsx)(t,{contentStyle:n,formatter:e=>m(Number(e)),cursor:{fill:a.primary,fillOpacity:.04}}),(0,h.jsx)(l,{dataKey:`revenue`,name:`Ciro`,radius:[6,6,0,0],children:e.map((e,t)=>(0,h.jsx)(c,{fill:r[t%r.length]},t))})]})})}try{g.displayName=`TeamPerformanceBar`,g.__docgenInfo={description:``,displayName:`TeamPerformanceBar`,props:{data:{defaultValue:null,description:``,name:`data`,required:!0,type:{name:`TeamRow[]`}}}}}catch{}var _={title:`Charts/TeamPerformanceBar`,component:g,parameters:{layout:`centered`,docs:{description:{component:"Per-owner revenue bar chart. Y-axis uses compact TL formatting (`formatTLCompact`). Color palette rotates from `CHART_PALETTE`."}}},tags:[`autodocs`],decorators:[e=>(0,h.jsx)(`div`,{className:`h-[320px] w-[560px] rounded-2xl border border-border bg-card p-5`,children:(0,h.jsx)(e,{})})]},v={args:{data:[{owner:`Ayşe`,closed:12,active:4,revenue:124e4,conversion:.42},{owner:`Mehmet`,closed:9,active:6,revenue:98e4,conversion:.36},{owner:`Selin`,closed:7,active:3,revenue:72e4,conversion:.29},{owner:`Burak`,closed:4,active:5,revenue:41e4,conversion:.22}]}},y={args:{data:[{owner:`Ayşe`,closed:12,active:4,revenue:124e4,conversion:.42}]}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    data: SAMPLE
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    data: [{
      owner: 'Ayşe',
      closed: 12,
      active: 4,
      revenue: 1_240_000,
      conversion: 0.42
    }]
  }
}`,...y.parameters?.docs?.source}}};var b=[`Default`,`SinglePerson`];export{v as Default,y as SinglePerson,b as __namedExportsOrder,_ as default};