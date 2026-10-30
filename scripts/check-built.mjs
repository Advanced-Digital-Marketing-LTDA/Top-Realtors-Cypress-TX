import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import { inspectMarkup } from './lib/inspect-markup.mjs';
import { inspectRating } from './lib/inspect-rating.mjs';
import {
  parseDirectory,
  parseRatingSnapshot,
  parseSite,
  publicPaths,
  canonical,
  profilePath,
  isTeam,
  orderProfiles,
  NEIGHBORHOODS,
  SPONSORED_SLUG,
  neighborhoodPath,
  servesNeighborhood,
  SITE_UPDATED,
} from '../src/lib/contracts.ts';
const root = path.resolve('dist');
assert(
  !fs.lstatSync(root).isSymbolicLink(),
  'Build root must not be a symlink',
);
const realRoot = fs.realpathSync(root);
const read = (name) =>
  JSON.parse(fs.readFileSync('src/content/' + name + '.json', 'utf8'));
const site = parseSite(read('site'));
const agents = parseDirectory(read('realtors'));
const ratings = parseRatingSnapshot(read('ratings'), agents);
const routes = [...publicPaths(agents), '/404.html'];
let references = 0;
const failures = [];
const titles = new Set();
const descriptions = new Set();
const pages = new Map();
for (const route of routes) {
  const file = path.join(root, route === '/' ? 'index.html' : route.slice(1));
  assert(
    fs.existsSync(file) && fs.lstatSync(file).isFile(),
    'Required regular public file ' + route,
  );
  assert.equal(
    fs.realpathSync(file),
    path.join(realRoot, route === '/' ? 'index.html' : route.slice(1)),
    'Required public path contains a symlink: ' + route,
  );
  const markup = fs.readFileSync(file, 'utf8');
  const $ = load(markup);
  pages.set(route, $);
  assert.equal($('h1').length, 1);
  assert.equal($('main').length, 1);
  assert.equal($('html').attr('lang'), 'en');
  assert.equal($('link[rel=canonical]').length, 1);
  assert.equal($('link[rel=canonical]').attr('href'), canonical(route));
  assert.equal($('meta[property="og:url"]').attr('content'), canonical(route));
  assert.equal(
    $('meta[property="og:image"]').attr('content'),
    site.origin + '/assets/coles-crossing-morning-1320.jpg',
  );
  const robots = $('meta[name=robots]').attr('content');
  assert.equal(
    robots,
    site.indexing && route !== '/404.html'
      ? 'index, follow'
      : 'noindex, follow',
  );
  const title = $('title').text();
  const description = $('meta[name=description]').attr('content');
  assert(title && description);
  assert(
    !titles.has(title) && !descriptions.has(description),
    'Duplicate metadata',
  );
  titles.add(title);
  descriptions.add(description);
  assert(!markup.includes('AggregateRating'));
  assert(!markup.includes('cypress-realtor-guide-example'));
  assert(!markup.includes('SECRET_SENTINEL'));
  const result = inspectMarkup(root, file);
  references += result.references;
  failures.push(...result.failures);
}
for (const agent of agents.filter((a) => !a.draft)) {
  const $ = load(
    fs.readFileSync(path.join(root, profilePath(agent).slice(1)), 'utf8'),
  );
  assert.equal($('h1').text(), agent.name);
  assert.equal($('.fact-list li').length, agent.facts.length);
  assert.equal($('.sources ol li').length, agent.sources.length);
  agent.facts.forEach((fact, i) => {
    assert($('.fact-list li').eq(i).text().includes(fact.text));
    assert.equal(
      $('.fact-list li small a').eq(i).attr('href'),
      agent.sources[fact.source].url,
    );
  });
  for (const item of agent.highlights?.specialties ?? [])
    assert($('.highlights').text().includes(item));
  for (const item of agent.highlights?.areas ?? [])
    assert($('.highlights').text().includes(item));
  for (const item of agent.highlights?.designations ?? [])
    assert($('.highlights').text().includes(item));
  if (agent.highlights?.reviews)
    assert($('.highlights').text().includes(agent.highlights.reviews));
  const graph = JSON.parse($('script[type="application/ld+json"]').text())[
    '@graph'
  ];
  const schema = graph.find((node) => node['@type'] === 'ProfilePage');
  assert.equal(schema.mainEntity.name, agent.name);
  assert.equal(
    schema.mainEntity['@type'],
    isTeam(agent) ? 'RealEstateAgent' : 'Person',
  );
  const crumbs = graph.find((node) => node['@type'] === 'BreadcrumbList');
  assert.equal(
    crumbs.itemListElement.at(-1).item,
    canonical(profilePath(agent)),
  );
  if (agent.tel)
    assert.equal($('a[href^="tel:"]').attr('href'), 'tel:' + agent.tel);
  inspectRating($('.rating-panel'), ratings[agent.slug]);
}
const home = load(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
for (const agent of agents.filter((a) => !a.draft)) {
  const row = home(`.agent-row[data-profile="${agent.slug}"]`);
  inspectRating(row.find('.rating-panel'), ratings[agent.slug]);
  const specialties = agent.highlights?.specialties ?? [];
  assert.deepEqual(
    row
      .find('.row-specialties li')
      .map((_, li) => home(li).text().trim())
      .get(),
    specialties,
  );
  if (specialties.length === 0)
    assert.equal(row.find('.row-specialties').length, 0);
}
assert.equal(
  home('.agent-row').first().attr('data-profile'),
  'lippincott-team',
);
assert.equal(home('.feature-card .identity h3').text(), 'The Lippincott Team');
const featured = agents.find((a) => a.slug === 'lippincott-team');
assert.equal(
  home('.feature-card a[href^="tel:"]').attr('href'),
  'tel:' + featured.tel,
);
const homeGraph = JSON.parse(home('script[type="application/ld+json"]').text())[
  '@graph'
];
const faq = homeGraph.find((node) => node['@type'] === 'FAQPage');
const visibleText = (el) => home(el).text().replaceAll(/\s+/g, ' ').trim();
assert.deepEqual(
  faq.mainEntity.map((q) => q.name),
  home('.faq-list summary')
    .map((_, el) => visibleText(el))
    .get(),
);
assert.deepEqual(
  faq.mainEntity.map((q) => q.acceptedAnswer.text),
  home('.faq-list details > p')
    .map((_, el) => visibleText(el))
    .get(),
);
assert.deepEqual(
  home('.compare-table tbody tr')
    .map((_, el) => home(el).attr('data-profile'))
    .get(),
  orderProfiles(agents).map((a) => a.slug),
);
const caption = home('.compare-table caption').text().trim();
assert(
  caption.startsWith(
    orderProfiles(agents).length + ' Cypress, TX realtors compared. ',
  ),
  'Comparison caption: ' + caption,
);
for (const place of NEIGHBORHOODS) {
  const page = pages.get(neighborhoodPath(place));
  assert(page, 'Missing neighborhood page: ' + place.slug);
  const expected = orderProfiles(agents)
    .filter((a) => servesNeighborhood(a, place))
    .map((a) => a.slug);
  assert(expected.length > 0, 'Neighborhood without realtors: ' + place.slug);
  assert.deepEqual(
    page('.place-agents li')
      .map((_, el) => page(el).attr('data-profile'))
      .get(),
    expected,
  );
  assert.equal(home(`.hood-card[data-place="${place.slug}"]`).length, 1);
  // The paid placement keeps its directory-row disclosure here too.
  assert.deepEqual(
    page('.sponsored-badge')
      .map((_, el) => [
        [page(el).closest('li').attr('data-profile'), page(el).text().trim()],
      ])
      .get(),
    expected.includes(SPONSORED_SLUG)
      ? [[SPONSORED_SLUG, 'Sponsored listing']]
      : [],
  );
}
assert.equal(home('.feature-card .identity .btn').length, 0);
assert.equal(home('.feature-card .sponsored-badge').length, 0);
assert.equal(home('.hero .feature-card').length, 1);
assert(!/paid|sponsor/i.test(home('.feature-card').text()));
assert.equal(home('.sponsored-badge').length, 1);
assert.equal(
  home('.agent-row').first().find('.sponsored-badge').text(),
  'Sponsored listing',
);
const lippincott = load(
  fs.readFileSync(path.join(root, 'realtors/lippincott-team.html'), 'utf8'),
);
assert.equal(lippincott('.sponsored-badge').length, 0);
assert.equal(lippincott('.notice').length, 0);
assert(!/paid|sponsor/i.test(lippincott('body').text()));
assert(
  !lippincott('a[rel]')
    .toArray()
    .some((a) => /sponsored/.test(lippincott(a).attr('rel'))),
);
const sitemap = load(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), {
  xml: true,
});
assert.deepEqual(
  sitemap('loc')
    .toArray()
    .map((el) => sitemap(el).text())
    .sort(),
  publicPaths(agents).map(canonical).sort(),
);
assert(
  sitemap('url')
    .toArray()
    .every((el) => sitemap(el).find('lastmod').text() === SITE_UPDATED),
  'Every sitemap entry carries lastmod',
);
assert(
  fs
    .readFileSync(path.join(root, 'robots.txt'), 'utf8')
    .includes(site.origin + '/sitemap.xml'),
);
assert.equal(
  fs
    .readdirSync(path.join(root, 'realtors'))
    .filter((name) => name.endsWith('.html')).length,
  agents.filter((a) => !a.draft).length,
  'Stale profile output',
);
assert.equal(failures.length, 0, failures.join('\n'));
console.log(
  JSON.stringify({
    pages: routes.length,
    profiles: agents.filter((a) => !a.draft).length,
    localReferences: references,
    failures,
  }),
);
