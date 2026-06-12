// @vitest-environment happy-dom
// @ts-nocheck — TODO Phase 3 ratchet: type this file and remove
import ControlBar, { State } from "./control-bar";

describe("control bar", () => {
  let mockVisualization;
  let mockScenarioLoop;
  let controlBar;

  // ControlBar spins up a GameLoop that self-schedules via
  // requestAnimationFrame; neutralize it so the loop doesn't run (and throw)
  // across tests in the headless DOM.
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", () => 0);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    mockVisualization = {
      attached: true,
      attach: function () {
        this.attached = true;
      },
      detach: function () {
        this.attached = false;
      },
    };

    vi.spyOn(mockVisualization, "attach");
    vi.spyOn(mockVisualization, "detach");

    mockScenarioLoop = {
      timestep: 1 / 60,
      timescale: 1,
      step: vi.fn(),
    };

    controlBar = ControlBar(mockScenarioLoop, mockVisualization);
  });

  // In the worker model the visualization renders the ~1Hz snapshot stream at
  // turbo instead of detaching — the control bar no longer attaches/detaches it.
  it("does not detach the visualization at turbo", () => {
    controlBar.turbo();
    expect(mockVisualization.detach).not.toHaveBeenCalled();
  });

  it("does not attach/detach the visualization across speed changes", () => {
    controlBar.turbo();
    controlBar.play();
    controlBar.fastForward();
    controlBar.pause();
    expect(mockVisualization.attach).not.toHaveBeenCalled();
    expect(mockVisualization.detach).not.toHaveBeenCalled();
  });

  it("toggles between pause and play", () => {
    controlBar.togglePause();
    expect(controlBar.state).toBe(State.pause);

    controlBar.togglePause();
    expect(controlBar.state).toBe(State.play);
  });

  it("toggles between turbo and play", () => {
    controlBar.toggleTurbo();
    expect(controlBar.state).toBe(State.turbo);

    controlBar.toggleTurbo();
    expect(controlBar.state).toBe(State.play);
  });

  it("pauses on step", () => {
    controlBar.step();
    expect(controlBar.state).toBe(State.pause);
  });

  it("steps scenario loop on step", () => {
    controlBar.step();
    expect(mockScenarioLoop.step).toHaveBeenCalled();
  });

  describe("sets scenario loop timescale", () => {
    beforeEach(() => {
      mockScenarioLoop.timescale = undefined;
    });

    it("play", () => {
      controlBar.play();
      expect(mockScenarioLoop.timescale).toBe(controlBar.playTimescale);
    });

    it("fast forward", () => {
      controlBar.fastForward();
      expect(mockScenarioLoop.timescale).toBe(controlBar.fastForwardTimescale);
    });

    it("turbo", () => {
      controlBar.turbo();
      expect(mockScenarioLoop.timescale).toBe(controlBar.turboTimescale);
    });
  });

  it("timescale: turbo > fast forward > play", () => {
    expect(controlBar.turboTimescale).toBeGreaterThan(controlBar.fastForwardTimescale);
    expect(controlBar.fastForwardTimescale).toBeGreaterThan(controlBar.playTimescale);
  });
});
