/* Review-only browser checks. Install tooling outside this repository; pass paths via env. */
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const axe = fs.readFileSync(
  process.env.AXE_PATH || require.resolve("axe-core/axe.min.js"),
  "utf8",
);
const base = process.env.PRACTICE_URL || "http://127.0.0.1:5193";
const out = process.env.PRACTICE_EVIDENCE || "/tmp/mirar-everyday-evidence";
fs.mkdirSync(out, { recursive: true });
const rows = [],
  errors = [],
  external = [];
let page;
const button = (n) => page.getByRole("button", { name: n, exact: true });
const click = async (n) => {
  await button(n).click();
};
const has = async (t) =>
  assert((await page.locator("body").innerText()).includes(t), t);
const absent = async (t) =>
  assert(!(await page.locator("body").innerText()).includes(t), t);
async function open(id) {
  await page.goto(base + (id ? "/?practice=" + id : "/"));
  await page.evaluate(() => document.fonts.ready);
}
async function audit(label) {
  await page.addScriptTag({ content: axe });
  const a = await page.evaluate(async () => {
    const r = await axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"],
      },
    });
    return {
      violations: r.violations.map((x) => ({
        id: x.id,
        impact: x.impact,
        nodes: x.nodes.map((n) => n.target),
      })),
      incomplete: r.incomplete.map((x) => x.id),
      incompleteDetails: r.incomplete.map((x) => ({
        id: x.id,
        nodes: x.nodes.map((n) => ({
          target: n.target,
          reason: n.failureSummary,
        })),
      })),
      passes: r.passes.length,
    };
  });
  const g = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    small: [...document.querySelectorAll("button,a.choice")]
      .filter((e) => !e.disabled)
      .filter((e) => {
        let r = e.getBoundingClientRect();
        return r.height > 0 && (r.height < 44 || r.width < 44);
      })
      .map((e) => e.textContent),
    local: localStorage.length,
    session: sessionStorage.length,
    focus: document.activeElement.tagName,
  }));
  rows.push({ label, viewport: page.viewportSize(), ...a, ...g });
  assert.deepEqual(a.violations, [], label);
  assert(
    a.incomplete.every((id) => id === "color-contrast"),
    label,
  ); // Image-backed contrast receives explicit manual review; never suppress other rules.
  assert(!g.overflow, label);
  assert.deepEqual(g.small, [], label);
  assert.equal(g.local, 0);
  assert.equal(g.session, 0);
}
async function shot(name) {
  await page.screenshot({
    path: path.join(out, name + ".png"),
    fullPage: true,
  });
}
async function pulls(names) {
  for (const n of names) await click(n);
  await click("Give these a place");
}
async function place(n) {
  await click(n);
}
async function run() {
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROME ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  const context = await browser.newContext({
    reducedMotion: "reduce",
    hasTouch: true,
  });
  page = await context.newPage();
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("request", (r) => {
    if (!r.url().startsWith(base) && !r.url().startsWith("data:"))
      external.push(r.url());
  });
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [768, 1024],
    [1024, 768],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    await open();
    await audit("hub");
    await open("message");
    await audit("message-entry");
    if (width === 390 || width === 1440) await shot("message-entry-" + width);
    await click("They’re annoyed.");
    await click("Another reading");
    await click("They may be annoyed.");
    await audit("message-reversible-views");
    await click("Let another reading sit beside it");
    await audit("message-closing");
    assert.equal(
      await page.locator("h1").evaluate((e) => e === document.activeElement),
      true,
    );
    if (width === 390) await shot("message-closing-" + width);
    await open("reply");
    await audit("reply-entry");
    await click("I can help for half an hour.");
    await click("I’ll need to leave after that.");
    await click("Read the draft back");
    await audit("reply-review");
    if (width === 390 || width === 1440) await shot("reply-review-" + width);
    await click("Keep this draft for the closing");
    await audit("reply-closing");
    await open("attention");
    await audit("attention-selection");
    await pulls(["A message or notification waiting", "A work task"]);
    await place("Attend to it now");
    assert(await button("Attend to it now").isDisabled());
    await has("Only one thing can have your attention first");
    await audit("attention-one-now-constraint");
    await place("Set it aside for now");
    await place("No time set");
    await place("Stay with it now. I will say when I am ready.");
    await audit("attention-hold");
    await click("I am ready");
    await click("Mixed");
    await click("Leave it as it is");
    await audit("attention-closing");
    if (width === 390 || width === 1440)
      await shot("attention-closing-" + width);
    for (const id of ["message", "attention", "reply"]) {
      await open(id);
      await click("Not now");
      await has("Nothing was saved, sent or counted");
      await audit(id + "-exit");
      await click("Start this try again");
    }
    console.log("PASS viewport", width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  // Every opening reading, every possible alternative, every final stance (27 combinations).
  for (const first of [
    "They’re annoyed.",
    "They’re happy with the change.",
    "I can’t tell.",
  ])
    for (const alt of [
      "They’re replying quickly.",
      "They may be annoyed.",
      "The message doesn’t tell us.",
    ])
      for (const end of [
        "Keep my first reading",
        "Let another reading sit beside it",
        "I don’t know — leave it open",
      ]) {
        await open("message");
        await click(first);
        if (first === "I can’t tell.")
          await click("Try the windows, if you like");
        await click("Another reading");
        await click(alt);
        await click("The words");
        await click("My first reading");
        await click(end);
        await has("What the friend meant.");
        await audit("message-branch-" + first + " / " + alt + " / " + end);
      }
  await open("message");
  await click("I can’t tell.");
  await has("You read the message without choosing an interpretation.");
  await absent("You moved between");
  await audit("message-no-unperformed-practice");
  await click("Try a different message");
  await has("Sure.");
  await click("They want to come.");
  await click("Back to the first impression");
  await click("I can’t tell.");
  await click("Try the windows, if you like");
  await click("Keep my first reading");
  await audit("message-second-scene-back");
  // Every legal reply draft; no contradictory optional lines on check/decline/original.
  for (const offer of [
    "Of course. I can stay all day.",
    "Let me check before I promise.",
    "I can’t help on Saturday.",
    "I can help for half an hour.",
  ]) {
    for (const edge of offer === "I can help for half an hour."
      ? [
          "I’ll need to leave after that.",
          "I don’t know about the afternoon yet.",
          "No extra line",
        ]
      : [null]) {
      await open("reply");
      await click(offer);
      if (edge) await click(edge);
      await click("Read the draft back");
      await click("Edit it again");
      await click("Read the draft back");
      await click("Keep this draft for the closing");
      await has("Nothing was sent. Nothing was scheduled.");
      await audit("reply-draft-" + offer + " / " + edge);
    }
  }
  for (const end of ["I don’t know", "Leave it unsent for now"]) {
    await open("reply");
    await click(end);
    await audit("reply-permission-" + end);
  }
  // Actual Attend contracts: all placement types, max five, all set-aside dates, hold alternatives,
  // uncertainty, none, revisit/back and one rearrangement. No mocked success snapshots.
  for (const early of ["I don’t know", "Nothing is pulling at me right now"]) {
    await open("attention");
    await click(early);
    await absent("You tried giving");
    await audit("attention-empty-" + early);
  }
  await open("attention");
  await pulls(["A message or notification waiting"]);
  await click("I don’t know");
  await click("I don’t know");
  await absent("one of them has your attention first");
  await audit("attention-unknown-not-intentional-nothing");
  for (const when of ["Later today", "Another day", "No time set"]) {
    await open("attention");
    await pulls(["A work task"]);
    await place("Set it aside for now");
    await click(when);
    await click("Settled");
    await audit("attention-set-aside-" + when);
  }
  for (const hold of ["I will go to it after this", "I don’t know"]) {
    await open("attention");
    await pulls(["My phone or feeds"]);
    await place("Attend to it now");
    await click(hold);
    await click("I don’t know");
    await audit("attention-hold-offer-" + hold);
  }
  await open("attention");
  for (const n of [
    "A message or notification waiting",
    "A work task",
    "My phone or feeds",
    "Something I want to do",
    "A need to rest",
  ])
    await click(n);
  assert(await button("A worry about later").isDisabled());
  await click("Give these a place");
  await click("Attend to it now");
  await click("Back");
  await click("Leave it open");
  await click("Attend to it now");
  await click("Do nothing with it for now");
  await click("Leave it open");
  await click("I don’t know");
  await click("I will go to it after this");
  await click("Still pulling at me");
  await click("Rearrange it");
  for (let i = 0; i < 5; i++) await click("Do nothing with it for now");
  await click("Settled");
  await has("5 of 5 have a chosen place");
  await audit("attention-max-five-back-rearrange");
  await open("attention");
  await pulls(["A work task"]);
  await place("Attend to it now");
  await click("Stay with it now. I will say when I am ready.");
  await click("Not now");
  await has("Nothing was saved, sent or counted");
  await absent("You stayed with");
  await audit("attention-left-during-hold");
  // Keyboard-only activation. Window controls must not depend on pointer gestures.
  await open("message");
  let reached = false;
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press("Tab");
    if (
      await button("They’re annoyed.").evaluate(
        (e) => e === document.activeElement,
      )
    ) {
      reached = true;
      break;
    }
  }
  assert(reached);
  assert.notEqual(
    await page
      .locator(":focus")
      .evaluate((e) => getComputedStyle(e).outlineStyle),
    "none",
  );
  await page.keyboard.press("Enter");
  await has("Look through another window.");
  await audit("keyboard-window-entry-reduced-motion");
  const animations = await page.evaluate(
    () =>
      document.getAnimations().filter((a) => a.playState === "running").length,
  );
  assert.equal(animations, 0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open("message");
  await click("They’re annoyed.");
  await click("Another reading");
  await audit("motion-ordinary-feedback");
  await shot("message-practice-390");
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  fs.writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify(
      {
        audits: rows,
        errors,
        external,
        staticStorage: "zero localStorage/sessionStorage across all audits",
        keyboard: true,
        reducedMotion: true,
        realHumansTested: false,
      },
      null,
      2,
    ),
  );
  console.log("PASS", rows.length, "audits; no external requests or storage");
  await browser.close();
}
run().catch((e) => {
  fs.writeFileSync(path.join(out, "failure.txt"), e.stack);
  console.error(e);
  process.exit(1);
});
