interface PipelineStep {
  readonly label: string
  readonly title: string
  readonly desc: string
}

interface AnalysisPipelineCardProps {
  readonly steps: readonly PipelineStep[]
}

export function AnalysisPipelineCard({ steps }: Readonly<AnalysisPipelineCardProps>) {
  return (
    <div className="col-span-12 lg:col-span-4 p-8 bg-surface-container rounded-xl border border-outline-variant/10">
      <h3 className="text-lg font-headline font-extrabold mb-8 text-primary-container">
        Analysis Engine Pipeline
      </h3>
      <div className="flex flex-col gap-0">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1
          return (
            <div
              key={step.label}
              className={`flex gap-4 relative ${isLast ? 'pb-0' : 'pb-8'} border-l-2 ${isLast ? 'border-primary-container/30' : 'border-primary-container'}`}
            >
              <div
                className={`absolute -left-2 top-0 w-4 h-4 rounded-full ${
                  isLast ? 'border-2 border-primary-container/30 bg-surface-container -left-[9px]' : 'bg-primary-container shadow-[0_0_12px_var(--color-primary-container)]'
                }`}
              />
              <div className={isLast ? 'pl-10' : 'pl-6'}>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                  {step.label}
                </p>
                <h4 className="text-sm font-bold text-on-surface">{step.title}</h4>
                <p className="text-xs text-on-surface-variant mt-1">{step.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
