import { Closer } from './components/Closer'
import { Coach } from './components/Coach'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Kids } from './components/Kids'
import { MobileCtaBar } from './components/MobileCtaBar'
import { Programs } from './components/Programs'
import { RecordBand } from './components/RecordBand'
import { Schedule } from './components/Schedule'
import { VisitStrip } from './components/VisitStrip'
import { SHOW_RECORD_BAND } from './data/site'
import { useSchedule } from './hooks/useSchedule'
import { onAnchorClick, useCleanInitialHash } from './lib/anchors'

export function App() {
  const schedule = useSchedule()
  useCleanInitialHash()

  return (
    // Bottom padding clears the sticky mobile CTA bar so it can
    // never cover the footer.
    <div className="pb-[76px] lg:pb-0">
      <a
        href="#schedule"
        onClick={onAnchorClick}
        className="bg-amber text-midnight sr-only px-4 py-3 font-bold focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-60"
      >
        Skip to the schedule
      </a>

      <Header />

      <main>
        <Hero />
        <Schedule schedule={schedule} />
        <Programs />
        {SHOW_RECORD_BAND && <RecordBand />}
        <Kids />
        <Coach />
        <Closer />
        <VisitStrip />
      </main>

      <Footer />
      <MobileCtaBar />
    </div>
  )
}
