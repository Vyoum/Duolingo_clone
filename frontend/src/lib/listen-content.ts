export type ListenPrompt = {
  id: string;
  phrase: string;
  meaning: string;
  choices: string[];
};

/** Small listening set drawn from the seeded Spanish curriculum vocabulary. */
export const LISTEN_PROMPTS: ListenPrompt[] = [
  { id: "listen-hola", phrase: "hola", meaning: "hello", choices: ["hello", "goodbye", "thank you"] },
  { id: "listen-gracias", phrase: "gracias", meaning: "thank you", choices: ["please", "thank you", "good morning"] },
  { id: "listen-adios", phrase: "adiós", meaning: "goodbye", choices: ["hello", "water", "goodbye"] },
  { id: "listen-buenos-dias", phrase: "buenos días", meaning: "good morning", choices: ["good night", "good morning", "where is it?"] },
  { id: "listen-agua", phrase: "agua", meaning: "water", choices: ["bread", "milk", "water"] },
];
