import { useEffect } from 'react';
import { ArrowDown, ArrowUpRight, BookOpen, Check, Target } from 'lucide-react';
import Header, { Brand } from '../components/Header.jsx';
import PracticeQuestion from '../components/PracticeQuestion.jsx';

const questions = [
  ['What is CETMastery?', 'CETMastery is a college entrance exam preparation platform in development. We’re starting with focused lessons, skill-based practice, and clear explanations.'],
  ['Can I try it without an account?', 'Yes. The sample mathematics question above is open to everyone. Choose an answer to see the worked solution.'],
  ['Which entrance exams are covered?', 'The first exam program and curriculum are still being defined. This preview demonstrates the learning approach and does not claim official exam coverage.'],
  ['Will my practice be saved?', 'You can create an account with Google. This public sample does not save practice attempts yet; personal progress tracking is coming later.'],
];

export default function HomePage() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <section className="hero" id="home" aria-labelledby="hero-title">
      <img className="hero-image" src="/images/campus.jpg" alt="Graduates tossing their caps into the sky on a campus lawn" width="2400" height="1600" fetchPriority="high" />
      <div className="hero-scrim" />
      <Header />
      <main className="hero-content page-width" id="main">
        <h1 id="hero-title">Your next chapter<br />starts here.</h1>
        <p>A clearer path to college entrance exams, with focused lessons and practice that helps the next concept click.</p>
        <div className="hero-actions"><a className="button button-lime" href="#practice">Find your starting point <ArrowUpRight size={20} aria-hidden="true" /></a><span>A little progress, every day.</span></div>
      </main>
      <div className="hero-bottom page-width">
        <p>Big dreams.<br /><strong>Small, steady steps.</strong></p>
        <a className="discover-link" href="#approach">Discover the approach <span><ArrowDown size={19} aria-hidden="true" /></span></a>
        <p className="hero-bottom-right">Built for the journey<br /><strong>ahead of you.</strong></p>
      </div>
    </section>

    <section className="approach chapter" id="approach" aria-labelledby="approach-title">
      <div className="page-width">
        <div className="section-heading"><h2 id="approach-title" data-reveal>One concept.<br />Then the next.</h2><p data-reveal>Big goals feel closer when you know what to work on today. Here’s the learning loop we’re building.</p></div>
        <div className="learning-grid">
          <article data-reveal><div className="learning-photo"><img src="/images/library.jpg" alt="Books and study spaces in a library" width="1000" height="667" loading="lazy" /><span><BookOpen size={22} aria-hidden="true" /></span></div><h3>Understand the why</h3><p>Short lessons and worked examples put the concept before the shortcut.</p></article>
          <article data-reveal><div className="learning-photo"><img src="/images/study.jpg" alt="A notebook ready for focused writing and practice" width="1000" height="667" loading="lazy" /><span><Target size={22} aria-hidden="true" /></span></div><h3>Give it a go</h3><p>Focused questions help you put one skill into practice while it’s still fresh.</p></article>
          <article data-reveal><div className="learning-photo"><img src="/images/students.jpg" alt="Students working through ideas together around a table" width="1000" height="667" loading="lazy" /><span><Check size={22} aria-hidden="true" /></span></div><h3>Know your next step</h3><p>Clear explanations help you see what clicked and what needs another look.</p></article>
        </div>
      </div>
    </section>

    <section className="practice chapter" id="practice" aria-labelledby="practice-title">
      <div className="practice-layout page-width">
        <div className="practice-copy"><h2 id="practice-title" data-reveal>A small start.<br />A real lightbulb.</h2><p data-reveal>No countdown. No pressure. Try a quick algebra question and see how a worked solution makes the next step clearer.</p><p className="practice-aside" data-reveal>You don’t need to know everything.<br />You just need somewhere to begin.</p></div>
        <div data-reveal><PracticeQuestion /></div>
      </div>
    </section>

    <section className="faq" id="questions" aria-labelledby="faq-title">
      <div className="faq-heading page-width"><h2 id="faq-title" data-reveal>A few good questions.</h2><p data-reveal>A little more about where we’re starting.</p></div>
      {questions.map(([question, answer]) => <div className="faq-band" key={question}><div className="faq-row page-width"><h3 data-reveal>{question}</h3><p data-reveal>{answer}</p></div></div>)}
    </section>

    <footer className="footer"><div className="page-width"><Brand footer /><div className="footer-main"><h2>Your future is<br />worth the effort.</h2><a className="button button-lime" href="#practice">Try a question <ArrowUpRight size={20} aria-hidden="true" /></a></div><div className="footer-bottom"><p>© {new Date().getFullYear()} CETMastery</p><p>Made for your next chapter.</p><a href="#home">Back to top ↑</a></div><p className="photo-credit">Photography: <a href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a>. <a href="/image-credits.txt">Image credits</a></p></div></footer>
  </>;
}
