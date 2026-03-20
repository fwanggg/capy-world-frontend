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
    <div className="col-span-12 lg:col-span-4 p-8 bg-[#1e293b]/60 rounded-xl border border-[#334155]/40">
      <h3 className="text-lg font-headline font-extrabold mb-8 text-[#14B8A6]">
        Analysis Engine Pipeline
      </h3>
      <div className="flex flex-col gap-0">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1
          return (
            <div
              key={step.label}
              className={`flex gap-4 relative ${isLast ? 'pb-0' : 'pb-8'} border-l-2 ${isLast ? 'border-[#14B8A6]/30' : 'border-[#14B8A6]'}`}
            >
              <div
                className={`absolute -left-2 top-0 w-4 h-4 rounded-full ${
                  isLast ? 'border-2 border-[#14B8A6]/30 bg-[#0B1117] -left-[9px]' : 'bg-[#14B8A6] shadow-[0_0_12px_rgba(20,184,166,0.5)]'
                }`}
              />
              <div className={isLast ? 'pl-10' : 'pl-6'}>
                <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">
                  {step.label}
                </p>
                <h4 className="text-sm font-bold text-white">{step.title}</h4>
                <p className="text-xs text-[#94a3b8] mt-1">{step.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
