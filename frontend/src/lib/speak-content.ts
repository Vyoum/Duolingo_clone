/** Seeded speak-practice phrases (client-side; mirrors type_answer grading). */

export type SpeakPrompt = {
  id: string;
  prompt: string;
  phrase: string;
  accepted: string[];
  hint: string;
};

export const SPEAK_PROMPTS: SpeakPrompt[] = [
  {
    id: "speak-hola",
    prompt: "Say hello in Spanish",
    phrase: "hola",
    accepted: ["hola"],
    hint: "A friendly greeting",
  },
  {
    id: "speak-gracias",
    prompt: "Say thank you in Spanish",
    phrase: "gracias",
    accepted: ["gracias"],
    hint: "What you say after someone helps you",
  },
  {
    id: "speak-adios",
    prompt: "Say goodbye in Spanish",
    phrase: "adiós",
    accepted: ["adiós", "adios"],
    hint: "Used when leaving",
  },
  {
    id: "speak-buenos-dias",
    prompt: "Say good morning in Spanish",
    phrase: "buenos días",
    accepted: ["buenos días", "buenos dias"],
    hint: "Morning greeting",
  },
  {
    id: "speak-por-favor",
    prompt: "Say please in Spanish",
    phrase: "por favor",
    accepted: ["por favor", "porfavor"],
    hint: "Polite request word",
  },
];
