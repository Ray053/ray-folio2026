import { HeroSection } from '@/components/sections/HeroSection'
import { ProfileSection } from '@/components/sections/ProfileSection'
import { ProjectsSection } from '@/components/sections/ProjectsSection'
import { DanceTeaser } from '@/components/sections/DanceTeaser'
import { Marquee } from '@/components/ui/Marquee'
import { UnifiedTrajectory } from '@/components/ui/UnifiedTrajectory'
import { JourneyBallMount } from '@/components/three/JourneyBallMount'
import { getProjects, getSiteInfo } from '@/lib/payload'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [projects, site] = await Promise.all([getProjects(locale), getSiteInfo(locale)])

  return (
    <>
      <JourneyBallMount />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection />

        <UnifiedTrajectory>
          <ProfileSection photoSrc={site?.photoSrc} />
          <ProjectsSection projects={projects} />
        </UnifiedTrajectory>

        <Marquee items={['UX DESIGN', 'CREATIVE', 'INTERACTION', 'DANCE', 'MOTION']} />

        <DanceTeaser />
      </div>
    </>
  )
}
