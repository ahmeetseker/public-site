import{t as e}from"./jsx-runtime-Yq6KkvIc.js";import{t}from"./cn-BiX_BwfA.js";import{t as n}from"./createLucideIcon-BxMXSNcO.js";var r=n(`circle-alert`,[[`circle`,{cx:`12`,cy:`12`,r:`10`,key:`1mglay`}],[`line`,{x1:`12`,x2:`12`,y1:`8`,y2:`12`,key:`1pkeuh`}],[`line`,{x1:`12`,x2:`12.01`,y1:`16`,y2:`16`,key:`4dfq90`}]]),i=n(`refresh-cw`,[[`path`,{d:`M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8`,key:`v9h5vc`}],[`path`,{d:`M21 3v5h-5`,key:`1q7to0`}],[`path`,{d:`M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16`,key:`3uifl3`}],[`path`,{d:`M8 16H3v5`,key:`1cv678`}]]),a=e();function o({title:e=`Bir şeyler ters gitti`,description:n=`Veri yüklenirken bir sorun çıktı. Tekrar dener misin?`,error:o,onRetry:s,className:c}){return(0,a.jsxs)(`div`,{role:`alert`,className:t(`flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card px-6 py-10 text-center`,c),children:[(0,a.jsx)(`div`,{className:`flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:bg-red-400/10 dark:text-red-400`,children:(0,a.jsx)(r,{className:`h-5 w-5`})}),(0,a.jsxs)(`div`,{className:`space-y-1`,children:[(0,a.jsx)(`h3`,{className:`font-serif text-lg`,children:e}),(0,a.jsx)(`p`,{className:`text-sm text-muted-foreground`,children:n}),o&&!1]}),s&&(0,a.jsxs)(`button`,{type:`button`,onClick:s,className:`mt-2 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90`,children:[(0,a.jsx)(i,{className:`h-3.5 w-3.5`}),`Tekrar dene`]})]})}try{o.displayName=`ErrorState`,o.__docgenInfo={description:``,displayName:`ErrorState`,props:{title:{defaultValue:{value:`Bir şeyler ters gitti`},description:``,name:`title`,required:!1,type:{name:`string | undefined`}},description:{defaultValue:{value:`Veri yüklenirken bir sorun çıktı. Tekrar dener misin?`},description:``,name:`description`,required:!1,type:{name:`string | undefined`}},error:{defaultValue:null,description:``,name:`error`,required:!1,type:{name:`Error | null | undefined`}},onRetry:{defaultValue:null,description:``,name:`onRetry`,required:!1,type:{name:`(() => void) | undefined`}},className:{defaultValue:null,description:``,name:`className`,required:!1,type:{name:`string | undefined`}}}}}catch{}var s={title:`Feedback/ErrorState`,component:o,parameters:{layout:`padded`,docs:{description:{component:'Error placeholder. `role="alert"` for screen readers; pass `onRetry` to render a retry button; pass `error` to show diagnostic message in DEV builds only.'}}},tags:[`autodocs`],argTypes:{title:{control:`text`},description:{control:`text`}}},c={args:{},decorators:[e=>(0,a.jsx)(`div`,{className:`w-[480px]`,children:(0,a.jsx)(e,{})})]},l={args:{onRetry:()=>{console.log(`retry clicked`)}},decorators:[e=>(0,a.jsx)(`div`,{className:`w-[480px]`,children:(0,a.jsx)(e,{})})]},u={args:{title:`İlanlar yüklenemedi`,description:`Sunucuya ulaşılamadı. İnternetini kontrol edip tekrar dener misin?`,error:Error(`NetworkError: failed to fetch /api/listings`),onRetry:()=>{console.log(`retry`)}},decorators:[e=>(0,a.jsx)(`div`,{className:`w-[480px]`,children:(0,a.jsx)(e,{})})]};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {},
  decorators: [Story => <div className="w-[480px]">
        <Story />
      </div>]
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    onRetry: () => {
      // eslint-disable-next-line no-console
      console.log('retry clicked');
    }
  },
  decorators: [Story => <div className="w-[480px]">
        <Story />
      </div>]
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'İlanlar yüklenemedi',
    description: 'Sunucuya ulaşılamadı. İnternetini kontrol edip tekrar dener misin?',
    error: new Error('NetworkError: failed to fetch /api/listings'),
    onRetry: () => {
      // eslint-disable-next-line no-console
      console.log('retry');
    }
  },
  decorators: [Story => <div className="w-[480px]">
        <Story />
      </div>]
}`,...u.parameters?.docs?.source}}};var d=[`Default`,`WithRetry`,`WithErrorDetail`];export{c as Default,u as WithErrorDetail,l as WithRetry,d as __namedExportsOrder,s as default};