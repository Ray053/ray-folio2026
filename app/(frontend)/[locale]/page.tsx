import { HeroSection } from '@/components/sections/HeroSection'
import { ProfileSection } from '@/components/sections/ProfileSection'
import { ProjectsSection } from '@/components/sections/ProjectsSection'
import { DanceGallery } from '@/components/sections/DanceGallery'
import { Marquee } from '@/components/ui/Marquee'
import { UnifiedTrajectory } from '@/components/ui/UnifiedTrajectory'
import { JourneyBallMount } from '@/components/three/JourneyBallMount'
import { getProjects, getSiteInfo, getDanceVideos } from '@/lib/payload'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [projects, site, dance] = await Promise.all([
    getProjects(locale), getSiteInfo(locale), getDanceVideos(locale),
  ])

  return (
    <>
      <JourneyBallMount danceItems={dance} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection />

        <UnifiedTrajectory>
          <ProfileSection photoSrc={site?.photoSrc} />
          <ProjectsSection projects={projects} />
        </UnifiedTrajectory>

        <Marquee items={['UX DESIGN', 'CREATIVE', 'INTERACTION', 'DANCE', 'MOTION']} />

        <DanceGallery items={dance} />
      </div>
    </>
  )
}
