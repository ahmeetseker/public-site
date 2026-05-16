import{t as e}from"./jsx-runtime-Yq6KkvIc.js";import{t}from"./cn-BiX_BwfA.js";import{t as n}from"./createLucideIcon-BxMXSNcO.js";var r=n(`inbox`,[[`polyline`,{points:`22 12 16 12 14 15 10 15 8 12 2 12`,key:`o97t9d`}],[`path`,{d:`M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z`,key:`oot6mr`}]]),i=e();function a({icon:e,title:n=`Burada henüz bir şey yok`,description:a=`Yeni bir kayıt eklediğinde burada göreceksin.`,action:o,className:s}){return(0,i.jsxs)(`div`,{className:t(`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center`,s),children:[(0,i.jsx)(`div`,{className:`flex h-10 w-10 items-center justify-center rounded-full bg-foreground/[0.05] text-muted-foreground`,children:e??(0,i.jsx)(r,{className:`h-5 w-5`})}),(0,i.jsxs)(`div`,{className:`space-y-1`,children:[(0,i.jsx)(`h3`,{className:`font-serif text-lg`,children:n}),(0,i.jsx)(`p`,{className:`text-sm text-muted-foreground`,children:a})]}),o&&(0,i.jsx)(`div`,{className:`mt-2`,children:o})]})}try{a.displayName=`EmptyState`,a.__docgenInfo={description:``,displayName:`EmptyState`,props:{icon:{defaultValue:null,description:``,name:`icon`,required:!1,type:{name:`ReactNode`}},title:{defaultValue:{value:`Burada henüz bir şey yok`},description:``,name:`title`,required:!1,type:{name:`string | undefined`}},description:{defaultValue:{value:`Yeni bir kayıt eklediğinde burada göreceksin.`},description:``,name:`description`,required:!1,type:{name:`string | undefined`}},action:{defaultValue:null,description:``,name:`action`,required:!1,type:{name:`ReactNode`}},className:{defaultValue:null,description:``,name:`className`,required:!1,type:{name:`string | undefined`}}}}}catch{}var o={title:`Feedback/EmptyState`,component:a,parameters:{layout:`padded`,docs:{description:{component:'Empty-state placeholder. Default copy is in Turkish ("Burada henüz bir şey yok"). Pass an `action` slot for a CTA, e.g. "Yeni kayıt ekle" button.'}}},tags:[`autodocs`],argTypes:{title:{control:`text`},description:{control:`text`},className:{control:`text`}}},s={args:{},decorators:[e=>(0,i.jsx)(`div`,{className:`w-[480px]`,children:(0,i.jsx)(e,{})})]},c={args:{title:`Hiç ilan yok`,description:`Bu kategoride henüz ilan paylaşılmadı. Filtrelerini değiştirmeyi dener misin?`},decorators:[e=>(0,i.jsx)(`div`,{className:`w-[480px]`,children:(0,i.jsx)(e,{})})]},l={args:{title:`Müşteri listen boş`,description:`Bir kayıt eklediğinde burada listelenecek.`,action:(0,i.jsx)(`button`,{type:`button`,className:`inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background`,children:`Yeni müşteri ekle`})},decorators:[e=>(0,i.jsx)(`div`,{className:`w-[480px]`,children:(0,i.jsx)(e,{})})]};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {},
  decorators: [Story => <div className="w-[480px]">
        <Story />
      </div>]
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Hiç ilan yok',
    description: 'Bu kategoride henüz ilan paylaşılmadı. Filtrelerini değiştirmeyi dener misin?'
  },
  decorators: [Story => <div className="w-[480px]">
        <Story />
      </div>]
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Müşteri listen boş',
    description: 'Bir kayıt eklediğinde burada listelenecek.',
    action: <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background">
        Yeni müşteri ekle
      </button>
  },
  decorators: [Story => <div className="w-[480px]">
        <Story />
      </div>]
}`,...l.parameters?.docs?.source}}};var u=[`Default`,`WithCustomCopy`,`WithAction`];export{s as Default,l as WithAction,c as WithCustomCopy,u as __namedExportsOrder,o as default};