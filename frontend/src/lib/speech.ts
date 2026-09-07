/** Browser speech helpers (Web Speech API). No audio leaves the device. */

export type SpeechSupport = {
  recognition: boolean;
  synthesis: boolean;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal?: boolean }>;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function getSpeechSupport(): SpeechSupport {
  if (typeof window === "undefined") return { recognition: false, synthesis: false };
  return {
    recognition: Boolean(recognitionCtor()),
    synthesis: typeof window.speechSynthesis?.speak === "function",
  };
}

/** Mirror backend progress grading.normalize, then drop punctuation for STT noise. */
export function normalizeSpeech(value: string): string {
  const nfc = value.normalize("NFC").toLocaleLowerCase("es-ES");
  return nfc
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = cur;
    }
  }
  return row[b.length];
}

/**
 * STT-tolerant match: exact normalize, small edit distance, or containment for short phrases.
 * Kept conservative so random speech does not pass.
 */
export function speechMatches(transcript: string, accepted: string[]): { ok: boolean; expected: string } {
  const got = normalizeSpeech(transcript);
  const targets = accepted.map(normalizeSpeech).filter(Boolean);
  const expected = accepted[0] ?? "";
  if (!got || !targets.length) return { ok: false, expected };

  for (const target of targets) {
    if (got === target) return { ok: true, expected };
    const maxDist = target.length <= 4 ? 1 : target.length <= 8 ? 2 : 2;
    if (levenshtein(got, target) <= maxDist) return { ok: true, expected };
    // Allow "hola hola" / filler around a short target
    if (target.length >= 3 && (got.includes(target) || target.includes(got)) && Math.abs(got.length - target.length) <= 4) {
      return { ok: true, expected };
    }
  }
  return { ok: false, expected };
}

export function speakText(text: string, lang = "es-ES", rate = 0.92): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof window.speechSynthesis?.speak !== "function") {
      reject(new Error("Speech synthesis is not available in this browser."));
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = rate;
    utter.onend = () => resolve();
    utter.onerror = () => reject(new Error("Could not play speech."));
    // Voices may load async in Chrome
    let started = false;
    const play = () => {
      if (started) return;
      started = true;
      window.speechSynthesis.speak(utter);
    };
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        play();
      };
      // Fallback if event never fires
      window.setTimeout(play, 250);
    } else {
      play();
    }
  });
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && typeof window.speechSynthesis?.cancel === "function") {
    window.speechSynthesis.cancel();
  }
}

export type ListenHandle = {
  stop: () => void;
};

/**
 * Start one-shot Spanish recognition. Caller must stop/abort on unmount.
 */
export function startListening(options: {
  lang?: string;
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (message: string) => void;
  onEnd?: () => void;
}): ListenHandle | null {
  const Ctor = recognitionCtor();
  if (!Ctor) {
    options.onError("Speech recognition is not supported in this browser. Type your answer instead.");
    return null;
  }

  let settled = false;
  const rec = new Ctor();
  rec.lang = options.lang ?? "es-ES";
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 3;

  rec.onresult = event => {
    let interim = "";
    let finalText = "";
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0]?.transcript ?? "";
      if ((result as { isFinal?: boolean }).isFinal) finalText += text;
      else interim += text;
    }
    if (interim) options.onInterim?.(interim);
    if (finalText && !settled) {
      settled = true;
      options.onFinal(finalText.trim());
    }
  };

  rec.onerror = event => {
    if (settled) return;
    const code = event.error;
    if (code === "aborted" || code === "no-speech") {
      options.onError(code === "no-speech" ? "Didn’t catch that — try again or type the phrase." : "Listening canceled.");
      return;
    }
    if (code === "not-allowed" || code === "service-not-allowed") {
      options.onError("Microphone permission is blocked. Allow the mic or type your answer.");
      return;
    }
    options.onError("Speech recognition failed. You can type the phrase instead.");
  };

  rec.onend = () => {
    options.onEnd?.();
  };

  try {
    rec.start();
  } catch {
    options.onError("Could not start the microphone. Type your answer instead.");
    return null;
  }

  return {
    stop: () => {
      try {
        rec.stop();
      } catch {
        try {
          rec.abort();
        } catch {
          /* ignore */
        }
      }
    },
  };
}
