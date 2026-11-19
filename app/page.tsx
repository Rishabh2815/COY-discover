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
    <main className="landing" id="top">
      <header className="landing-header">
        <a className="landing-logo" href="#top" aria-label="Coy home"><Heart /> coy<span>.</span></a>
        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#how">How it works</a><a href="#privacy">Privacy</a><a href="#faq">Questions</a>
        </nav>
        <a className="landing-button header-button" href="/discover">Try the demo <span aria-hidden="true">↗</span></a>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> A little mystery, a lot less pressure</span>
          <h1>Find out if your crush likes you <em>back.</em></h1>
          <p className="hero-lede">A more private way to make a connection. Like someone quietly, and only find out when the feeling is mutual.</p>
          <div className="hero-cta"><a className="landing-button" href="/discover">Explore the demo <span aria-hidden="true">→</span></a><span>Sample profiles · 18+ only</span></div>
          <div className="hero-trust"><span className="trust-heart"><Heart /></span><span><strong>Your likes are yours.</strong><br />No awkward reveals. No pressure.</span></div>
        </div>
        <div className="hero-visual" aria-label="Preview of a mutual match">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="floating-note"><span className="note-icon"><Heart /></span><span><strong>A little secret</strong><small>Your like stays private</small></span><span className="note-lock">⌑</span></div>
          <div className="profile-preview"><div className="preview-sun" /><div className="preview-portrait"><span>R</span><i>✦</i></div><div className="preview-caption"><span className="preview-label">SOMEONE YOU MIGHT LIKE</span><strong>Riya, 24</strong><small>Books, slow mornings &amp; good coffee</small></div></div>
          <div className="match-pop"><span className="match-pop-heart"><Heart /></span><span><small>WHEN IT’S MUTUAL</small><strong>It’s a match!</strong></span><span className="sparkle">✦</span></div>
          <span className="hero-spark hero-spark-a">✳</span><span className="hero-spark hero-spark-b">✦</span>
        </div>
      </section>

      <section className="landing-band"><span className="band-icon"><Heart /></span><p><strong>No pressure. No mind games.</strong><span>Just one question: do they like you back?</span></p><span className="band-decoration">✳</span></section>

      <section className="landing-section how-section" id="how">
        <div className="section-heading"><span className="eyebrow">THE GOOD PART</span><h2>It’s simple by design.</h2><p>Good connections don’t need complicated rules.</p></div>
        <div className="steps-grid">{steps.map((step) => <article className={`step-card step-${step.color}`} key={step.n}><div className="step-card-top"><span className="step-number">{step.n}</span><Heart /></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
      </section>

      <section className="privacy-section" id="privacy"><div className="privacy-copy"><span className="eyebrow">YOUR BUSINESS, YOURS</span><h2>What if they don’t like you back?</h2><p className="privacy-nothing">Nothing happens.</p><p className="privacy-description">Your like stays private. Nobody gets put on the spot, and you can move on without the awkwardness.</p><a href="/discover" className="text-link">See how the demo works <span aria-hidden="true">→</span></a></div><ul className="promise-list"><li><span>✓</span><p><strong>Private by default</strong>Your choice isn’t broadcast to anyone.</p></li><li><span>✓</span><p><strong>Mutual means mutual</strong>A match appears only when interest goes both ways.</p></li><li><span>✓</span><p><strong>No pressure to perform</strong>No public counts, rankings, or keeping score.</p></li></ul></section>

      <section className="demo-banner"><div className="banner-orb banner-orb-one"/><div className="banner-orb banner-orb-two"/><span className="eyebrow">YOUR NEXT LITTLE ADVENTURE</span><h2>A little curiosity<br />looks good on you.</h2><p>Step into the demo and see where a quiet little like can lead.</p><a className="landing-button banner-button" href="/discover">Try Coy Discover <span aria-hidden="true">→</span></a><span className="banner-footnote">Sample profiles · Just for fun</span></section>

      <section className="landing-section faq-section" id="faq"><div className="section-heading"><span className="eyebrow">GOOD TO KNOW</span><h2>A few questions.</h2></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span className="faq-toggle">+</span></summary><p>{answer}</p></details>)}</div></section>

      <footer className="landing-footer"><a className="landing-logo" href="#top"><Heart /> coy<span>.</span></a><p>A softer way to find out.<br /><small>Made with care · For adults 18+</small></p><nav aria-label="Footer"><a href="#how">How it works</a><a href="#privacy">Privacy</a><a href="#faq">Questions</a></nav><span className="footer-copy">© {new Date().getFullYear()} Coy Discover</span></footer>
    </main>
  );
}
