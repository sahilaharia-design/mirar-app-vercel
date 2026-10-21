import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { PilotSession, valueOf } from "../../lib/innerRep/pilots/session";
import {
  PILOT_CAPS,
  type PAnswer,
  type PStep,
} from "../../lib/innerRep/pilots/types";
import { DISPOSITION_LABEL, PULLS } from "../../lib/innerRep/pilots/attend";
import Mark from "../../assets/brand/mirar-mark.png";
import Wordmark from "../../assets/brand/mirar-wordmark.png";
import "../../design-system/tokens.css";
import "./practice.css";

type Concept = "message" | "attention" | "reply";
const concepts: { id: Concept; name: string; line: string; act: string }[] = [
  {
    id: "message",
    name: "A full stop. Or a whole story?",
    line: "A tiny message. More than one way to read it.",
    act: "Set a reading beside the words",
  },
  {
    id: "attention",
    name: "A little less everywhere.",
    line: "A message, a task, a tempting scroll. Give them a place.",
    act: "Arrange competing pulls",
  },
  {
    id: "reply",
    name: "Before you say yes.",
    line: "A favour, a free half-hour, and a reply you can edit.",
    act: "Rehearse the size of a promise",
  },
];
const concept = new URLSearchParams(location.search).get("practice");
const active = concepts.find((c) => c.id === concept);
function Button({
  children,
  onClick,
  pressed,
  disabled = false,
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  onClick?: () => void;
  pressed?: boolean;
  disabled?: boolean;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <button
      {...rest}
      type="button"
      className={`choice ${className}`}
      onClick={onClick}
      aria-pressed={pressed}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
function FocusTitle({
  children,
  stamp,
}: {
  children: React.ReactNode;
  stamp: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    const bounds = ref.current?.getBoundingClientRect();
    if (bounds && (bounds.top < 0 || bounds.bottom > innerHeight))
      ref.current?.scrollIntoView({ block: "start" });
  }, [stamp]);
  return (
    <h1 ref={ref} tabIndex={-1}>
      {children}
    </h1>
  );
}
function Window({
  children,
  layer = "words",
}: {
  children: React.ReactNode;
  layer?: string;
}) {
  return (
    <div className={`aperture layer-${layer}`}>
      <img className="mark" src={String(Mark)} alt="" />
      <div className="reflection" aria-hidden="true" />
      <div className="window-words">{children}</div>
      <span className="window-rule" aria-hidden="true" />
    </div>
  );
}
function Frame({
  children,
  mode = "Proposed mechanic · mocked",
  onExit,
}: {
  children: React.ReactNode;
  mode?: string;
  onExit?: () => void;
}) {
  return (
    <>
      <a className="skip" href="#practice">
        Skip to practice
      </a>
      <header>
        <a href="/" aria-label="Mirar practice explorations">
          <img className="wordmark" src={String(Wordmark)} alt="Mirar" />
        </a>
        <span>Everyday emotional fitness</span>
        {onExit && (
          <Button className="text-button" onClick={onExit}>
            Not now
          </Button>
        )}
      </header>
      <main id="practice">
        <p className="review-note">
          Experience exploration · {mode} · Not saved
        </p>
        {children}
      </main>
      <footer>
        <img src={String(Mark)} alt="" />
        <p>
          Curiosity is the entry point.
          <br />
          Practice is the product.
        </p>
        <small>
          Review only. No account, storage, analytics or sending.
          <br />
          New behavioral approval pending Claude’s realignment spec.
        </small>
      </footer>
    </>
  );
}
function Exit({ restart }: { restart: () => void }) {
  return (
    <section className="closing">
      <p className="eyebrow">Left here</p>
      <h1>Another time is fine.</h1>
      <p>
        You stopped this try. Nothing was saved, sent or counted as a completed
        practice.
      </p>
      <div className="actions">
        <Button onClick={restart}>Start this try again</Button>
        <a className="choice" href="/">
          See the three practices
        </a>
      </div>
    </section>
  );
}
function Ending({
  title,
  children,
  details,
  onAgain,
  next = "Try this scene again",
}: {
  title: string;
  children: React.ReactNode;
  details: React.ReactNode;
  onAgain: () => void;
  next?: string;
}) {
  return (
    <section className="closing">
      <p className="eyebrow">A place to stop</p>
      <FocusTitle stamp={title}>{title}</FocusTitle>
      {children}
      <details>
        <summary>A little more, if you’re curious</summary>
        <div>{details}</div>
      </details>
      <p className="quiet">
        This try stays only in this open page. It adds nothing to your personal
        Mirror.
      </p>
      <div className="actions">
        <Button onClick={onAgain}>{next}</Button>
        <a className="choice" href="/">
          Leave it here
        </a>
      </div>
    </section>
  );
}
const scenes = [
  {
    message: "Fine.",
    context: "You suggest a different café. A friend replies:",
    readings: [
      "They’re annoyed.",
      "They’re happy with the change.",
      "I can’t tell.",
    ],
    other: [
      "They’re replying quickly.",
      "They may be annoyed.",
      "The message doesn’t tell us.",
    ],
  },
  {
    message: "Sure.",
    context: "You ask a friend to join a walk. They reply:",
    readings: [
      "They don’t really want to.",
      "They want to come.",
      "I can’t tell.",
    ],
    other: [
      "They’re keeping it brief.",
      "They might be reluctant.",
      "The message doesn’t tell us.",
    ],
  },
];
function Message() {
  const [scene, setScene] = useState(0),
    [phase, setPhase] = useState("entry"),
    [first, setFirst] = useState<number | null>(null),
    [view, setView] = useState("words"),
    [seen, setSeen] = useState<string[]>([]),
    [other, setOther] = useState(0),
    [outcome, setOutcome] = useState(""),
    [left, setLeft] = useState(false);
  const s = scenes[scene];
  const reset = (another = false) => {
    setScene(another ? (scene + 1) % scenes.length : scene);
    setPhase("entry");
    setFirst(null);
    setView("words");
    setSeen([]);
    setOther(0);
    setOutcome("");
    setLeft(false);
  };
  const look = (v: string) => {
    setView(v);
    setSeen((a) => (a.includes(v) ? a : [...a, v]));
  };
  return (
    <Frame onExit={() => setLeft(true)}>
      {left ? (
        <Exit restart={() => reset()} />
      ) : phase === "close" ? (
        <Ending
          title={
            outcome === "unknown"
              ? "The meaning can stay open."
              : outcome === "keep"
                ? "A reading, beside the words."
                : first === 2
                  ? "A possibility, with room around it."
                  : "Two possibilities. The same message."
          }
          onAgain={() => reset(true)}
          next="Try a different message"
          details={
            <>
              <p>
                You were rehearsing a distinction: words you can see, and
                meaning a reader adds. No preferred interpretation was supplied.
              </p>
              <p>
                A reading can stay plausible without becoming a fact. This scene
                does not tell us what the friend meant.
              </p>
            </>
          }
        >
          <div className="closing-pair">
            <div>
              <span className="eyebrow">The words</span>
              <blockquote>{s.message}</blockquote>
            </div>
            <div>
              <span className="eyebrow">Still unknown</span>
              <p>What the friend meant.</p>
            </div>
          </div>
          <p>
            {seen.includes("other")
              ? "You moved between the message and another possible reading."
              : seen.includes("reading")
                ? "You put a reading next to the message."
                : seen.length
                  ? "You looked again at the message itself."
                  : "You read the message without choosing an interpretation."}{" "}
            {outcome === "keep"
              ? `You kept “${s.readings[first ?? 2]}” as your reading; the words alone do not confirm it.`
              : outcome === "unknown"
                ? "You left the meaning undecided. There is nothing else to answer."
                : `You left “${s.other[other]}” beside your first reading. Neither has been confirmed.`}
          </p>
          {first === 2 && seen.length === 0 && (
            <Button
              onClick={() => {
                setSeen(["words"]);
                setPhase("practice");
              }}
            >
              Try the windows, if you like
            </Button>
          )}
        </Ending>
      ) : (
        <>
          <div className="intro">
            <p className="eyebrow">01 / A small message</p>
            <FocusTitle stamp={phase}>
              {phase === "entry"
                ? "A full stop. Or a whole story?"
                : "Look through another window."}
            </FocusTitle>
            <p>
              {phase === "entry"
                ? "A fictional moment. Nothing about your own life to share."
                : "Keep the words in view. Move between readings without having to settle on one."}
            </p>
          </div>
          <div className="practice-grid">
            <section className="scene" aria-label="Fictional message">
              <p>{s.context}</p>
              <Window layer={view}>
                <span className="eyebrow">
                  {view === "words"
                    ? "The message"
                    : view === "reading"
                      ? "Your first reading"
                      : "Another possible reading"}
                </span>
                <p>
                  {view === "words"
                    ? s.message
                    : view === "reading"
                      ? s.readings[first ?? 2]
                      : s.other[other]}
                </p>
              </Window>
              <p className="caption">
                Fictional scene · no hidden “correct” meaning
              </p>
            </section>
            <section className="workbench">
              {phase === "entry" ? (
                <>
                  <h2>Where does your attention go first?</h2>
                  <div className="choices">
                    {s.readings.map((r, i) => (
                      <Button
                        key={r}
                        onClick={() => {
                          setFirst(i);
                          setView("words");
                          setOutcome(i === 2 ? "unknown" : "");
                          setPhase(i === 2 ? "close" : "practice");
                          setSeen(i === 2 ? [] : ["words"]);
                        }}
                      >
                        {r}
                      </Button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="view-controls"
                    role="group"
                    aria-label="Window views"
                  >
                    {[
                      ["words", "The words"],
                      ["reading", "My first reading"],
                      ["other", "Another reading"],
                    ].map(([id, t]) => (
                      <Button
                        key={id}
                        pressed={view === id}
                        onClick={() => look(id)}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                  {view === "other" && (
                    <div
                      className="choices"
                      role="group"
                      aria-label="Possible readings"
                    >
                      {s.other.map((r, i) => (
                        <Button
                          key={r}
                          pressed={other === i}
                          onClick={() => {
                            setOther(i);
                            look("other");
                          }}
                        >
                          {r}
                        </Button>
                      ))}
                    </div>
                  )}
                  <p className="quiet">
                    The original reading can still fit. So can uncertainty.
                  </p>
                  <h2>Where would you leave it?</h2>
                  <div className="choices">
                    <Button
                      onClick={() => {
                        setOutcome("keep");
                        setPhase("close");
                      }}
                    >
                      Keep my first reading
                    </Button>
                    <Button
                      disabled={!seen.includes("other")}
                      onClick={() => {
                        setOutcome("both");
                        setPhase("close");
                      }}
                    >
                      Let another reading sit beside it
                    </Button>
                    {!seen.includes("other") && (
                      <p className="caption">
                        Open “Another reading” to try one beside it.
                      </p>
                    )}
                    <Button
                      onClick={() => {
                        setOutcome("unknown");
                        setPhase("close");
                      }}
                    >
                      I don’t know — leave it open
                    </Button>
                  </div>
                  <Button
                    className="text-button"
                    onClick={() => setPhase("entry")}
                  >
                    Back to the first impression
                  </Button>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </Frame>
  );
}
const makeSession = () =>
  new PilotSession("attend", {
    today: new Date().toISOString().slice(0, 10),
    caps: PILOT_CAPS,
    prior: [],
  });
function Attention() {
  const [session, setSession] = useState(makeSession),
    [tick, setTick] = useState(0),
    [left, setLeft] = useState(false),
    [error, setError] = useState("");
  const step = session.step();
  const rec = session.record(1);
  const facts = rec?.pilot === "attend" ? rec.facts : null;
  const value = rec ? valueOf(rec) : null;
  const send = (a: PAnswer) => {
    try {
      session.answer(a);
      setError("");
      setTick((t) => t + 1);
    } catch {
      setError(
        "That choice could not be used. Please choose an available option.",
      );
    }
  };
  const reset = () => {
    setSession(makeSession());
    setLeft(false);
    setError("");
    setTick(0);
  };
  const label = (id: string) => PULLS.find((p) => p.id === id)?.label ?? id;
  return (
    <Frame
      mode="Real Attend session · fictional rehearsal"
      onExit={() => {
        session.leave();
        setLeft(true);
      }}
    >
      {left ? (
        <Exit restart={reset} />
      ) : !step ? (
        <Ending
          title={
            facts?.outcome === "could_not_name"
              ? "No need to arrange what you can’t name."
              : facts?.outcome === "nothing_pulling"
                ? "Nothing needs arranging."
                : facts?.dispositions.some((d) => d.disposition === "unknown")
                  ? "Some placed. Some still open."
                  : "A place for each. Not a list to finish."
          }
          onAgain={reset}
          details={
            <>
              <p>{value?.usefulNow}</p>
              <ul>
                {value?.unknown.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p>
                This uses the existing Attend step machine and closing facts. In
                this rehearsal, its record stays in memory; return offers and
                saving are not connected.
              </p>
            </>
          }
        >
          <p>
            {facts?.outcome === "could_not_name"
              ? "You checked, and chose not knowing. No placement is claimed."
              : facts?.outcome === "nothing_pulling"
                ? "You chose nothing for this scene. You do not have to invent something to arrange."
                : `You tried giving the scene’s pulls different places. ${facts?.dispositions.filter((d) => d.disposition !== "unknown").length} of ${facts?.pulls.length} have a chosen place.`}
          </p>
          {facts?.outcome === "arranged" && (
            <PlacementBoard facts={facts} label={label} />
          )}
          {facts?.hold === "ended" && (
            <p>
              You stayed with one pull until you chose to end the pause. Nothing
              here measures how focused you were.
            </p>
          )}
        </Ending>
      ) : (
        <>
          <div className="intro">
            <p className="eyebrow">02 / A little less everywhere</p>
            <FocusTitle stamp={`${step.id}-${tick}`}>
              {step.id === "pulls"
                ? "Between one thing and the next."
                : step.type === "hold"
                  ? "One thing, for this moment."
                  : "Give it somewhere to be."}
            </FocusTitle>
            <p>
              Imagine an ordinary afternoon: a task half-finished, a message
              waiting, a phone nearby. Choose for this made-up scene, not about
              yourself.
            </p>
          </div>
          <div className="practice-grid attention-grid">
            <section className="scene">
              <Window layer={facts?.attendNow ? "reading" : "words"}>
                <span className="eyebrow">One place in the foreground</span>
                <p>
                  {facts?.attendNow
                    ? label(facts.attendNow)
                    : "Not everything needs to be now."}
                </p>
              </Window>
              {facts && facts.pulls.length > 0 && (
                <PlacementBoard facts={facts} label={label} />
              )}
            </section>
            <section className="workbench">
              <p className="eyebrow">
                {step.type === "multi"
                  ? "Choose the props for the scene"
                  : step.type === "hold"
                    ? "Self-paced · no timer"
                    : "Place, don’t prioritise"}
              </p>
              <h2>{step.prompt}</h2>
              <AttendStep key={`${tick}-${step.id}`} step={step} send={send} />
              {error && <p role="alert">{error}</p>}
              {step.allowBack && (
                <Button
                  className="text-button"
                  onClick={() => {
                    session.back();
                    setTick((t) => t + 1);
                  }}
                >
                  Back
                </Button>
              )}
              <p className="caption">
                Set aside, leave open, do nothing and don’t know are different,
                equally legitimate choices. No reminders are created.
              </p>
            </section>
          </div>
        </>
      )}
    </Frame>
  );
}
function AttendStep({
  step,
  send,
}: {
  step: PStep;
  send: (a: PAnswer) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  if (step.type === "hold")
    return (
      <>
        <p className="pause-line">
          Stay with the chosen pull, or simply pause here. You decide when to
          end.
        </p>
        <Button onClick={() => send({ stepId: step.id, kind: "hold_end" })}>
          {step.endLabel}
        </Button>
      </>
    );
  if (step.type === "words") return null; // Attend emits no words step; never create a personal text field.
  return (
    <div className={`choices ${step.id.startsWith("place:") ? "places" : ""}`}>
      {step.options.map((o) => (
        <React.Fragment key={o.id}>
          <Button
            disabled={
              !!o.disabled ||
              (step.type === "multi" &&
                selected.length >= step.max &&
                !selected.includes(o.id))
            }
            pressed={
              step.type === "multi" ? selected.includes(o.id) : undefined
            }
            aria-describedby={o.disabled ? `reason-${o.id}` : undefined}
            onClick={() =>
              step.type === "multi"
                ? setSelected((a) =>
                    a.includes(o.id)
                      ? a.filter((x) => x !== o.id)
                      : [...a, o.id],
                  )
                : send({ stepId: step.id, kind: "option", optionId: o.id })
            }
          >
            {o.label}
          </Button>
          {o.disabled && (
            <p className="caption" id={`reason-${o.id}`}>
              {o.disabled}
            </p>
          )}
        </React.Fragment>
      ))}
      {step.type === "multi" && (
        <>
          <p role="status" className="caption">
            {selected.length} of {step.max} selected
          </p>
          <Button
            className="solid"
            disabled={!selected.length}
            onClick={() =>
              send({ stepId: step.id, kind: "options", optionIds: selected })
            }
          >
            Give these a place
          </Button>
          <Button
            onClick={() =>
              send({ stepId: step.id, kind: "options", optionIds: [] })
            }
          >
            {step.noneLabel}
          </Button>
        </>
      )}
      {step.allowUnknown && (
        <Button onClick={() => send({ stepId: step.id, kind: "unknown" })}>
          I don’t know
        </Button>
      )}
    </div>
  );
}
function PlacementBoard({
  facts,
  label,
}: {
  facts: import("../../lib/innerRep/pilots/types").AttendFacts;
  label: (id: string) => string;
}) {
  return (
    <div
      className="placement-board"
      role="region"
      aria-label="Current arrangement"
    >
      {(
        ["attend_now", "set_aside", "leave_open", "let_be", "unknown"] as const
      ).map((d) => (
        <div className={`place place-${d}`} key={d}>
          <span>
            {d === "unknown" ? "Not sure where" : DISPOSITION_LABEL[d]}
          </span>
          <ul>
            {facts.dispositions
              .filter((x) => x.disposition === d)
              .map((x) => (
                <li key={x.pull}>{label(x.pull)}</li>
              ))}
          </ul>
          {!facts.dispositions.some((x) => x.disposition === d) && (
            <span className="vacant">—</span>
          )}
        </div>
      ))}
    </div>
  );
}
const offers = [
  ["smaller", "I can help for half an hour."],
  ["check", "Let me check before I promise."],
  ["decline", "I can’t help on Saturday."],
  ["original", "Of course. I can stay all day."],
];
const limits = [
  ["limit", "I’ll need to leave after that."],
  ["open", "I don’t know about the afternoon yet."],
  ["none", "No extra line"],
];
function Reply() {
  const [offer, setOffer] = useState("original"),
    [limit, setLimit] = useState("none"),
    [phase, setPhase] = useState("edit"),
    [result, setResult] = useState(""),
    [left, setLeft] = useState(false);
  const draft =
    offers.find((x) => x[0] === offer)![1] +
    (limit === "none" ? "" : " " + limits.find((x) => x[0] === limit)![1]);
  const reset = () => {
    setOffer("original");
    setLimit("none");
    setPhase("edit");
    setResult("");
    setLeft(false);
  };
  const finish = (r: string) => {
    setResult(r);
    setPhase("close");
  };
  return (
    <Frame onExit={() => setLeft(true)}>
      {left ? (
        <Exit restart={reset} />
      ) : phase === "close" ? (
        <Ending
          title={
            result === "unknown"
              ? "No promise needed."
              : result === "unsent"
                ? "A reply can wait."
                : "A reply, with its edges in view."
          }
          onAgain={reset}
          details={
            <>
              <p>
                The rehearsal was editing the size of an offer, then holding it
                beside what is known. This tests boundary wording, not whether
                you are good at boundaries.
              </p>
              <p>
                The friend’s response, and what you could do in a real
                situation, remain unknown. There is no best answer here.
              </p>
            </>
          }
        >
          {result === "draft" ? (
            <>
              <blockquote className="draft-final">{draft}</blockquote>
              <p>
                {offer === "original"
                  ? "You reviewed and kept the all-day offer. The scene only establishes half an hour free; it does not establish that an all-day promise could be kept."
                  : "You edited an offer and read it beside the scene’s limit. You now have wording to examine, rather than an automatic yes."}
              </p>
            </>
          ) : (
            <p>
              {result === "unknown"
                ? "You left the reply undecided. No edited reply or boundary practice is claimed."
                : "You chose to leave the reply unsent in this scene. That does not commit you to doing anything later."}
            </p>
          )}
          <p>Nothing was sent. Nothing was scheduled.</p>
        </Ending>
      ) : (
        <>
          <div className="intro">
            <p className="eyebrow">03 / Before you say yes</p>
            <FocusTitle stamp={phase}>
              {phase === "edit"
                ? "A favour. A free half-hour."
                : "Read it beside what you know."}
            </FocusTitle>
            <p>
              A fictional friend asks for help moving on Saturday. You have half
              an hour free; the afternoon is undecided.
            </p>
          </div>
          <div className="practice-grid">
            <section className="scene">
              <div className="incoming">
                <span className="eyebrow">A message</span>
                <p>“Could you help me move on Saturday?”</p>
              </div>
              <Window layer={offer === "original" ? "words" : "reading"}>
                <span className="eyebrow">Draft · not sent</span>
                <p>{draft}</p>
              </Window>
              {phase === "review" && (
                <div className="known">
                  <p>
                    <strong>Known in the scene</strong>
                    <br />
                    Half an hour free.
                  </p>
                  <p>
                    <strong>Still open</strong>
                    <br />
                    The afternoon. How the friend will respond.
                  </p>
                </div>
              )}
            </section>
            <section className="workbench">
              {phase === "edit" ? (
                <>
                  <h2>Make a reply you could stand behind in this scene.</h2>
                  <p>
                    Try changing the offer. Keep it, shrink it, check first or
                    decline.
                  </p>
                  <div
                    className="choices"
                    role="group"
                    aria-label="Edit the offer"
                  >
                    {offers.map(([id, text]) => (
                      <Button
                        key={id}
                        pressed={id === offer}
                        onClick={() => {
                          setOffer(id);
                          setLimit("none");
                        }}
                      >
                        {text}
                      </Button>
                    ))}
                  </div>
                  {offer === "smaller" && (
                    <>
                      <h2>Add an edge, if it needs one.</h2>
                      <div
                        className="choices"
                        role="group"
                        aria-label="Optional boundary line"
                      >
                        {limits.map(([id, text]) => (
                          <Button
                            key={id}
                            pressed={id === limit}
                            onClick={() => setLimit(id)}
                          >
                            {text}
                          </Button>
                        ))}
                      </div>
                    </>
                  )}
                  <Button className="solid" onClick={() => setPhase("review")}>
                    Read the draft back
                  </Button>
                </>
              ) : (
                <>
                  <h2>The offer and the available time.</h2>
                  <p>
                    {offer === "original"
                      ? "This draft still promises the whole day. Half an hour is the part the scene establishes."
                      : "This wording is a possibility for this scene, not advice about a real conversation."}
                  </p>
                  <div className="choices">
                    <Button onClick={() => finish("draft")}>
                      Keep this draft for the closing
                    </Button>
                    <Button onClick={() => setPhase("edit")}>
                      Edit it again
                    </Button>
                  </div>
                </>
              )}
              <div className="choices quiet-choices">
                <Button onClick={() => finish("unsent")}>
                  Leave it unsent for now
                </Button>
                <Button onClick={() => finish("unknown")}>I don’t know</Button>
              </div>
            </section>
          </div>
        </>
      )}
    </Frame>
  );
}
function Hub() {
  return (
    <Frame mode="Two mocked mechanics · one real session contract">
      <section className="intro hub">
        <p className="eyebrow">Three first-session tries</p>
        <h1>
          Something ordinary.
          <br />A different way through.
        </h1>
        <p>No life story. No score. Just a small thing to try.</p>
      </section>
      <div className="concepts">
        {concepts.map((c, i) => (
          <a
            className={`concept concept-${c.id}`}
            key={c.id}
            href={`/?practice=${c.id}`}
          >
            <span className="eyebrow">
              0{i + 1} /{" "}
              {i === 1 ? "Real Attend contract" : "Proposed mechanic"}
            </span>
            <img src={String(Mark)} alt="" />
            <h2>{c.name}</h2>
            <p>{c.line}</p>
            <span className="concept-try">
              Try it <span aria-hidden="true">↗</span>
            </span>
          </a>
        ))}
      </div>
      <details className="research">
        <summary>What this exploration is testing</summary>
        <p>
          These are three ways of practising, not three new visual identities.
          Whether they feel useful, playful or worth returning to needs
          first-time human testing.
        </p>
        <p>
          The message and reply mechanics are mocked proposals. Attend runs the
          existing step contract with no storage. All scenes are fictional; none
          become personal evidence.
        </p>
      </details>
    </Frame>
  );
}
createRoot(document.getElementById("root")!).render(
  !active ? (
    <Hub />
  ) : active.id === "message" ? (
    <Message />
  ) : active.id === "attention" ? (
    <Attention />
  ) : (
    <Reply />
  ),
);
