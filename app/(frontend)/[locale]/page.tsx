import { HeroSection } from '@/components/sections/HeroSection'
import { ProfileSection } from '@/components/sections/ProfileSection'
import { ProjectsSection } from '@/components/sections/ProjectsSection'
import { DanceGallery } from '@/components/sections/DanceGallery'
import { Marquee } from '@/components/ui/Marquee'
import { UnifiedTrajectory } from '@/components/ui/UnifiedTrajectory'
import { JourneyBallMount } from '@/components/three/JourneyBallMount'
import { getProjects, getSiteInfo, getDanceVideos, type DanceVideo } from '@/lib/payload'

// Default dance clips — the Payload CMS 'dance-videos' collection overrides
// these whenever it has entries.
const DANCE_VIDEOS: DanceVideo[] = [
  { id: 'd1', title: 'Freestyle', year: 2025, videoSrc: '/dance1.webm' },
  { id: 'd2', title: 'Crew Collab', year: 2025, videoSrc: '/dance2.webm' },
  { id: 'd3', title: 'Street Jam', year: 2024, videoSrc: '/dance3.mp4' },
]

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [projects, site, danceCms] = await Promise.all([
    getProjects(locale), getSiteInfo(locale), getDanceVideos(locale),
  ])
  const dance = danceCms.length ? danceCms : DANCE_VIDEOS

  return (
    <>
      <JourneyBallMount danceItems={dance} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection />

        <UnifiedTrajectory>
          <ProfileSection photoSrc={site?.photoSrc} bio={site?.bio} />
          <ProjectsSection projects={projects} />
        </UnifiedTrajectory>

        <Marquee items={['UX DESIGN', 'CREATIVE', 'INTERACTION', 'DANCE', 'MOTION']} />

        <DanceGallery items={dance} />
      </div>
    </>
  )
}
