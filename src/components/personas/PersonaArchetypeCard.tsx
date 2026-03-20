interface PersonaArchetypeCardProps {
  readonly name: string
  readonly role: string
  readonly tags: readonly string[]
}

export function PersonaArchetypeCard({ name, role, tags }: Readonly<PersonaArchetypeCardProps>) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')

  return (
    <div className="p-6 bg-surface-container rounded-xl border border-outline-variant/5 hover:border-primary-container/20 transition-all shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center font-bold text-primary-container mb-4">
        {initials}
      </div>
      <h3 className="text-lg font-bold text-on-surface font-headline mb-1">{name}</h3>
      <p className="text-sm text-on-surface-variant font-body mb-4">{role}</p>
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
      <button className="w-full py-2.5 rounded-lg text-sm font-medium text-primary-container hover:bg-primary-container/10 transition-colors border border-primary-container/20">
        View Responses
      </button>
    </div>
  )
}
