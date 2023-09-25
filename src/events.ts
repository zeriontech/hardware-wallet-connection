import { createNanoEvents } from "nanoevents";

export const emitter = createNanoEvents<{
  error: (value: { error: unknown }) => void;
}>();
