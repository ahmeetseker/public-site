import{t as e}from"./jsx-runtime-Yq6KkvIc.js";import{t}from"./cashflow-chart-o_eQ51bn.js";var n=e(),r={title:`Charts/CashflowChart (Senaryolar)`,component:t,parameters:{layout:`centered`,docs:{description:{component:"Aynı `<CashflowChart />` componenti — yatay olarak farklı veri profilleriyle senaryoları görselleştir."}}},tags:[`autodocs`],decorators:[e=>(0,n.jsx)(`div`,{className:`h-[360px] w-[560px] rounded-2xl border border-border bg-card p-5`,children:(0,n.jsx)(e,{})})]},i=[{month:`Oca`,tahsilat:98e4,komisyon:12e4,gider:32e4,net:54e4},{month:`Şub`,tahsilat:112e4,komisyon:14e4,gider:36e4,net:62e4},{month:`Mar`,tahsilat:128e4,komisyon:16e4,gider:38e4,net:74e4},{month:`Nis`,tahsilat:141e4,komisyon:18e4,gider:4e5,net:83e4}],a=[{month:`Oca`,tahsilat:98e4,komisyon:12e4,gider:32e4,net:54e4},{month:`Şub`,tahsilat:72e4,komisyon:9e4,gider:38e4,net:25e4},{month:`Mar`,tahsilat:128e4,komisyon:16e4,gider:42e4,net:7e5},{month:`Nis`,tahsilat:64e4,komisyon:8e4,gider:46e4,net:1e5}],o=[{month:`Oca`,tahsilat:48e4,komisyon:6e4,gider:52e4,net:-1e5},{month:`Şub`,tahsilat:38e4,komisyon:45e3,gider:54e4,net:-205e3},{month:`Mar`,tahsilat:41e4,komisyon:5e4,gider:56e4,net:-2e5},{month:`Nis`,tahsilat:32e4,komisyon:4e4,gider:58e4,net:-3e5}],s={args:{data:i}},c={args:{data:a}},l={args:{data:o}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    data: HEALTHY
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    data: MIXED
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    data: DISTRESSED
  }
}`,...l.parameters?.docs?.source}}};var u=[`Healthy`,`Mixed`,`Distressed`];export{l as Distressed,s as Healthy,c as Mixed,u as __namedExportsOrder,r as default};