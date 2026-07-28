import { SITE, smsHref } from '../data/site'
import { Picture } from './Picture'

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-[560px] items-end lg:h-[660px]">
      <div className="absolute inset-0">
        <Picture
          id="hero-team"
          alt="The SPI Jiu Jitsu team together after a competition, holding a championship belt."
          sizes="100vw"
          priority
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,20,40,.45)_0%,rgba(10,20,40,.55)_40%,rgba(7,16,31,.97)_100%)]"
      />

      <div className="relative flex w-full flex-col items-start justify-between gap-10 px-5 pt-24 pb-12 sm:px-8 lg:flex-row lg:items-end lg:gap-[60px] lg:px-12 lg:pt-0 lg:pb-[60px]">
        <div className="flex max-w-[820px] flex-col gap-4 lg:gap-[22px]">
          <span className="kicker text-amber self-start border border-[#3a4a66] px-3 py-2 tracking-[0.16em]">
            {SITE.affiliate} affiliate · {SITE.city}, {SITE.state}
          </span>
          <h1 className="font-display text-hero m-0 tracking-[0.005em] uppercase">
            Train jiu jitsu
            <br />
            in {SITE.city}.
          </h1>
          <p className="text-body m-0 max-w-[520px] text-[17px] leading-[1.55] sm:text-lg lg:text-xl">
            Four nights a week, minutes from the causeway. Your first class is free.
          </p>
        </div>

        <a
          href={smsHref}
          className="bg-amber text-midnight hover:bg-bone flex w-full flex-none flex-col gap-[5px] px-6 py-5 transition-colors sm:w-auto lg:px-[30px] lg:py-[22px]"
        >
          <span className="font-mono text-[11px] tracking-[0.12em] uppercase opacity-75">
            Fastest way in — text us
          </span>
          <span className="font-display text-phone font-extrabold whitespace-nowrap">
            {SITE.phone}
          </span>
        </a>
      </div>
    </section>
  )
}
