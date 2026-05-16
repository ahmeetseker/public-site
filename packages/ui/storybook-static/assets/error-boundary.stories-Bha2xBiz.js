import{l as e}from"./iframe-DXHzNi9d.js";import{t}from"./react-B4BxEtKI.js";import{t as n}from"./jsx-runtime-Yq6KkvIc.js";var r=e(t(),1),i=n(),a=(e,t)=>(0,i.jsxs)(`div`,{role:`alert`,className:`m-4 flex flex-col gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/[0.04] p-6 text-sm`,children:[(0,i.jsx)(`div`,{className:`font-mono text-[10px] uppercase tracking-[0.18em] text-rose-700`,children:`BEKLENMEDIK HATA`}),(0,i.jsxs)(`div`,{className:`font-serif text-xl font-light`,children:[`Bir şeyler `,(0,i.jsx)(`em`,{className:`italic font-light text-muted-foreground`,children:`ters gitti.`})]}),(0,i.jsx)(`p`,{className:`text-muted-foreground`,children:`Sayfa bileşeni render edilirken bir hata yakaladık. Yeniden denemek için aşağıdaki düğmeyi kullanın; hata teknik ekibe iletildi.`}),(0,i.jsxs)(`details`,{className:`rounded-lg border border-border bg-card p-3 text-xs`,children:[(0,i.jsx)(`summary`,{className:`cursor-pointer font-mono text-[11px] text-muted-foreground`,children:`Teknik ayrıntı`}),(0,i.jsx)(`pre`,{className:`mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[11px] text-muted-foreground`,children:e.message})]}),(0,i.jsx)(`button`,{type:`button`,onClick:t,className:`self-start rounded-xl border border-border bg-card px-4 py-1.5 text-sm font-medium transition hover:bg-foreground/5`,children:`Yeniden dene`})]}),o=class extends r.Component{state={error:null};static getDerivedStateFromError(e){return{error:e}}componentDidCatch(e,t){try{this.props.onError?.(e,t)}catch{}}reset=()=>{this.setState({error:null})};render(){return this.state.error?(this.props.fallback??a)(this.state.error,this.reset):this.props.children}};try{o.displayName=`ErrorBoundary`,o.__docgenInfo={description:"Class-based ErrorBoundary — React's official `componentDidCatch` hook is\nstill class-only. Wrap your route shell with it; pass `onError` to forward\nexceptions into Sentry / your logger.",displayName:`ErrorBoundary`,props:{fallback:{defaultValue:null,description:`Optional fallback renderer. Receives the captured error + reset handle.`,name:`fallback`,required:!1,type:{name:`((error: Error, reset: () => void) => ReactNode) | undefined`}},onError:{defaultValue:null,description:`Side-channel for telemetry (Sentry, console, custom logger).`,name:`onError`,required:!1,type:{name:`((error: Error, info: ErrorInfo) => void) | undefined`}}}}}catch{}var s={title:`Feedback/ErrorBoundary`,component:o,parameters:{layout:`padded`,docs:{description:{component:"Class-based React error boundary. Wrap routes / shells with it; pass `onError` for telemetry. The default fallback ships with a Turkish copy + retry button."}}},tags:[`autodocs`]};function c(){throw Error(`Boom — simulated render failure for the Storybook fallback demo.`)}var l={render:()=>(0,i.jsx)(`div`,{className:`w-[640px]`,children:(0,i.jsx)(o,{children:(0,i.jsx)(c,{})})})},u={render:()=>(0,i.jsx)(`div`,{className:`w-[640px]`,children:(0,i.jsx)(o,{fallback:(e,t)=>(0,i.jsxs)(`div`,{className:`rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-6`,children:[(0,i.jsx)(`div`,{className:`font-mono text-[10px] uppercase tracking-[0.18em] text-amber-700`,children:`ÖZEL FALLBACK`}),(0,i.jsxs)(`p`,{className:`mt-2 text-sm text-muted-foreground`,children:[`Hata: `,(0,i.jsx)(`span`,{className:`font-mono`,children:e.message})]}),(0,i.jsx)(`button`,{type:`button`,onClick:t,className:`mt-3 rounded-xl border border-border bg-card px-3 py-1.5 text-sm`,children:`Sıfırla`})]}),children:(0,i.jsx)(c,{})})})},d={render:()=>(0,i.jsx)(o,{children:(0,i.jsxs)(`div`,{className:`rounded-2xl border border-border bg-card p-6`,children:[(0,i.jsx)(`div`,{className:`font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground`,children:`MUTLU YOL`}),(0,i.jsx)(`p`,{className:`mt-2 text-sm`,children:`Çocuk render başarılı → boundary hiç görünmez.`})]})})};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-[640px]">
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    </div>
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-[640px]">
      <ErrorBoundary fallback={(error, reset) => <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-700">
              ÖZEL FALLBACK
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Hata: <span className="font-mono">{error.message}</span>
            </p>
            <button type="button" onClick={reset} className="mt-3 rounded-xl border border-border bg-card px-3 py-1.5 text-sm">
              Sıfırla
            </button>
          </div>}>
        <Boom />
      </ErrorBoundary>
    </div>
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <ErrorBoundary>
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          MUTLU YOL
        </div>
        <p className="mt-2 text-sm">Çocuk render başarılı → boundary hiç görünmez.</p>
      </div>
    </ErrorBoundary>
}`,...d.parameters?.docs?.source}}};var f=[`DefaultFallback`,`CustomFallback`,`Healthy`];export{u as CustomFallback,l as DefaultFallback,d as Healthy,f as __namedExportsOrder,s as default};