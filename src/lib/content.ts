import { getCollection } from 'astro:content';
import rawSite from '../content/site.json';
import rawRatings from '../content/ratings.json';
import {
  parseSite,
  parseRatingSnapshot,
  orderProfiles,
  publicPaths,
  canonical,
  profilePath,
  isTeam,
  neighborhoodPath,
  SITE_UPDATED,
  type Agent,
  type Neighborhood,
} from './contracts';
export const site = parseSite(rawSite);
export async function getDirectory() {
  const entries = await getCollection('realtors');
  const agents: Agent[] = entries.map((entry) => entry.data);
  const ratings = parseRatingSnapshot(rawRatings, agents);
  const ordered = orderProfiles(agents);
  return { agents: ordered, ratings, paths: publicPaths(agents) };
}
const siteEntity = {
  '@type': 'Organization',
  '@id': canonical('/') + '#organization',
  name: site.name,
  url: canonical('/'),
};
const breadcrumbs = (items: [string, string][]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
    item: canonical(path),
  })),
});
const agentList = (agents: Agent[]) => ({
  '@type': 'ItemList',
  itemListOrder: 'https://schema.org/ItemListUnordered',
  numberOfItems: agents.length,
  itemListElement: agents.map((a, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: a.name,
    url: canonical(profilePath(a)),
  })),
});
const listed = (key: string, values: unknown[]) =>
  values.length ? { [key]: values } : {};
function agentEntity(agent: Agent) {
  const languages = listed('knowsLanguage', agent.highlights?.languages ?? []);
  const base = {
    name: agent.name,
    url: agent.official,
    sameAs: [agent.har],
    ...(agent.tel ? { telephone: agent.tel } : {}),
  };
  if (isTeam(agent))
    return {
      '@type': 'RealEstateAgent',
      ...base,
      ...listed(
        'areaServed',
        (agent.highlights?.areas ?? []).map((name) => ({
          '@type': 'Place',
          name,
        })),
      ),
      ...languages,
    };
  return {
    '@type': 'Person',
    ...base,
    jobTitle: 'Real estate agent',
    worksFor: { '@type': 'RealEstateAgent', name: agent.brokerage },
    ...languages,
  };
}
export interface FaqItem {
  question: string;
  answer: string;
  id?: string;
  // Rendered after the answer as "See our <a>label</a> for details."
  more?: { label: string; href: string };
}
// Plain-text answer exactly as the page shows it, for FAQPage JSON-LD.
export const faqAnswerText = (item: FaqItem) =>
  item.more
    ? `${item.answer} See our ${item.more.label} for details.`
    : item.answer;
export function directorySchema(agents: Agent[], faq: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      siteEntity,
      {
        '@type': 'WebSite',
        name: site.name,
        url: canonical('/'),
        publisher: { '@id': siteEntity['@id'] },
      },
      { ...agentList(agents), name: 'Cypress real estate directory' },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: faqAnswerText(item) },
        })),
      },
    ],
  };
}
export function profileSchema(agent: Agent) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        url: canonical(profilePath(agent)),
        dateModified: SITE_UPDATED,
        isPartOf: { '@type': 'WebSite', name: site.name, url: canonical('/') },
        mainEntity: agentEntity(agent),
      },
      breadcrumbs([
        ['Home', '/'],
        [agent.name, profilePath(agent)],
      ]),
    ],
  };
}
export function neighborhoodSchema(place: Neighborhood, agents: Agent[]) {
  const path = neighborhoodPath(place);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        url: canonical(path),
        name: 'Realtors serving ' + place.name,
        dateModified: SITE_UPDATED,
        about: { '@type': 'Place', name: place.name + ', Cypress, Texas' },
        mainEntity: agentList(agents),
      },
      breadcrumbs([
        ['Home', '/'],
        [place.name, path],
      ]),
    ],
  };
}
export function aboutSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      siteEntity,
      {
        '@type': 'AboutPage',
        url: canonical('/about.html'),
        dateModified: SITE_UPDATED,
        about: { '@id': siteEntity['@id'] },
      },
    ],
  };
}
