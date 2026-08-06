import { HeroSection } from '@/components/sections/HeroSection'
import { ProfileSection } from '@/components/sections/ProfileSection'
import { ProjectsSection } from '@/components/sections/ProjectsSection'
import { DanceGallery } from '@/components/sections/DanceGallery'
import { Marquee } from '@/components/ui/Marquee'
import { UnifiedTrajectory } from '@/components/ui/UnifiedTrajectory'
import { JourneyBallMount } from '@/components/three/JourneyBallMount'
import { getProjects, getSiteInfo, getDanceVideos, type DanceVideo } from '@/lib/payload'

// Shown only when the CMS has no dance videos yet, so the gallery still demos.
const PLACEHOLDER_DANCE: DanceVideo[] = [
  { id: 'd1', title: 'Freestyle Session', year: 2025, location: 'Taipei' },
  { id: 'd2', title: 'Crew Collab', year: 2025, location: 'Tainan' },
  { id: 'd3', title: 'Street Jam', year: 2024, location: 'Taipei' },
  { id: 'd4', title: 'Solo Cut', year: 2024, location: 'Studio' },
  { id: 'd5', title: 'Cypher', year: 2023, location: 'Taipei' },
]

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [projects, site, danceCms] = await Promise.all([
    getProjects(locale), getSiteInfo(locale), getDanceVideos(locale),
  ])
  const dance = danceCms.length ? danceCms : PLACEHOLDER_DANCE

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
