import{t as e}from"./jsx-runtime-Yq6KkvIc.js";import{t}from"./cn-BiX_BwfA.js";var n=e(),r={Aktif:{fg:`text-emerald-700 dark:text-emerald-300`,bg:`bg-emerald-500/10 dark:bg-emerald-400/10`,dot:`bg-emerald-500 dark:bg-emerald-400`},Pasif:{fg:`text-stone-600 dark:text-stone-300`,bg:`bg-stone-500/10 dark:bg-stone-400/10`,dot:`bg-stone-500 dark:bg-stone-400`},Taslak:{fg:`text-amber-700 dark:text-amber-300`,bg:`bg-amber-500/10 dark:bg-amber-400/10`,dot:`bg-amber-500 dark:bg-amber-400`}};function i({status:e}){let i=r[e];return(0,n.jsxs)(`span`,{className:t(`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium`,i.bg,i.fg),children:[(0,n.jsx)(`span`,{className:t(`h-1.5 w-1.5 rounded-full`,i.dot)}),e]})}var a={Sıcak:{fg:`text-rose-700 dark:text-rose-300`,bg:`bg-rose-500/10 dark:bg-rose-400/10`,emoji:`🔥`},Ilık:{fg:`text-amber-700 dark:text-amber-300`,bg:`bg-amber-500/10 dark:bg-amber-400/10`,emoji:`⚡`},Soğuk:{fg:`text-sky-700 dark:text-sky-300`,bg:`bg-sky-500/10 dark:bg-sky-400/10`,emoji:`❄`}};function o({segment:e}){let r=a[e];return(0,n.jsxs)(`span`,{className:t(`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium`,r.bg,r.fg),children:[(0,n.jsx)(`span`,{"aria-hidden":!0,children:r.emoji}),e]})}var s=[`İlk temas`,`Görüşme`,`Teklif`,`Kaparo`,`Tapu`];function c({stage:e}){let t=s.indexOf(e),r=(t+1)/s.length;return(0,n.jsxs)(`span`,{className:`inline-flex items-center gap-2`,children:[(0,n.jsxs)(`span`,{className:`font-mono text-[10px] tabular-nums text-muted-foreground`,children:[t+1,`/`,s.length]}),(0,n.jsx)(`span`,{className:`relative inline-block h-1 w-12 overflow-hidden rounded-full bg-foreground/10`,children:(0,n.jsx)(`span`,{className:`absolute inset-y-0 left-0 rounded-full bg-foreground/60`,style:{width:`${r*100}%`}})}),(0,n.jsx)(`span`,{className:`text-[12px] font-medium`,children:e})]})}var l={İmarlı:{fg:`text-emerald-800 dark:text-emerald-200`,bg:`bg-emerald-500/10 dark:bg-emerald-400/10`},Tarla:{fg:`text-yellow-800 dark:text-yellow-200`,bg:`bg-yellow-500/10 dark:bg-yellow-400/10`},Zeytinlik:{fg:`text-lime-800 dark:text-lime-200`,bg:`bg-lime-500/10 dark:bg-lime-400/10`},"Villa Arsası":{fg:`text-fuchsia-800 dark:text-fuchsia-200`,bg:`bg-fuchsia-500/10 dark:bg-fuchsia-400/10`}};function u({type:e}){let r=l[e];return(0,n.jsx)(`span`,{className:t(`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium`,r.bg,r.fg),children:e})}try{i.displayName=`StatusChip`,i.__docgenInfo={description:``,displayName:`StatusChip`,props:{status:{defaultValue:null,description:``,name:`status`,required:!0,type:{name:`enum`,value:[{value:`"Aktif"`},{value:`"Pasif"`},{value:`"Taslak"`}]}}}}}catch{}try{o.displayName=`SegmentChip`,o.__docgenInfo={description:``,displayName:`SegmentChip`,props:{segment:{defaultValue:null,description:``,name:`segment`,required:!0,type:{name:`enum`,value:[{value:`"Sıcak"`},{value:`"Ilık"`},{value:`"Soğuk"`}]}}}}}catch{}try{c.displayName=`StageChip`,c.__docgenInfo={description:``,displayName:`StageChip`,props:{stage:{defaultValue:null,description:``,name:`stage`,required:!0,type:{name:`enum`,value:[{value:`"İlk temas"`},{value:`"Görüşme"`},{value:`"Teklif"`},{value:`"Kaparo"`},{value:`"Tapu"`}]}}}}}catch{}try{u.displayName=`TypeChip`,u.__docgenInfo={description:``,displayName:`TypeChip`,props:{type:{defaultValue:null,description:``,name:`type`,required:!0,type:{name:`enum`,value:[{value:`"İmarlı"`},{value:`"Tarla"`},{value:`"Zeytinlik"`},{value:`"Villa Arsası"`}]}}}}}catch{}var d={title:`Atoms/Chips`,component:i,parameters:{layout:`centered`,docs:{description:{component:"Domain status chips — listing status (Aktif/Pasif/Taslak), listing type (İmarlı/Tarla/...), customer segment (Sıcak/Ilık/Soğuk), and pipeline stage (İlk temas → Tapu). Tones are token-driven via the LandX `--background`/`--foreground` palette plus semantic emerald/amber/rose accents."}}},tags:[`autodocs`]},f={args:{status:`Aktif`},argTypes:{status:{control:`inline-radio`,options:[`Aktif`,`Pasif`,`Taslak`]}},render:e=>(0,n.jsxs)(`div`,{className:`flex flex-wrap items-center gap-3`,children:[(0,n.jsx)(i,{...e}),(0,n.jsx)(i,{status:`Aktif`}),(0,n.jsx)(i,{status:`Pasif`}),(0,n.jsx)(i,{status:`Taslak`})]})},p={args:{status:`Aktif`},render:()=>(0,n.jsxs)(`div`,{className:`flex flex-wrap items-center gap-3`,children:[(0,n.jsx)(o,{segment:`Sıcak`}),(0,n.jsx)(o,{segment:`Ilık`}),(0,n.jsx)(o,{segment:`Soğuk`})]}),parameters:{docs:{description:{story:`Customer segment chips. Sıcak = active opportunity, Ilık = engaged, Soğuk = follow-up.`}}}},m={args:{status:`Aktif`},render:()=>(0,n.jsxs)(`div`,{className:`flex flex-wrap items-center gap-3`,children:[(0,n.jsx)(u,{type:`İmarlı`}),(0,n.jsx)(u,{type:`Tarla`}),(0,n.jsx)(u,{type:`Zeytinlik`}),(0,n.jsx)(u,{type:`Villa Arsası`})]})},h={args:{status:`Aktif`},render:()=>(0,n.jsxs)(`div`,{className:`flex flex-col gap-2`,children:[(0,n.jsx)(c,{stage:`İlk temas`}),(0,n.jsx)(c,{stage:`Görüşme`}),(0,n.jsx)(c,{stage:`Teklif`}),(0,n.jsx)(c,{stage:`Kaparo`}),(0,n.jsx)(c,{stage:`Tapu`})]})};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    status: 'Aktif'
  },
  argTypes: {
    status: {
      control: 'inline-radio',
      options: ['Aktif', 'Pasif', 'Taslak']
    }
  },
  render: args => <div className="flex flex-wrap items-center gap-3">
      <StatusChip {...args} />
      <StatusChip status="Aktif" />
      <StatusChip status="Pasif" />
      <StatusChip status="Taslak" />
    </div>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    status: 'Aktif'
  },
  render: () => <div className="flex flex-wrap items-center gap-3">
      <SegmentChip segment="Sıcak" />
      <SegmentChip segment="Ilık" />
      <SegmentChip segment="Soğuk" />
    </div>,
  parameters: {
    docs: {
      description: {
        story: 'Customer segment chips. Sıcak = active opportunity, Ilık = engaged, Soğuk = follow-up.'
      }
    }
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    status: 'Aktif'
  },
  render: () => <div className="flex flex-wrap items-center gap-3">
      <TypeChip type="İmarlı" />
      <TypeChip type="Tarla" />
      <TypeChip type="Zeytinlik" />
      <TypeChip type="Villa Arsası" />
    </div>
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    status: 'Aktif'
  },
  render: () => <div className="flex flex-col gap-2">
      <StageChip stage="İlk temas" />
      <StageChip stage="Görüşme" />
      <StageChip stage="Teklif" />
      <StageChip stage="Kaparo" />
      <StageChip stage="Tapu" />
    </div>
}`,...h.parameters?.docs?.source}}};var g=[`Status`,`Segments`,`Types`,`Stage`];export{p as Segments,h as Stage,f as Status,m as Types,g as __namedExportsOrder,d as default};