import styles from "./Landing.module.css";

const LockIcon = () => <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
const MessageIcon = () => <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.2A8.5 8.5 0 1 1 21 11.5Z"/><path d="M9 11h.01M12 11h.01M15 11h.01"/></svg>;

const steps = [
  { n: "1", title: "Add your crushes", text: "Add people you know, by phone number or email. Only you can see your list.", color: "lilac" },
  { n: "2", title: "They get an anonymous heads-up", text: "A little message lets them know someone has a crush. Never who.", color: "peach" },
  { n: "3", title: "Add each other and it’s a match", text: "You both find out only when you add each other. If they don’t, nobody ever knows.", color: "pink" },
];

const faqs = [
  ["What is Coy?", "Coy is a double-blind crush-matching experience. Add people you know, and only find out they like you if they add you too."],
  ["Can they work out it was me?", "No. We never show who added someone, or any count that would give it away. Adding is final, so nobody can test names one by one."],
  ["How do they find out?", "They get an anonymous heads-up. It tells them someone has a crush, never who sent it."],
  ["What if they don’t add me back?", "Nothing happens. Your name stays hidden unless they add you too."],
];

export default function Home() {
  return (
    <main className={styles.landing} id="top">
      <header className={styles.landingHeader}>
        <a className={styles.landingLogo} href="#top" aria-label="Coy home">coy<span>.</span></a>
        <nav className={styles.landingNav} aria-label="Main navigation">
          <a href="#how">How it works</a><a href="#privacy">Privacy</a><a href="#faq">Questions</a>
        </nav>
        <a className={`${styles.landingButton} ${styles.headerButton}`} href="/discover">Try the demo</a>
      </header>

      <section className={styles.landingHero}>
        <div className={styles.heroCopy}>
          <span className={styles.sticker}><LockIcon /> 100% anonymous</span>
          <h1>Find out if your crush likes you back.</h1>
          <p className={styles.heroLede}>Add them secretly by phone number or email. If they add you too, it’s a match. If not, nobody ever knows.</p>
          <div className={styles.heroCta}><a className={styles.landingButton} href="/discover">Add your crushes</a><span>Free for your first 3 crushes. 18+ only.</span></div>
          <p className={styles.heroAside}>Rather use the app? <a href="/discover">It works the same way.</a></p>
        </div>
        <figure className={styles.heroVisual} aria-label="An anonymous Coy message and a mutual match">
          <article className={styles.messageCard}>
            <header className={styles.messageHead}><span className={styles.messageIcon}><MessageIcon /></span><strong>A message from Coy</strong><span className={styles.messageTime}>now</span></header>
            <p>Heads up: Someone who has your number added you as their crush on Coy. They won’t know you saw this unless you add them too.</p>
            <span className={styles.messageLink}>getcoy.com/n</span>
          </article>
          <article className={styles.matchCard}>
            <div className={styles.pair} aria-hidden="true"><span className={`${styles.avatar} ${styles.avatarYou}`}>You</span><span className={styles.pairHeart}>♥</span><span className={`${styles.avatar} ${styles.avatarThem}`}>R</span></div>
            <strong className={styles.matchTitle}>It’s a match!</strong>
            <p className={styles.matchText}>You and Riya, 3rd floor added each other.</p>
            <span className={styles.matchAction}>Say hi on WhatsApp</span>
          </article>
          <figcaption>The heads-up they get, and the moment it’s mutual.</figcaption>
        </figure>
      </section>

      <section className={styles.landingBand}><div className={styles.bandInner}><h2>No profiles. No photos. No chat.</h2><p>Just one question: do they like you back?</p></div></section>

      <section className={`${styles.landingSection} ${styles.howSection}`} id="how">
        <div className={styles.sectionHeading}><span className={styles.eyebrow}>THE GOOD PART</span><h2>How it works</h2></div>
        <div className={styles.stepsGrid}>{steps.map((step) => <article className={`${styles.stepCard} ${styles[`step${step.color[0].toUpperCase()}${step.color.slice(1)}`]}`} key={step.n}><div className={styles.stepCardTop}><span className={styles.stepNumber}>{step.n}</span><span aria-hidden="true">✳</span></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
      </section>

      <section className={styles.privacySection} id="privacy"><div className={styles.privacyCopy}><span className={styles.eyebrow}>YOUR BUSINESS, YOURS</span><h2>What if they don’t add you back?</h2><p className={styles.privacyNothing}>Nothing happens.</p><p className={styles.privacyDescription}>They only learn that someone has a crush on them. Your name stays hidden unless they add you too.</p></div><ul className={styles.promiseList}><li><span>✓</span><p><strong>We never say who.</strong> Not directly, and not through counts that would let someone work it out.</p></li><li><span>✓</span><p><strong>Adding is final.</strong> Nobody can add and remove names to test who likes them.</p></li><li><span>✓</span><p><strong>Few messages, never at night.</strong> At most one a week and 3 in total.</p></li><li><span>✓</span><p><strong>Your list stays private.</strong> Your crushes are for your eyes only.</p></li></ul></section>

      <section className={styles.demoBanner}><span className={styles.eyebrow}>A LITTLE MYSTERY, A LOT LESS PRESSURE</span><h2>Someone you know might already have added you.</h2><p>Your first 3 crushes are free. 18+ only.</p><a className={`${styles.landingButton} ${styles.bannerButton}`} href="/discover">Add your crushes</a></section>

      <section className={`${styles.landingSection} ${styles.faqSection}`} id="faq"><div className={styles.sectionHeading}><span className={styles.eyebrow}>GOOD TO KNOW</span><h2>Questions</h2></div><div className={styles.faqList}>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span className={styles.faqToggle}>+</span></summary><p>{answer}</p></details>)}</div></section>

      <footer className={styles.landingFooter}><a className={styles.landingLogo} href="#top">coy<span>.</span></a><p>A little mystery, a lot less pressure.<br /><small>For adults 18+</small></p><nav aria-label="Footer"><a href="#how">How it works</a><a href="#privacy">Privacy</a><a href="#faq">Questions</a></nav><span className={styles.footerCopy}>Coy Discover · Sample profiles</span></footer>
    </main>
  );
}
