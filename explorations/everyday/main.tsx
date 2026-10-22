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
import { GuidedAttendStep } from "./GuidedAttendStep";

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
    const inset = ref.current?.closest(".guided-attention")
      ? (document.querySelector("header")?.getBoundingClientRect().height ??
          0) + 16
      : 0;
    const bounds = ref.current?.getBoundingClientRect();
    if (bounds && (bounds.top < inset || bounds.bottom > innerHeight))
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
  mode = "Prototype · mocked · fictional",
  source = "prototype",
  scope = "fictional",
  compact = false,
  guided = false,
  onExit,
}: {
  children: React.ReactNode;
  mode?: string;
  source?: "prototype" | "pilot";
  scope?: "fictional" | "own_life";
  compact?: boolean;
  guided?: boolean;
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
        <a className="support-link" href="#support">
          Support
        </a>
        {onExit && (
          <Button className="text-button" onClick={onExit}>
            Not now
          </Button>
        )}
      </header>
      <main
        id="practice"
        tabIndex={-1}
        data-source={source}
        data-scope={scope}
        className={guided ? "guided-attention" : undefined}
      >
        <p className="review-note">
          Founder/adviser review · {mode} · Not saved
        </p>
        {!compact && (
          <p className="study-disclosure">
            This is an early prototype, not Mirar’s released product. Nothing
            you choose is saved or sent. It makes no claim about helping you.
          </p>
        )}
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
          Review only. No Mirar account, practice storage, analytics or sending.
          <br />
          Reconciled for founder review; participant approval is pending.
        </small>
      </footer>
      <section id="support" className="support" aria-label="Support">
        <details>
          <summary>Support, if you need it</summary>
          <p>
            You can stop or skip anything here. This prototype is not therapy or
            treatment.
          </p>
          <p>
            In India: emergency assistance <a href="tel:112">112</a>.
            Mental-health support: Tele MANAS{" "}
            <a href="tel:+9114416?oai_link_source=model_response_hotline">
              14416
            </a>
            . If you are elsewhere, use your local support or emergency service.
          </p>
        </details>
      </section>
    </>
  );
}
function Exit({ restart }: { restart: () => void }) {
  return (
    <section className="closing">
      <p className="eyebrow">Left here</p>
      <FocusTitle stamp="left">Another time is fine.</FocusTitle>
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
                  ? "You left the reading here without comparing another one."
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
      mode="Real Attend session · your own attention"
      source="pilot"
      scope="own_life"
      compact
      guided
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
                  ? facts.dispositions.some((d) => d.disposition !== "unknown")
                    ? "Some placed. Some still open."
                    : "Still open. Nothing placed yet."
                  : "A place for each. Not a list to finish."
          }
          onAgain={reset}
          next="Try Attend again"
          details={
            <>
              <p>{value?.usefulNow}</p>
              <ul>
                {value?.unknown.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p>
                This optional practice uses the existing Attend steps. Your
                choices stay only in this open page; saving, reminders and
                return offers are not connected.
              </p>
            </>
          }
        >
          <p>
            {facts?.outcome === "could_not_name"
              ? "You checked, and chose not knowing. No placement is claimed."
              : facts?.outcome === "nothing_pulling"
                ? "You said nothing was pulling at you. You do not have to invent something to arrange."
                : facts?.dispositions.some((d) => d.disposition !== "unknown")
                  ? `You gave the things you named different places. ${facts.dispositions.filter((d) => d.disposition !== "unknown").length} of ${facts.pulls.length} have a chosen place.`
                  : "You looked at what was pulling at you and left its place undecided. Nothing has been placed."}
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
          <GuidedAttentionView
            key={`${tick}-${step.id}`}
            step={step}
            facts={facts}
            send={send}
            error={error}
            label={label}
            onBack={() => {
              session.back();
              setTick((t) => t + 1);
            }}
          />
        </>
      )}
    </Frame>
  );
}
function GuidedAttentionView({
  step,
  facts,
  send,
  error,
  label,
  onBack,
}: {
  step: PStep;
  facts: import("../../lib/innerRep/pilots/types").AttendFacts | null;
  send: (a: PAnswer) => void;
  error: string;
  label: (id: string) => string;
  onBack: () => void;
}) {
  const placing = step.id.startsWith("place:");
  const timing = step.id.startsWith("when:");
  const current = placing || timing ? step.id.split(":")[1] : null;
  const position = current && facts ? facts.pulls.indexOf(current) + 1 : 0;
  const review = step.id === "sit" || step.id === "rearrange";
  const phase =
    step.id === "pulls"
      ? "Choose what’s pulling"
      : placing
        ? `Place one pull · ${position} of ${facts?.pulls.length}`
        : timing
          ? "Set aside, without a reminder"
          : step.id === "hold_offer"
            ? "An optional pause"
            : step.type === "hold"
              ? "At your own pace"
              : review
                ? "Look at your arrangement"
                : "Your practice";
  const history =
    facts && facts.dispositions.length > 0 ? (
      <details
        className="guided-history"
        key={step.id}
        open={review ? true : undefined}
      >
        <summary>
          {review
            ? "Your arrangement"
            : `Choices so far · ${facts.dispositions.length} of ${facts.pulls.length}`}
        </summary>
        <ul>
          {facts.dispositions.map((d) => (
            <li key={d.pull}>
              <span>{label(d.pull)}</span>
              <strong>
                {d.disposition === "unknown"
                  ? "I don’t know"
                  : DISPOSITION_LABEL[d.disposition]}
              </strong>
            </li>
          ))}
        </ul>
      </details>
    ) : null;
  return (
    <section className="guided-work" aria-label="Current Attend step">
      <p className="eyebrow guided-phase">{phase}</p>
      <FocusTitle stamp={step.id}>{step.prompt}</FocusTitle>
      {step.id === "pulls" && (
        <p className="guided-hint">
          First choose the things. You’ll give them a place next.
        </p>
      )}
      {step.type === "hold" && (
        <Window layer="reading">
          <span className="eyebrow">Your chosen foreground</span>
          <p>
            {facts?.attendNow ? label(facts.attendNow) : "One thing, for now."}
          </p>
        </Window>
      )}
      {review && history}
      <GuidedAttendStep
        step={step}
        send={send}
        onBack={onBack}
        pullLabel={current ? label(current) : undefined}
      />
      {error && <p role="alert">{error}</p>}
      {!review && history}
      <details className="guided-help">
        <summary>
          {step.id === "pulls"
            ? "About this optional practice"
            : "A little help, if you need it"}
        </summary>
        <p>
          {step.id === "pulls"
            ? "Choose from the fixed list about your own attention. There is no typing, and nothing is saved or sent. This is real optional-pilot code in an early review prototype, not Mirar’s released product."
            : placing
              ? "You are choosing a place for the pull named above. Only one can be first; set aside, leave open, do nothing and not knowing are all legitimate. Use Back to change an earlier choice where available."
              : timing
                ? "These are the runtime’s time options. No task, deadline or reminder is created."
                : step.type === "hold"
                  ? "There is no timer or measure of focus. You may end the pause or leave the practice."
                  : "Your answer is your own. Keeping, changing, uncertainty and leaving remain available where the step supports them."}
        </p>
      </details>
    </section>
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
                  <h2>Try a reply in this scene.</h2>
                  <p>
                    Try the wording, or keep it as it is. An offer, a pause, a
                    smaller offer and a decline are all available; no response
                    is graded.
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
    <Frame mode="Message/Reply: fictional mock-ups · Attention: real own-life practice">
      <section className="intro hub">
        <p className="eyebrow">Three first-session tries</p>
        <h1>
          Something ordinary.
          <br />A different way through.
        </h1>
        <p>
          Two fictional rehearsals and one optional practice about your own
          attention. No typing, no score, no saved choices.
        </p>
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
          existing step contract with no storage. Message and Reply are
          fictional; Attention is about your own life. None become personal
          evidence or change your Mirar account.
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
