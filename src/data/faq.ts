/**
 * The questions people actually ask before a first class.
 *
 * This exists for two audiences at once. A visitor deciding tonight
 * reads it as objection handling. An AI answer engine — ChatGPT,
 * Perplexity, Google's AI Overviews — lifts individual answers as
 * passages, which is why each one is written to survive being quoted
 * with no surrounding context: the answer lands in the first sentence,
 * the gym is named rather than called "we" where it matters, and every
 * number is stated rather than implied.
 *
 * The same array renders the visible section and the FAQPage JSON-LD.
 * Marking up a question that isn't on the page is a structured-data
 * violation, so they must not be allowed to diverge — hence one source.
 *
 * Times and ages interpolate from classes.ts. Nothing here may state a
 * fact the site can't stand behind; see README "Still open with the
 * client" for the one answer that is waiting on the gym.
 */
import {
  beginnerClass,
  CLASSES,
  isGiDay,
  openDaysSummary,
  type Day,
} from './classes'
import { ADDRESS, SITE } from './site'

export interface FaqItem {
  q: string
  a: string
}

/** "Mon & Wed" — the nights matching a predicate, for the kit answer. */
function nights(predicate: (day: Day) => boolean): string {
  const days = [...new Set(CLASSES.map((c) => c.day))].filter(predicate)
  return days.length === 2 ? days.join(' and ') : days.join(', ')
}

/** "Little Ninjas (4–6)" for every distinct class, in schedule order. */
function ageBands(): string {
  const seen = new Map<string, string>()
  for (const c of CLASSES) if (!seen.has(c.name)) seen.set(c.name, c.detail)
  return [...seen].map(([name, detail]) => `${name} (${detail.replace(/^Ages /, '')})`).join(', ')
}

export function faqItems(): FaqItem[] {
  const beginner = beginnerClass()
  const gi = nights(isGiDay)
  const noGi = nights((d) => !isGiDay(d))

  return [
    {
      q: 'Do I need any experience to start jiu jitsu?',
      a: beginner
        ? `No. The ${beginner.name} class at ${beginner.time} takes complete beginners on any night it runs, and most people who walk into ${SITE.name} have never trained before. There is nothing to learn in advance.`
        : `No. ${SITE.name} takes complete beginners on any night, and most people who walk in have never trained before.`,
    },
    {
      q: 'What should I wear to my first class?',
      a: `On no-gi nights (${noGi}), wear shorts or spats and a t-shirt or rashguard, and bring water. ${gi} are gi nights — text ${SITE.phone} before you come and we'll tell you what to wear, because ${SITE.name} does not lend gis.`,
    },
    {
      q: 'How much do classes cost?',
      a: `Your first class at ${SITE.name} is free, with nothing to sign up for and no card needed to try one. ${SITE.instructor} goes through membership options with you in person rather than posting prices online, so text ${SITE.phone} or come to a class and ask him.`,
    },
    {
      q: 'What ages do you teach?',
      a: `${SITE.name} teaches from age four. The classes are ${ageBands()}. Which class a teenager joins also depends on their size, so text us and we'll tell you which one fits.`,
    },
    {
      q: 'Do I need to book a class in advance?',
      a: `No. Text ${SITE.phone} to say you're coming and turn up — there's no app, no account, and no booking form. Classes run ${openDaysSummary().replace(' · ', ', ')}.`,
    },
    {
      q: 'Can women train at SPI Jiu Jitsu?',
      a: `Yes. Women train in the same evening class as everyone else at ${SITE.name}, and several compete. Jiu jitsu assumes the other person is bigger and stronger than you, which is what makes it effective self-defense for a smaller person.`,
    },
    {
      q: 'Are you on South Padre Island?',
      a: `No — ${SITE.name} is in Port Isabel, on the mainland side of the causeway at ${ADDRESS}, a few minutes' drive from South Padre Island. There is free parking out front.`,
    },
  ]
}
