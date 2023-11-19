import { atom, useAtom, useSetAtom } from "jotai";
const keyProbabilitiesAtom = atom(Array(12).fill(0.0));
export const useKeyProbabilities = () => {
  return useAtom(keyProbabilitiesAtom);
};

export const useSetKeyProbabilities = () => {
  return useSetAtom(keyProbabilitiesAtom);
};
