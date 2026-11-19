import styles from "./Landing.module.css";

const Heart = ({ className = "" }: { className?: string }) => (
  <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.9A4.5 4.5 0 0 1 20 10c0 6.2-8 11-8 11Z" /></svg>
);

const steps = [
  { n: "01", title: "Meet your people", text: "Browse a lighthearted deck of people and find someone who catches your eye.", color: "lilac" },
  { n: "02", title: "Like quietly", text: "Send a like or pass. Your choice stays private while you decide.", color: "peach" },
  { n: "03", title: "Find out when it’s mutual", text: "When you both like each other, you’ll see your match. No guessing games.", color: "pink" },
];

const faqs = [
  ["What is Coy Discover?", "A playful demo of a double-blind matching experience. Browse profiles, swipe, and see a match when interest is mutual."],
  ["Can someone see who I liked?", "Likes stay private in the experience. A match only appears when both people have liked each other."],
  ["Is this the same as the Coy website?", "This project is a standalone Discover demo inspired by Coy’s privacy-first brand. The demo uses sample profiles."],
  ["Who can use it?", "This experience is intended for adults 18 and over."],
];

export default function Home() {
  return (
    <main className={styles.landing} id="top">
      <header className={styles.landingHeader}>
        <a className={styles.landingLogo} href="#top" aria-label="Coy home"><Heart /> coy<span>.</span></a>
        <nav className={styles.landingNav} aria-label="Main navigation">
          <a href="#how">How it works</a><a href="#privacy">Privacy</a><a href="#faq">Questions</a>
        </nav>
        <a className={`${styles.landingButton} ${styles.headerButton}`} href="/discover">Try the demo <span aria-hidden="true">↗</span></a>
      </header>

      <section className={styles.landingHero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}><span className={styles.eyebrowDot} /> A little mystery, a lot less pressure</span>
          <h1>Find out if your crush likes you <em>back.</em></h1>
          <p className={styles.heroLede}>A more private way to make a connection. Like someone quietly, and only find out when the feeling is mutual.</p>
          <div className={styles.heroCta}><a className={styles.landingButton} href="/discover">Explore the demo <span aria-hidden="true">→</span></a><span>Sample profiles · 18+ only</span></div>
          <div className={styles.heroTrust}><span className={styles.trustHeart}><Heart /></span><span><strong>Your likes are yours.</strong><br />No awkward reveals. No pressure.</span></div>
        </div>
        <div className={styles.heroVisual} aria-label="Preview of a mutual match">
          <div className={`${styles.orbit} ${styles.orbitOne}`} /><div className={`${styles.orbit} ${styles.orbitTwo}`} />
          <div className={styles.floatingNote}><span className={styles.noteIcon}><Heart /></span><span><strong>A little secret</strong><small>Your like stays private</small></span><span className={styles.noteLock}>⌑</span></div>
          <div className={styles.profilePreview}><div className={styles.previewSun} /><div className={styles.previewPortrait}><span>R</span><i>✦</i></div><div className={styles.previewCaption}><span className={styles.previewLabel}>SOMEONE YOU MIGHT LIKE</span><strong>Riya, 24</strong><small>Books, slow mornings &amp; good coffee</small></div></div>
          <div className={styles.matchPop}><span className={styles.matchPopHeart}><Heart /></span><span><small>WHEN IT’S MUTUAL</small><strong>It’s a match!</strong></span><span className={styles.sparkle}>✦</span></div>
          <span className={`${styles.heroSpark} ${styles.heroSparkA}`}>✳</span><span className={`${styles.heroSpark} ${styles.heroSparkB}`}>✦</span>
        </div>
      </section>

      <section className={styles.landingBand}><span className={styles.bandIcon}><Heart /></span><p><strong>No pressure. No mind games.</strong><span>Just one question: do they like you back?</span></p><span className={styles.bandDecoration}>✳</span></section>

      <section className={`${styles.landingSection} ${styles.howSection}`} id="how">
        <div className={styles.sectionHeading}><span className={styles.eyebrow}>THE GOOD PART</span><h2>It’s simple by design.</h2><p>Good connections don’t need complicated rules.</p></div>
        <div className={styles.stepsGrid}>{steps.map((step) => <article className={`${styles.stepCard} ${styles[`step${step.color[0].toUpperCase()}${step.color.slice(1)}`]}`} key={step.n}><div className={styles.stepCardTop}><span className={styles.stepNumber}>{step.n}</span><Heart /></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
      </section>

      <section className={styles.privacySection} id="privacy"><div className={styles.privacyCopy}><span className={styles.eyebrow}>YOUR BUSINESS, YOURS</span><h2>What if they don’t like you back?</h2><p className={styles.privacyNothing}>Nothing happens.</p><p className={styles.privacyDescription}>Your like stays private. Nobody gets put on the spot, and you can move on without the awkwardness.</p><a href="/discover" className={styles.textLink}>See how the demo works <span aria-hidden="true">→</span></a></div><ul className={styles.promiseList}><li><span>✓</span><p><strong>Private by default</strong>Your choice isn’t broadcast to anyone.</p></li><li><span>✓</span><p><strong>Mutual means mutual</strong>A match appears only when interest goes both ways.</p></li><li><span>✓</span><p><strong>No pressure to perform</strong>No public counts, rankings, or keeping score.</p></li></ul></section>

      <section className={styles.demoBanner}><div className={`${styles.bannerOrb} ${styles.bannerOrbOne}`} /><div className={`${styles.bannerOrb} ${styles.bannerOrbTwo}`} /><span className={styles.eyebrow}>YOUR NEXT LITTLE ADVENTURE</span><h2>A little curiosity<br />looks good on you.</h2><p>Step into the demo and see where a quiet little like can lead.</p><a className={`${styles.landingButton} ${styles.bannerButton}`} href="/discover">Try Coy Discover <span aria-hidden="true">→</span></a><span className={styles.bannerFootnote}>Sample profiles · Just for fun</span></section>

      <section className={`${styles.landingSection} ${styles.faqSection}`} id="faq"><div className={styles.sectionHeading}><span className={styles.eyebrow}>GOOD TO KNOW</span><h2>A few questions.</h2></div><div className={styles.faqList}>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span className={styles.faqToggle}>+</span></summary><p>{answer}</p></details>)}</div></section>

      <footer className={styles.landingFooter}><a className={styles.landingLogo} href="#top"><Heart /> coy<span>.</span></a><p>A softer way to find out.<br /><small>Made with care · For adults 18+</small></p><nav aria-label="Footer"><a href="#how">How it works</a><a href="#privacy">Privacy</a><a href="#faq">Questions</a></nav><span className={styles.footerCopy}>© {new Date().getFullYear()} Coy Discover</span></footer>
    </main>
  );
}
