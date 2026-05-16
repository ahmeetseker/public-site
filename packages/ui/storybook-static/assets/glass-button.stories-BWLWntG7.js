import{t as e}from"./jsx-runtime-Yq6KkvIc.js";import{t}from"./glass-button-gISG6mKR.js";var n=e(),r={title:`Primitives/GlassButton`,component:t,parameters:{layout:`centered`,backgrounds:{default:`paper`},docs:{description:{component:'Apple Liquid Glass button. Wrapper has `--radius-chip` squircle radius; inner CSS uses 9999px pill (anayasa "ezme" rule). Variants: size = default | sm | lg | icon.'}}},tags:[`autodocs`],argTypes:{size:{control:`inline-radio`,options:[`default`,`sm`,`lg`,`icon`]}}},i={args:{size:`default`,children:`Glass button`}},a={args:{size:`sm`,children:`Small action`}},o={args:{size:`lg`,children:`Önemli işlem`}},s={args:{children:`Default`},render:()=>(0,n.jsxs)(`div`,{className:`flex items-center gap-4`,children:[(0,n.jsx)(t,{size:`sm`,children:`Small`}),(0,n.jsx)(t,{size:`default`,children:`Default`}),(0,n.jsx)(t,{size:`lg`,children:`Large`})]})};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'default',
    children: 'Glass button'
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'sm',
    children: 'Small action'
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'lg',
    children: 'Önemli işlem'
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Default'
  },
  render: () => <div className="flex items-center gap-4">
      <GlassButton size="sm">Small</GlassButton>
      <GlassButton size="default">Default</GlassButton>
      <GlassButton size="lg">Large</GlassButton>
    </div>
}`,...s.parameters?.docs?.source}}};var c=[`Default`,`Small`,`Large`,`Sizes`];export{i as Default,o as Large,s as Sizes,a as Small,c as __namedExportsOrder,r as default};