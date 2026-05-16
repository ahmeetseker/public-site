// LandX help center — static article index. Build-time source of truth.
// HelpSearch (React island) uses substring matching on title + keywords; this
// list is intentionally tiny (< 2KB) — no fuse.js, no fetch.

export interface HelpArticle {
  /** URL slug, must match filename in pages/yardim/<slug>.astro */
  slug: string
  /** Article H1 / SEO title (TR — canonical) */
  title: string
  /** Article H1 / SEO title (EN — used by /en/yardim/<slug>) */
  titleEn: string
  /** Short summary shown on hub card + search result (TR) */
  summary: string
  /** Short summary (EN — used by /en/yardim/<slug>) */
  summaryEn: string
  /** EN body — HTML string rendered inside ArticleLayout on /en/yardim/<slug>.
   *  TR body lives inline in the .astro slot for stylistic flexibility. */
  bodyEn: string
  /** Keywords used by HelpSearch's substring match */
  keywords: string[]
  /** Category label for hub grouping */
  category: 'ilan' | 'arama' | 'iletisim' | 'hesap' | 'yasal'
  /** Absolute path for nav */
  path: string
}

export const HELP_ARTICLES: readonly HelpArticle[] = [
  {
    slug: 'ilan-yayinla',
    title: 'İlan nasıl yayınlanır?',
    titleEn: 'How do I publish a listing?',
    summary:
      'Ofis hesabıyla giriş yapıp /ilan-ver sihirbazından arsa, tarla veya zeytinlik ilanı oluşturmanın 5 adımı.',
    summaryEn:
      'Publish a land, field or olive-grove listing in 5 steps using the /ilan-ver wizard with your verified office account.',
    bodyEn: `
      <p>
        On arsam.net, listings are published by verified real-estate offices through a 5-step
        flow. Individual-seller publishing is on the Phase 3 roadmap; for now you proceed from
        your registered office profile. The guide below walks through the <code>/ilan-ver</code>
        wizard used in the MVP release.
      </p>

      <h2>1. Account verification</h2>
      <p>
        Before publishing, your office account must carry the <strong>"Verified"</strong> badge.
        New registrations require a tax number, MERSİS number and a phone verification for the
        authorised contact. The first 1–2 listings go through a manual review (around 24 hours);
        after that, publishing is instant.
      </p>

      <h2>2. Starting the wizard</h2>
      <p>
        Enter the wizard from the "Publish listing" button in the top menu or directly via
        <a href="/en/ilan-ver">/en/ilan-ver</a>. The wizard is split into four sections:
        <strong>Basic info</strong>, <strong>Location and parcel</strong>, <strong>Photos</strong>
        and <strong>Preview &amp; publish</strong>.
      </p>

      <h3>Basic info</h3>
      <ul>
        <li>Listing title (60-character limit — including a key region name is recommended).</li>
        <li>Category: land, field, or olive grove.</li>
        <li>Zoning status: residential, commercial, agricultural, industrial, or non-zoned.</li>
        <li>Title type: standalone, share-deed, or floor-easement.</li>
        <li>Price, area (m²) and TL/m² (auto-calculated).</li>
      </ul>

      <h3>Location and parcel</h3>
      <ul>
        <li>Province / district / neighbourhood — hierarchical select, also used as filters.</li>
        <li>Block and parcel number (optional but recommended — it boosts the transparency score).</li>
        <li>Map pin or parcel-boundary drawing.</li>
        <li>Road frontage, electricity and water status fields.</li>
      </ul>

      <h2>3. Photos</h2>
      <p>
        At least one photo is required; 5–8 photos plus one parcel / satellite sketch is the
        recommended set. Listings without photos rank lower in search results. Images must be in
        JPEG or WebP format and at least 1200 pixels wide. The wizard converts uploads to WebP
        and stores multiple sizes automatically.
      </p>

      <h2>4. Preview and publish</h2>
      <p>
        The final step previews how your listing will appear in search results. Your verified-office
        badge is attached to the listing card automatically. After you press "Publish", the listing
        goes live and is added to the sitemap.
      </p>

      <h2>5. Post-publish management</h2>
      <p>
        You can edit, pause or mark listings as "Sold" from the
        <a href="/en/panel">office dashboard</a>. Listings older than 60 days that have not been
        refreshed auto-pause; one click refreshes them. When you re-publish, an "Updated" badge
        bumps the listing up in search results.
      </p>

      <p>
        For more detail see our <a href="/en/sss#ilan-verme">FAQ — Publishing</a> section or our
        <a href="/en/iletisim">contact page</a>.
      </p>
    `.trim(),
    keywords: ['ilan', 'yayın', 'yayinla', 'arsa', 'tarla', 'zeytinlik', 'ofis', 'sihirbaz', 'wizard'],
    category: 'ilan',
    path: '/yardim/ilan-yayinla',
  },
  {
    slug: 'karsilastirma-rehberi',
    title: 'İlanları nasıl karşılaştırırım?',
    titleEn: 'How do I compare listings?',
    summary:
      '/karsilastir sayfasıyla iki veya daha fazla ilanı yan yana koyup m² fiyat, imar, hisse durumu farklarını görme rehberi.',
    summaryEn:
      'A guide to placing two or more listings side-by-side on /karsilastir and spotting differences in TL/m², zoning and title status.',
    bodyEn: `
      <p>
        Holding two or three parcels side-by-side in your head is hard: one is share-deeded,
        another is non-zoned, a third has no road frontage. The
        <a href="/en/karsilastir">/en/karsilastir</a> page lays out listings in a detailed table so
        you can spot the differences in about 30 seconds.
      </p>

      <h2>Adding listings to the compare list</h2>
      <p>
        Every listing card has a small <strong>"Compare"</strong> checkbox. The listings you tick
        are stored in your browser's local storage — no account required. A small "compare bar"
        appears in the bottom-right corner of the search page; tap it to jump straight to the
        comparison view.
      </p>

      <h2>What gets compared</h2>
      <ul>
        <li><strong>Price and TL/m²</strong> — total TL and TL/m² side-by-side, with the regional average.</li>
        <li><strong>Area</strong> — parcel size in m².</li>
        <li><strong>Zoning</strong> — residential, commercial, agricultural, industrial, or non-zoned.</li>
        <li><strong>Title type</strong> — standalone, share-deed, floor-easement.</li>
        <li><strong>Road frontage</strong> — in metres.</li>
        <li><strong>Infrastructure</strong> — electricity, water, natural-gas access.</li>
        <li><strong>Verification status</strong> — office "Verified" badge and last-updated date.</li>
      </ul>

      <h2>How many listings can I compare at once?</h2>
      <p>
        Up to 4 listings can be compared at the same time. That cap keeps the table readable on
        mobile. If you try to add a fifth, you'll see a warning — remove an existing one to make
        space.
      </p>

      <h2>Sharing a comparison</h2>
      <p>
        The comparison URL carries the listing IDs as query parameters. If you copy the URL and
        share it, the same table opens on the other side. This is handy when deciding with a
        partner or an advisor.
      </p>

      <h2>Clearing the comparison</h2>
      <p>
        The <strong>"Clear all"</strong> link at the top of the comparison page removes every
        saved listing. Remove a single listing using the small "×" at the end of its row. If you
        clear browser history or close a private tab, the list resets too.
      </p>

      <h2>Tips</h2>
      <ul>
        <li>Compare 2–3 listings from the same region and watch the TL/m² delta; those closer to the regional average are usually more reliable.</li>
        <li>A zoning difference alone often explains most of the price gap.</li>
        <li>Share-deed titles can look 20–40% cheaper than standalone titles — but you'll need co-owner approval to sell.</li>
      </ul>

      <p>
        Send us feedback about the comparison tool via the
        <a href="/en/iletisim">contact page</a>.
      </p>
    `.trim(),
    keywords: ['karsilastir', 'karşılaştır', 'karsilastirma', 'compare', 'm2', 'fiyat', 'imar'],
    category: 'arama',
    path: '/yardim/karsilastirma-rehberi',
  },
  {
    slug: 'ofis-iletisim',
    title: 'Emlak ofisine nasıl ulaşırım?',
    titleEn: 'How do I contact a real-estate office?',
    summary:
      'İlan detay sayfasındaki "Ofise mesaj at" formu, telefon ve WhatsApp linkleri ile doğrulanmış ofisle iletişim kurma adımları.',
    summaryEn:
      'Reach a verified office via the "Message office" form, phone link or WhatsApp button on the listing detail page.',
    bodyEn: `
      <p>
        Every active listing on arsam.net is published by a verified real-estate office.
        Communication with the owner runs through the office profile; arsam.net is not an
        intermediary channel — it connects the two sides directly.
      </p>

      <h2>Contacting from the listing detail page</h2>
      <p>
        On a listing detail page, the right column shows a <strong>"Contact"</strong> card with
        three channels:
      </p>
      <ul>
        <li>
          <strong>Message form</strong> — name, phone and message fields are sent straight to the
          office. Offices commit to responding within 2 business days.
        </li>
        <li>
          <strong>Phone</strong> — the office's authorised phone number is shown in clear text.
          On mobile, tap the number to call directly.
        </li>
        <li>
          <strong>WhatsApp</strong> — if the office has registered a WhatsApp Business account,
          pressing the button opens a chat pre-filled with the listing title.
        </li>
      </ul>

      <h2>The office profile page</h2>
      <p>
        Click the office name or badge to open its profile under
        <a href="/en/ofisler">/en/ofisler</a>. The profile lists the office's active listings,
        verification details, local-region expertise and any badges it holds
        (e.g. "Çeşme specialist", "2 years active").
      </p>

      <h2>What does the "Verified" badge mean?</h2>
      <p>
        Offices that hold the Verified badge have completed:
      </p>
      <ol>
        <li>Tax number and MERSİS registration check.</li>
        <li>Authorised-contact phone verification (SMS OTP).</li>
        <li>Physical address confirmation via signage photo.</li>
        <li>A 30-day manual review on first onboarding.</li>
      </ol>
      <p>
        Missing the badge means the office is still in review or has not applied yet — we
        recommend contacting badged offices first.
      </p>

      <h2>Reporting a problem</h2>
      <p>
        If a listing contains misleading information or an office is not honouring the contract,
        use the <strong>"Report"</strong> link at the bottom of the listing detail page. Our
        moderation team picks up reports within 48 hours. For urgent fraud concerns, write to us
        directly via the <a href="/en/iletisim">contact page</a>.
      </p>

      <h2>Privacy note</h2>
      <p>
        The data you submit through the message form (name, phone, message) is delivered only to
        the relevant office; it is not stored for marketing. See our
        <a href="/en/kvkk">KVKK information notice</a> for details.
      </p>

      <p>
        For more, browse the other articles in the <a href="/en/yardim">help centre</a> or use the
        <a href="/en/iletisim">contact form</a>.
      </p>
    `.trim(),
    keywords: ['ofis', 'iletisim', 'iletişim', 'telefon', 'whatsapp', 'mesaj', 'emlak'],
    category: 'iletisim',
    path: '/yardim/ofis-iletisim',
  },
  {
    slug: 'hesap-yonetimi',
    title: 'Hesap ve güvenlik',
    titleEn: 'Account & security',
    summary:
      'Şifre değişikliği, iki adımlı doğrulama, oturum yönetimi, hesap silme ve veri indirme — /hesabim altında neyi nereden yapacağınız.',
    summaryEn:
      'Password changes, two-factor auth, session management, account deletion and data export — what to do where under /hesabim.',
    bodyEn: `
      <p>
        Your arsam.net account gives you access to saved searches, favourite listings and other
        personal features. Everything related to your account lives under
        <a href="/en/hesabim">/en/hesabim</a>. This article walks through the most common
        account and security tasks.
      </p>

      <h2>Changing your password</h2>
      <p>
        Under <a href="/en/hesabim/profil">/en/hesabim/profil</a> there is a
        <strong>"Change password"</strong> section. You need your current password plus a new
        password and its confirmation. The new password must be at least 10 characters, contain at
        least one uppercase letter, one digit and one symbol. When the password is changed, every
        active session on other devices is signed out automatically.
      </p>

      <h2>Two-factor authentication (2FA)</h2>
      <p>
        To add an extra security layer, enable <strong>2FA</strong>. Two methods are currently
        supported:
      </p>
      <ul>
        <li><strong>SMS</strong> — a one-time code sent to your registered phone number.</li>
        <li><strong>Authenticator app</strong> — compatible with Google Authenticator, Authy or 1Password.</li>
      </ul>
      <p>
        During 2FA activation you are shown 8 single-use backup codes; store them somewhere safe.
        If you lose access to your phone you can sign in with a backup code.
      </p>

      <h2>Active sessions</h2>
      <p>
        Under <a href="/en/hesabim/guvenlik">/en/hesabim/guvenlik</a> you can see every device
        signed into your account: browser, OS, last IP and last activity time. If you don't
        recognise a session, hit <strong>"Sign out this session"</strong> to end it immediately.
        "Sign out all other sessions" signs out every device except the current browser.
      </p>

      <h2>Updating email and phone</h2>
      <p>
        To change your email, enter the new address and click the confirmation link; the old
        address also receives a notification. For a phone change, an SMS OTP code is sent to the
        new number — the change is not saved until you verify it.
      </p>

      <h2>Data export (KVKK art. 11)</h2>
      <p>
        The <strong>"Export my data"</strong> button under
        <a href="/en/hesabim/profil">/en/hesabim/profil</a> emails you a JSON archive of all
        stored data (profile, saved searches, favourite listings, message history) within 24
        hours. This is the automated counterpart of the "right to information" under Turkey's
        personal-data protection law (KVKK, art. 11).
      </p>

      <h2>Deleting your account</h2>
      <p>
        Use the <strong>"Delete my account"</strong> button at the bottom of
        <a href="/en/hesabim/profil">/en/hesabim/profil</a>. A 30-day undo window starts; signing
        back in during this window cancels the deletion. After 30 days, your data is permanently
        destroyed under <strong>KVKK art. 7</strong>; only records subject to legal retention
        (e.g. invoice records) are kept in anonymised form.
      </p>

      <h2>Tips</h2>
      <ul>
        <li>Use a password manager rather than reusing the same password across devices.</li>
        <li>Prefer an authenticator app over SMS 2FA — it's more resilient against SIM-swap attacks.</li>
        <li>If you spot a suspicious session, change the password first, then sign out all sessions.</li>
      </ul>

      <p>
        For more on your KVKK rights see our <a href="/en/yardim/kvkk-haklarim">KVKK rights</a>
        article.
      </p>
    `.trim(),
    keywords: ['hesap', 'guvenlik', 'güvenlik', 'sifre', 'şifre', '2fa', 'oturum', 'profil'],
    category: 'hesap',
    path: '/yardim/hesap-yonetimi',
  },
  {
    slug: 'kvkk-haklarim',
    title: 'KVKK haklarım nelerdir?',
    titleEn: 'What are my KVKK rights?',
    summary:
      '6698 sayılı kanun kapsamında veri sahibi olarak haklarınız, başvuru kanalı ve cevap süreleri — /kvkk sayfasıyla birlikte.',
    summaryEn:
      'Your rights as a data subject under Turkey’s Law No. 6698 (KVKK), how to file a request and expected response times — together with the /kvkk page.',
    bodyEn: `
      <p>
        Turkey's Law No. 6698 on the Protection of Personal Data ("KVKK") grants everyone in
        Turkey specific rights against companies that process their personal data. arsam.net is
        fully aligned with these rights. This article summarises the rights granted by KVKK
        art. 11 and how to exercise them on arsam.net. For the full legal text, see our
        <a href="/en/kvkk">KVKK information notice</a>.
      </p>

      <h2>KVKK art. 11 — Data subject rights</h2>
      <ul>
        <li><strong>Right to information:</strong> learn whether your data is being processed.</li>
        <li><strong>Right of access:</strong> obtain a copy of the data being processed.</li>
        <li><strong>Right to rectification:</strong> request that incomplete or inaccurate data be corrected.</li>
        <li><strong>Right to erasure / destruction:</strong> request full removal of your data (KVKK art. 7).</li>
        <li><strong>Right to object:</strong> object to automated decision-making processes.</li>
        <li><strong>Right to compensation:</strong> claim damages where unlawful processing has caused harm.</li>
        <li><strong>Information on third parties:</strong> learn which third parties have received your data.</li>
      </ul>

      <h2>How do I exercise these rights on arsam.net?</h2>
      <p>
        Most rights can be exercised with one click from your account page; a few require a
        written request.
      </p>
      <ul>
        <li>
          <strong>Data export:</strong> <a href="/en/hesabim/profil">/en/hesabim/profil</a> &gt;
          "Export my data" button. A JSON file is emailed to you within 24 hours. Details:
          <a href="/en/yardim/hesap-yonetimi">account management article</a>.
        </li>
        <li>
          <strong>Correction:</strong> update profile information directly from
          <a href="/en/hesabim/profil">/en/hesabim/profil</a>.
        </li>
        <li>
          <strong>Account deletion:</strong> the "Delete my account" button at the bottom of the
          same page — 30-day undo window.
        </li>
        <li>
          <strong>Written request:</strong> for other rights, send a written request to
          <a href="mailto:kvkk@arsam.net">kvkk@arsam.net</a>. Our KEP address is listed on the
          <a href="/en/kvkk">KVKK page</a>.
        </li>
      </ul>

      <h2>Response time</h2>
      <p>
        Under KVKK art. 13, all requests receive a reply within <strong>30 days at the latest</strong>.
        In practice arsam.net targets a 7-day response window. If your request is denied or you
        consider the response insufficient, you retain the right to file a complaint with the
        Turkish Personal Data Protection Authority (KVKK).
      </p>

      <h2>Children and KVKK</h2>
      <p>
        arsam.net does not provide services to users under 18. Your date of birth is confirmed at
        sign-up. If we identify a user under 18, the account is closed and the data is destroyed
        within 30 days.
      </p>

      <h2>Cross-border data transfers</h2>
      <p>
        arsam.net hosts its servers in Turkey. Supporting SaaS services (email, analytics) may
        cause some data to be transferred to the EU or US. Such transfers only happen to
        countries deemed adequate by the Turkish KVKK Authority or with your explicit consent.
        Details are in the <a href="/en/kvkk#yurt-disi">KVKK art. 9 section</a>.
      </p>

      <h2>Related pages</h2>
      <ul>
        <li><a href="/en/kvkk">KVKK information notice</a> — full legal text</li>
        <li><a href="/en/cerez-politikasi">Cookie policy</a> — tracking preferences</li>
        <li><a href="/en/kullanim-sartlari">Terms of use</a> — contractual rights</li>
        <li><a href="/en/yardim/hesap-yonetimi">Account management</a> — data export and deletion steps</li>
      </ul>

      <p>
        Questions? Email our team at <a href="mailto:kvkk@arsam.net">kvkk@arsam.net</a>.
      </p>
    `.trim(),
    keywords: ['kvkk', 'gdpr', 'kisisel', 'kişisel', 'veri', 'hak', '6698', 'aydinlatma'],
    category: 'yasal',
    path: '/yardim/kvkk-haklarim',
  },
] as const

export interface HelpCategory {
  id: HelpArticle['category']
  label: string
  description: string
}

export const HELP_CATEGORIES: readonly HelpCategory[] = [
  {
    id: 'ilan',
    label: 'İlan verme',
    description: 'Ofis hesabıyla ilan oluşturma, düzenleme ve yayın akışı.',
  },
  {
    id: 'arama',
    label: 'Arama ve karşılaştırma',
    description: 'Filtreler, kayıtlı aramalar ve ilan karşılaştırma araçları.',
  },
  {
    id: 'iletisim',
    label: 'Ofis iletişimi',
    description: 'Doğrulanmış emlak ofisine mesaj, telefon ve WhatsApp ile ulaşma.',
  },
  {
    id: 'hesap',
    label: 'Hesap ve güvenlik',
    description: 'Şifre, oturum, 2FA ve hesap silme işlemleri.',
  },
  {
    id: 'yasal',
    label: 'Yasal ve KVKK',
    description: 'Veri sahibi hakları, çerez tercihleri ve kullanım şartları.',
  },
] as const

export function articlesByCategory(id: HelpArticle['category']): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.category === id)
}

export function findArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug)
}
