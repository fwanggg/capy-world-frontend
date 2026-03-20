import {
  LandingNav,
  HeroBadge,
  HeroHeadline,
  HeroSubheadline,
  CTAForm,
  SocialProof,
  LandingFooter,
} from '@/components/landing'

export default function Home() {
  return (
    <>
      <LandingNav />
      <div className="flex flex-col pt-20">
        <main className="w-full">
          <section className="relative min-h-[80vh] flex items-center justify-center px-8 bg-hero-gradient">
            <div className="max-w-4xl mx-auto text-center z-10">
              <HeroBadge />
              <HeroHeadline />
              <HeroSubheadline />
              <CTAForm />
              <SocialProof />
            </div>
          </section>
          <LandingFooter />
        </main>
      </div>
    </>
  )
}
