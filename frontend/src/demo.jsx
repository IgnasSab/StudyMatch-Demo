import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Bell, CheckCircle2, FlaskConical, Play, RotateCcw, UserRound, X } from 'lucide-react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { Brand, Button } from './components';
import Participant from './participant';
import Researcher from './researcher';
import { createDemoState, demoAccounts, demoBootstrap, demoStore } from './demo-state';
import { createTourBaseline, demoTours, tourScene } from './demo-tours';
import './demo.css';

function DemoBadge() {
  return <span className="demo-badge">Demo</span>;
}

function RoleStatus({ role }) {
  return <span className={`demo-role-status demo-role-${role}`} aria-live="polite" aria-atomic="true">{role === 'participant' ? <UserRound size={16} strokeWidth={2} /> : <FlaskConical size={16} strokeWidth={2} />}<strong>{role === 'participant' ? 'Participant view' : 'Researcher view'}</strong></span>;
}

function DemoEntry({ onTour, onExplore }) {
  return <div className="demo-entry">
    <header className="demo-entry-header"><Brand /><DemoBadge /></header>
    <main className="demo-entry-main">
      <section className="demo-intro"><h1>Less study admin.<br />More time for research.</h1><p>Find and book studies as a participant. Then create and manage a study as a researcher.</p><div className="demo-entry-actions"><Button onClick={() => onTour('participant')}><Play size={15} />Start participant tour<ArrowRight size={16} /></Button><Button secondary onClick={() => onExplore('participant')}>Explore demo</Button></div></section>
      <section className="demo-entry-roles" aria-label="Participant and researcher roles"><div className="demo-entry-role"><RoleStatus role="participant" /><p>Answer questions, find studies and book a session.</p></div><div className="demo-entry-role"><RoleStatus role="researcher" /><p>Import study details, set session times and view bookings.</p><button className="text-button" onClick={() => onTour('researcher')}>Start researcher tour<ArrowRight size={14} /></button></div></section>
    </main>
  </div>;
}

function TourSpotlight({ step, revision }) {
  useEffect(() => {
    const spotlight = driver({ animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches, duration: 200, overlayOpacity: 0.3, stagePadding: 8, stageRadius: 7, allowClose: false, allowKeyboardControl: false, focus: 'none', overlayClickBehavior: 'none', disableActiveInteraction: true, allowedElements: ['.demo-toolbar', '.demo-tour-dock', '.demo-match-alert'], scrollIntoView: false });
    let observer;
    function highlight() {
      const target = document.querySelector(step.target);
      if (!target) return;
      observer.disconnect();
      target.scrollIntoView({ block: 'center', behavior: 'instant' });
      spotlight.highlight({ element: target });
    }
    observer = new MutationObserver(highlight);
    observer.observe(document.getElementById('demo-workspace'), { childList: true, subtree: true });
    highlight();
    return () => { observer.disconnect(); spotlight.destroy(); };
  }, [step, revision]);
  return null;
}

export default function Demo() {
  const [workspace, setWorkspace] = useState(null);
  const [tour, setTour] = useState(null);
  const [revision, setRevision] = useState(0);
  const nextButton = useRef(null);
  const startButton = useRef(null);
  const step = tour === null ? null : demoTours[tour.role][tour.index];
  const lastStep = tour !== null && tour.index === demoTours[tour.role].length - 1;

  function showScene(activeTour) {
    const result = tourScene(activeTour.baseline, activeTour.role, activeTour.index);
    demoStore.restore(result.state);
    setWorkspace({ role: result.accountRole, scene: result.scene });
    setTour(activeTour);
    setRevision((value) => value + 1);
  }

  function startTour(role) {
    showScene({ role, index: 0, baseline: createTourBaseline(role, demoStore.snapshot()) });
  }

  function explore(role, scene = {}) {
    setTour(null);
    setWorkspace({ role, scene });
    setRevision((value) => value + 1);
    window.scrollTo({ top: 0 });
  }

  function exitTour() {
    explore(workspace.role, workspace.scene);
  }

  function next() {
    if (lastStep) {
      if (tour.role === 'participant') startTour('researcher');
      else explore(workspace.role, workspace.scene);
    } else showScene({ ...tour, index: tour.index + 1 });
  }

  function reset() {
    demoStore.restore(createDemoState());
    setTour(null);
    setWorkspace(null);
    setRevision((value) => value + 1);
  }

  useEffect(() => {
    if (tour === null) {
      if (workspace !== null) startButton.current.focus({ preventScroll: true });
      return;
    }
    nextButton.current.focus({ preventScroll: true });
    function keydown(event) {
      if (event.key === 'Escape') { event.preventDefault(); exitTour(); }
      if (event.altKey || event.ctrlKey || event.metaKey || event.target.matches('input, textarea, select')) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
      if (event.key === 'ArrowLeft' && tour.index > 0) { event.preventDefault(); showScene({ ...tour, index: tour.index - 1 }); }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [tour]);

  if (workspace === null) return <DemoEntry onTour={startTour} onExplore={explore} />;
  const AccountWorkspace = workspace.role === 'researcher' ? Researcher : Participant;
  const account = { ...demoAccounts[workspace.role], name: workspace.role === 'participant' ? demoStore.snapshot().profile.name : demoAccounts.researcher.name };
  return <div className={`demo-app demo-role-${workspace.role} ${tour === null ? '' : 'demo-touring'}`}>
    <header className="demo-toolbar" aria-label="Demo controls"><DemoBadge />{tour === null && <button className="text-button demo-home" onClick={() => { setWorkspace(null); setTour(null); }}>Home</button>}<div className="demo-role-switch" aria-label="Switch view">{['participant', 'researcher'].map((role) => <button key={role} aria-pressed={workspace.role === role} className={`demo-role-${role}`} disabled={tour !== null} onClick={() => explore(role)}>{role === 'researcher' ? <FlaskConical size={14} /> : <UserRound size={14} />}<span>{role === 'researcher' ? 'Researcher' : 'Participant'}</span></button>)}</div>{tour === null && <div className="demo-toolbar-actions"><Button ref={startButton} secondary onClick={() => startTour(workspace.role)}><Play size={13} />Start tour</Button><button className="icon-button" onClick={reset} aria-label="Reset demo" title="Reset demo"><RotateCcw size={16} /></button></div>}</header>
    <div id="demo-workspace"><AccountWorkspace key={revision} account={account} bootstrap={demoBootstrap} scene={workspace.scene} onLogout={() => { setTour(null); setWorkspace(null); }} onAccountChange={() => setWorkspace((current) => ({ ...current }))} /></div>
    {tour !== null && <>
      {tour.role === 'participant' && tour.index === 1 && <div className="demo-match-alert" role="status"><Bell size={17} /><strong>New study available</strong></div>}
      <TourSpotlight step={step} revision={revision} />
      <section className="demo-tour-dock" aria-label="Guided product tour" aria-roledescription="product tour">
        <div className="demo-tour-progress"><RoleStatus role={workspace.role} /><span>Step {tour.index + 1} of {demoTours[tour.role].length}</span><button className="text-button demo-restart" onClick={() => showScene({ ...tour, index: 0 })} aria-label="Restart tour" title="Restart tour"><RotateCcw size={15} /></button><button className="demo-exit" onClick={exitTour}><X size={15} />Exit tour</button></div>
        <div className="demo-tour-content"><div className="demo-tour-copy" aria-live="polite" aria-atomic="true"><h2>{step.title}</h2><p>{step.description}</p></div><div className="demo-tour-actions"><Button secondary disabled={tour.index === 0} onClick={() => showScene({ ...tour, index: tour.index - 1 })}><ArrowLeft size={14} />Back</Button><Button ref={nextButton} className={step.nextRole === 'researcher' ? 'demo-researcher-action demo-role-researcher' : ''} onClick={next}>{lastStep ? tour.role === 'participant' ? 'Start researcher tour' : 'Explore demo' : step.next ?? 'Next'}{lastStep && tour.role === 'researcher' ? <CheckCircle2 size={15} /> : <ArrowRight size={15} />}</Button></div></div>
        <div className="demo-tour-track" aria-hidden="true"><span style={{ width: `${(tour.index + 1) / demoTours[tour.role].length * 100}%` }} /></div>
      </section>
    </>}
  </div>;
}
