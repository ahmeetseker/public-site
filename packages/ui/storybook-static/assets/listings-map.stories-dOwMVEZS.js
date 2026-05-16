const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./listings-map-C8haDaYT.js","./iframe-DXHzNi9d.js","./react-dom-CPmNDYj5.js","./react-B4BxEtKI.js","./jsx-runtime-Yq6KkvIc.js","./cn-BiX_BwfA.js","./clsx-pVRQNNR0.js","./leaflet-Dq1Hs8bZ.css"])))=>i.map(i=>d[i]);
import{l as e,t}from"./iframe-DXHzNi9d.js";import{t as n}from"./react-B4BxEtKI.js";import{t as r}from"./jsx-runtime-Yq6KkvIc.js";var i=e(n(),1),a=r(),o=(0,i.lazy)(async()=>{let e=await t(()=>import(`./listings-map-C8haDaYT.js`),__vite__mapDeps([0,1,2,3,4,5,6]),import.meta.url);return await t(()=>Promise.resolve({}),__vite__mapDeps([7]),import.meta.url),{default:e.ListingsMap}}),s=[{id:`1`,title:`4 dönüm Foça arsa`,district:`Foça`,city:`İzmir`,type:`İmarlı`,status:`Aktif`,price:85e5,size:4e3,lat:38.6726,lng:26.7572},{id:`2`,title:`Çeşme zeytinlik`,district:`Çeşme`,city:`İzmir`,type:`Zeytinlik`,status:`Aktif`,price:124e5,size:6500,lat:38.3236,lng:26.3037},{id:`3`,title:`Urla villa arsası`,district:`Urla`,city:`İzmir`,type:`Villa Arsası`,status:`Taslak`,price:249e5,size:2200,lat:38.3236,lng:26.7649}],c={title:`Maps/ListingsMap`,component:o,parameters:{layout:`fullscreen`,docs:{description:{component:"Leaflet-based listings map. Pulls `window`/DOM globals at module load → consumed only as a `client:only` island in Astro and **dynamic-imported** inside Storybook. Markers are custom divIcons keyed by `status`; `FitBounds` auto-frames to visible markers."}}},tags:[]},l=()=>(0,a.jsx)(`div`,{className:`grid h-[480px] w-full place-items-center bg-muted text-sm text-muted-foreground`,children:`Map yükleniyor…`}),u={args:{listings:s,height:480},render:e=>(0,a.jsx)(`div`,{className:`p-8`,children:(0,a.jsx)(i.Suspense,{fallback:(0,a.jsx)(l,{}),children:(0,a.jsx)(o,{...e})})})},d={args:{listings:[s[0]],height:360},render:e=>(0,a.jsx)(`div`,{className:`p-8`,children:(0,a.jsx)(i.Suspense,{fallback:(0,a.jsx)(l,{}),children:(0,a.jsx)(o,{...e})})})};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    listings: SAMPLE,
    height: 480
  },
  render: args => <div className="p-8">
      <Suspense fallback={<Fallback />}>
        <ListingsMap {...args} />
      </Suspense>
    </div>
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    listings: [SAMPLE[0]],
    height: 360
  },
  render: args => <div className="p-8">
      <Suspense fallback={<Fallback />}>
        <ListingsMap {...args} />
      </Suspense>
    </div>
}`,...d.parameters?.docs?.source}}};var f=[`Default`,`SinglePin`];export{u as Default,d as SinglePin,f as __namedExportsOrder,c as default};