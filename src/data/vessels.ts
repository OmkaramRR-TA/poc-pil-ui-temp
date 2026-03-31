export interface Vessel {
  id: string;
  name: string;
  position: [number, number]; // [longitude, latitude]
  heading: number; // degrees, clockwise from north (0 = north, 90 = east)
  speed: number; // knots
  status: "Underway" | "Anchored" | "Docked";
}

export const vessels: Vessel[] = [
  {
    id: "V001",
    name: "Pacific Star",
    position: [103.8, 1.35],
    heading: 45,
    speed: 12,
    status: "Underway",
  },
  {
    id: "V002",
    name: "Atlantic Glory",
    position: [-74.0, 40.7],
    heading: 270,
    speed: 8,
    status: "Anchored",
  },
  {
    id: "V003",
    name: "Indian Pioneer",
    position: [72.8, 18.9],
    heading: 135,
    speed: 15,
    status: "Underway",
  },
  {
    id: "V004",
    name: "Nordic Wave",
    position: [10.7, 59.9],
    heading: 180,
    speed: 0,
    status: "Docked",
  },
  {
    id: "V005",
    name: "Mediterranean Sun",
    position: [13.4, 37.5],
    heading: 90,
    speed: 10,
    status: "Underway",
  },
];
