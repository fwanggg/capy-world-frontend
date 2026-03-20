interface PersonaArchetypeCardProps {
  readonly name: string
  readonly role: string
  readonly tags: readonly string[]
  readonly cognitiveLoad?: number
}

export function PersonaArchetypeCard({
  name,
  role,
  tags,
  cognitiveLoad = 1,
}: Readonly<PersonaArchetypeCardProps>) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')

  return (
    <div className="p-6 bg-surface-container rounded-xl border border-outline-variant/5 hover:border-primary-container/20 transition-all shadow-sm relative">
      <button
        className="absolute top-4 right-4 material-symbols-outlined text-on-surface-variant hover:text-on-surface text-xl p-1 rounded"
        aria-label="More options"
      >
        more_vert
      </button>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center font-bold text-primary-container flex-shrink-0">
          {initials}
        </div>
        <div>
          <h3 className="text-lg font-bold text-on-surface font-headline">{name}</h3>
          <p className="text-sm text-on-surface-variant font-body">{role}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-3 py-1 rounded-full bg-primary-container/10 text-primary-container font-bold uppercase tracking-tighter"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mb-4">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] block mb-2">
          Cognitive Load
        </span>
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-sm ${
                i <= cognitiveLoad ? 'bg-primary-container' : 'bg-surface-variant'
              }`}
            />
          ))}
        </div>
      </div>
      <button className="w-full py-2.5 rounded-lg text-sm font-medium text-primary-container hover:bg-primary-container/10 transition-colors border border-primary-container/20">
        View Responses
      </button>
    </div>
  )
}
