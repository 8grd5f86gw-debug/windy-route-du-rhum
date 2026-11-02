export type Boat = {
 id: string; boatName: string; skipper: string; flag: string; className: string;
 lat: number; lon: number; speedKn?: number; headingDeg?: number; updatedAt: string;
 history: { lat: number; lon: number; time: string }[];
};
