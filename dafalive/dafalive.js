// DafAlive shared code: the catalog of visualizations + Hebrew numbering helpers.
// A visualization can cover many dapim, and a daf can have many visualizations:
// each entry just lists its dapim, and the hub inverts that into a by-daf index.

export const VIZ = [
  {
    id: 'tamid', href: 'tamid.html', added: '2026-11',
    title: 'Dissecting the Tamid', he: 'הפשט ונתוח של התמיד',
    blurb: 'A 3D walk through how the kohanim flayed and cut the Tamid into its limbs, step by step with the Mishna.',
    kind: '3D model', dapim: ['Tamid 31a', 'Tamid 31b'], source: 'Mishna Tamid 4:2–3',
  },
  {
    id: 'toah', href: 'toah.html', added: '2026-11',
    title: "Pesach B'To'ah", he: 'אין פתח בטועה פחות משבעה ולא יתר על שבעה עשר',
    blurb: 'Mark the days she saw on a calendar and watch every possibility play out: why one day needs 17 clean days, and when 7 is already enough (following Rashi).',
    kind: 'Interactive calendar', dapim: ['Arakhin 8a', 'Arakhin 8b'], source: 'Mishna Arachin 2:1',
  },
];

// Bavli order, Sefaria spelling -> Hebrew name.
export const MASECHTOS = [
  ['Berakhot','ברכות'],['Shabbat','שבת'],['Eruvin','עירובין'],['Pesachim','פסחים'],['Shekalim','שקלים'],
  ['Yoma','יומא'],['Sukkah','סוכה'],['Beitzah','ביצה'],['Rosh Hashanah','ראש השנה'],['Taanit','תענית'],
  ['Megillah','מגילה'],['Moed Katan','מועד קטן'],['Chagigah','חגיגה'],['Yevamot','יבמות'],['Ketubot','כתובות'],
  ['Nedarim','נדרים'],['Nazir','נזיר'],['Sotah','סוטה'],['Gittin','גיטין'],['Kiddushin','קידושין'],
  ['Bava Kamma','בבא קמא'],['Bava Metzia','בבא מציעא'],['Bava Batra','בבא בתרא'],['Sanhedrin','סנהדרין'],
  ['Makkot','מכות'],['Shevuot','שבועות'],['Avodah Zarah','עבודה זרה'],['Horayot','הוריות'],['Zevachim','זבחים'],
  ['Menachot','מנחות'],['Chullin','חולין'],['Bekhorot','בכורות'],['Arakhin','ערכין'],['Temurah','תמורה'],
  ['Keritot','כריתות'],['Meilah','מעילה'],['Tamid','תמיד'],['Middot','מידות'],['Kinnim','קינים'],['Niddah','נדה'],
];

// 1..499 -> Hebrew letters (15/16 as טו/טז), no punctuation
export function heLetters(n){
  const o = ['','א','ב','ג','ד','ה','ו','ז','ח','ט'], t = ['','י','כ','ל','מ','נ','ס','ע','פ','צ'], h = ['','ק','ר','ש','ת'];
  const r = n % 100;
  return h[Math.floor(n / 100)] + (r === 15 ? 'טו' : r === 16 ? 'טז' : t[Math.floor(r / 10)] + o[r % 10]);
}

// gematria with geresh/gershayim, e.g. 17 -> י״ז, 7 -> ז׳
export function heNum(n){
  const s = heLetters(n);
  return s.length > 1 ? s.slice(0, -1) + '״' + s.slice(-1) : s + '׳';
}

// 'Arakhin 8b' -> {masechta:'Arakhin', he:'ערכין', daf:8, amud:'b', heRef:'ערכין ח:', order, key}
export function parseDaf(ref){
  const [, masechta, daf, amud] = ref.match(/^(.+) (\d+)([ab])$/);
  const order = MASECHTOS.findIndex(m => m[0] === masechta);
  const he = order < 0 ? masechta : MASECHTOS[order][1];
  return { masechta, he, daf: +daf, amud, order, ref,
    heRef: `${he} ${heLetters(+daf)}${amud === 'a' ? '.' : ':'}`,
    key: order * 1000 + daf * 2 + (amud === 'b') };
}

// self-check: open the hub with ?test and see the console
if (typeof location !== 'undefined' && location.search.includes('test')) {
  console.assert(heNum(17) === 'י״ז' && heNum(7) === 'ז׳' && heNum(15) === 'ט״ו', 'heNum');
  console.assert(heLetters(116) === 'קטז' && heLetters(176) === 'קעו', 'heLetters');
  console.assert(parseDaf('Arakhin 8b').heRef === 'ערכין ח:' && parseDaf('Tamid 31a').heRef === 'תמיד לא.', 'parseDaf');
  console.assert(VIZ.every(v => v.dapim.every(d => parseDaf(d).order >= 0)), 'every daf names a known masechta');
  console.log('DafAlive self-check done');
}
