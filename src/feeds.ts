/**
 * Catalog of the NOS RSS feeds listed on https://nos.nl/feeds.
 * `defaultOn` marks the NOS Nieuws feeds that are enabled out of the box.
 * Video feeds contain no readable article text, so they exist in the catalog
 * (selectable on the phone) but are off by default.
 */
export interface FeedDef {
    id: string;          // slug, also the path on feeds.nos.nl
    label: string;       // human label (phone UI)
    shortLabel: string;  // compact label (glasses header/article meta)
    group: string;       // section header on the phone
    defaultOn: boolean;
}

const NIEUWS = 'NOS Nieuws';
const SPORT = 'NOS Sport';
const OVERIG = 'Overig';

export const FEED_CATALOG: FeedDef[] = [
    { id: 'nosnieuwsalgemeen',       label: 'Algemeen',        shortLabel: 'Nieuws',      group: NIEUWS, defaultOn: true },
    { id: 'nosnieuwsbinnenland',     label: 'Binnenland',      shortLabel: 'Binnenland',  group: NIEUWS, defaultOn: true },
    { id: 'nosnieuwsbuitenland',     label: 'Buitenland',      shortLabel: 'Buitenland',  group: NIEUWS, defaultOn: true },
    { id: 'nosnieuwspolitiek',       label: 'Politiek',        shortLabel: 'Politiek',    group: NIEUWS, defaultOn: true },
    { id: 'nosnieuwseconomie',       label: 'Economie',        shortLabel: 'Economie',    group: NIEUWS, defaultOn: true },
    { id: 'nosnieuwskoningshuis',    label: 'Koningshuis',     shortLabel: 'Koningshuis', group: NIEUWS, defaultOn: true },
    { id: 'nosnieuwstech',           label: 'Tech',            shortLabel: 'Tech',        group: NIEUWS, defaultOn: true },
    { id: 'nosnieuwscultuurenmedia', label: 'Cultuur & media', shortLabel: 'Cultuur',     group: NIEUWS, defaultOn: true },
    { id: 'nosnieuwsopmerkelijk',    label: 'Opmerkelijk',     shortLabel: 'Opmerkelijk', group: NIEUWS, defaultOn: true },
    { id: 'nosnieuwsvideo',          label: 'Video (geen leestekst)', shortLabel: 'Video', group: NIEUWS, defaultOn: false },

    { id: 'nossportalgemeen',        label: 'Sport algemeen',  shortLabel: 'Sport',       group: SPORT, defaultOn: false },
    { id: 'nosvoetbal',              label: 'Voetbal',         shortLabel: 'Voetbal',     group: SPORT, defaultOn: false },
    { id: 'nossportformule1',        label: 'Formule 1',       shortLabel: 'Formule 1',   group: SPORT, defaultOn: false },
    { id: 'nossportschaatsen',       label: 'Schaatsen',       shortLabel: 'Schaatsen',   group: SPORT, defaultOn: false },
    { id: 'nossporttennis',          label: 'Tennis',          shortLabel: 'Tennis',      group: SPORT, defaultOn: false },
    { id: 'nossportwielrennen',      label: 'Wielrennen',      shortLabel: 'Wielrennen',  group: SPORT, defaultOn: false },
    { id: 'nossportvoetbalvideo',    label: 'Voetbal video',   shortLabel: 'Voetbal',     group: SPORT, defaultOn: false },
    { id: 'nossportformule1video',   label: 'Formule 1 video', shortLabel: 'Formule 1',   group: SPORT, defaultOn: false },
    { id: 'nossportschaatsenvideo',  label: 'Schaatsen video', shortLabel: 'Schaatsen',   group: SPORT, defaultOn: false },
    { id: 'nossporttennisvideo',     label: 'Tennis video',    shortLabel: 'Tennis',      group: SPORT, defaultOn: false },
    { id: 'nossportwielrennenvideo', label: 'Wielrennen video', shortLabel: 'Wielrennen', group: SPORT, defaultOn: false },

    { id: 'nosop3',                  label: 'NOS op 3',        shortLabel: 'NOS op 3',    group: OVERIG, defaultOn: false },
    { id: 'jeugdjournaal',           label: 'Jeugdjournaal',   shortLabel: 'Jeugdjrnl',   group: OVERIG, defaultOn: false },
    { id: 'nieuwsuuralgemeen',       label: 'Nieuwsuur',       shortLabel: 'Nieuwsuur',   group: OVERIG, defaultOn: false },
];

export const FEED_GROUPS = [NIEUWS, SPORT, OVERIG];

export function feedUrl(id: string): string {
    return `https://feeds.nos.nl/${id}`;
}

export function feedById(id: string): FeedDef | undefined {
    return FEED_CATALOG.find(f => f.id === id);
}

export function defaultFeedIds(): string[] {
    return FEED_CATALOG.filter(f => f.defaultOn).map(f => f.id);
}
