import{t as e}from"./jsx-runtime-Yq6KkvIc.js";import{i as t,n,r,t as i}from"./format-BW8f4jTV.js";var a=e();function o({label:e,value:t}){return(0,a.jsxs)(`div`,{className:`grid grid-cols-[12rem_1fr] items-baseline gap-3 border-b border-border/60 py-1.5 text-sm`,children:[(0,a.jsx)(`span`,{className:`font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground`,children:e}),(0,a.jsx)(`span`,{className:`tabular-nums`,children:t})]})}var s={title:`Lib/Format`,parameters:{layout:`padded`,docs:{description:{component:"Turkish-locale formatters: `formatTL` (₺ full precision), `formatTLCompact` (₺ 1.2M), `formatArea` (m²/bin m²), `timeAgo` (relative TR string)."}}},tags:[`autodocs`]},c={render:()=>(0,a.jsxs)(`div`,{className:`w-[520px] rounded-2xl border border-border bg-card p-4`,children:[(0,a.jsx)(o,{label:`formatTL(1240)`,value:n(1240)}),(0,a.jsx)(o,{label:`formatTL(1240000)`,value:n(124e4)}),(0,a.jsx)(o,{label:`formatTLCompact(1240000)`,value:r(124e4)}),(0,a.jsx)(o,{label:`formatTLCompact(98_500_000)`,value:r(985e5)})]})},l={render:()=>(0,a.jsxs)(`div`,{className:`w-[520px] rounded-2xl border border-border bg-card p-4`,children:[(0,a.jsx)(o,{label:`formatArea(420)`,value:i(420)}),(0,a.jsx)(o,{label:`formatArea(2_800)`,value:i(2800)}),(0,a.jsx)(o,{label:`formatArea(18_400)`,value:i(18400)})]})},u={render:()=>{let e=Date.now();return(0,a.jsxs)(`div`,{className:`w-[520px] rounded-2xl border border-border bg-card p-4`,children:[(0,a.jsx)(o,{label:`timeAgo(-30s)`,value:t(new Date(e-30*1e3).toISOString())}),(0,a.jsx)(o,{label:`timeAgo(-12dk)`,value:t(new Date(e-720*1e3).toISOString())}),(0,a.jsx)(o,{label:`timeAgo(-5sa)`,value:t(new Date(e-300*60*1e3).toISOString())}),(0,a.jsx)(o,{label:`timeAgo(-3gün)`,value:t(new Date(e-4320*60*1e3).toISOString())})]})}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-[520px] rounded-2xl border border-border bg-card p-4">
      <Sample label="formatTL(1240)" value={formatTL(1_240)} />
      <Sample label="formatTL(1240000)" value={formatTL(1_240_000)} />
      <Sample label="formatTLCompact(1240000)" value={formatTLCompact(1_240_000)} />
      <Sample label="formatTLCompact(98_500_000)" value={formatTLCompact(98_500_000)} />
    </div>
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-[520px] rounded-2xl border border-border bg-card p-4">
      <Sample label="formatArea(420)" value={formatArea(420)} />
      <Sample label="formatArea(2_800)" value={formatArea(2_800)} />
      <Sample label="formatArea(18_400)" value={formatArea(18_400)} />
    </div>
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => {
    const now = Date.now();
    return <div className="w-[520px] rounded-2xl border border-border bg-card p-4">
        <Sample label="timeAgo(-30s)" value={timeAgo(new Date(now - 30 * 1000).toISOString())} />
        <Sample label="timeAgo(-12dk)" value={timeAgo(new Date(now - 12 * 60 * 1000).toISOString())} />
        <Sample label="timeAgo(-5sa)" value={timeAgo(new Date(now - 5 * 60 * 60 * 1000).toISOString())} />
        <Sample label="timeAgo(-3gün)" value={timeAgo(new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString())} />
      </div>;
  }
}`,...u.parameters?.docs?.source}}};var d=[`Currency`,`Area`,`RelativeTime`];export{l as Area,c as Currency,u as RelativeTime,d as __namedExportsOrder,s as default};