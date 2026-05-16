import{t as e}from"./jsx-runtime-Yq6KkvIc.js";import{t}from"./page-shell-C-JUkDSj.js";var n=e(),r={title:`Shell/PageShell`,component:t,parameters:{layout:`fullscreen`,docs:{description:{component:`Standard admin/page chrome — eyebrow + serif title + description + optional action slot. Max-width 1280px, generous top/bottom padding.`}}},tags:[`autodocs`]},i={args:{title:(0,n.jsxs)(n.Fragment,{children:[`İlanlarım `,(0,n.jsx)(`em`,{className:`font-serif italic font-light`,children:`— 42 aktif`})]}),description:`Yayında, taslak ve pasif ilanların burada listelenir.`,children:(0,n.jsx)(`div`,{className:`rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground`,children:`Sayfa içeriği — tablo, grid veya custom layout buraya gelir.`})}},a={args:{eyebrow:`PORTFÖY`,title:`Müşteriler`,description:`Pipeline'daki tüm müşteri kayıtları.`,actions:(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(`button`,{type:`button`,className:`rounded-lg border border-border bg-card px-3 py-1.5 text-sm`,children:`İçeri aktar`}),(0,n.jsx)(`button`,{type:`button`,className:`rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background`,children:`Yeni müşteri`})]}),children:(0,n.jsx)(`div`,{className:`grid grid-cols-3 gap-4`,children:Array.from({length:6}).map((e,t)=>(0,n.jsx)(`div`,{className:`h-32 rounded-2xl border border-border bg-card`},t))})}},o={args:{title:`Ayarlar`,children:(0,n.jsx)(`div`,{className:`text-sm text-muted-foreground`,children:`Form içeriği.`})}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    title: <>
        İlanlarım <em className="font-serif italic font-light">— 42 aktif</em>
      </>,
    description: 'Yayında, taslak ve pasif ilanların burada listelenir.',
    children: <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Sayfa içeriği — tablo, grid veya custom layout buraya gelir.
      </div>
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    eyebrow: 'PORTFÖY',
    title: 'Müşteriler',
    description: 'Pipeline\\'daki tüm müşteri kayıtları.',
    actions: <>
        <button type="button" className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm">
          İçeri aktar
        </button>
        <button type="button" className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background">
          Yeni müşteri
        </button>
      </>,
    children: <div className="grid grid-cols-3 gap-4">
        {Array.from({
        length: 6
      }).map((_, i) => <div key={i} className="h-32 rounded-2xl border border-border bg-card" />)}
      </div>
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Ayarlar',
    children: <div className="text-sm text-muted-foreground">Form içeriği.</div>
  }
}`,...o.parameters?.docs?.source}}};var s=[`Basic`,`WithEyebrowAndActions`,`Minimal`];export{i as Basic,o as Minimal,a as WithEyebrowAndActions,s as __namedExportsOrder,r as default};