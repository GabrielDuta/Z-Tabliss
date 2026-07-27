import { API } from "../../types";

export type TimeSinceEntry = {
  id: string;
  name: string;
  date: number; // timestamp (ms)
};

type Data = {
  entries: TimeSinceEntry[];
};

export type Props = API<Data>;

export const defaultData: Data = {
  entries: [],
};
