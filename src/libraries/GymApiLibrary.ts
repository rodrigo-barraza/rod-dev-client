import FetchWrapper from "@/wrappers/FetchWrapper";
import ApiConstants from "@/constants/ApiConstants";

const SERVICE_URL = ApiConstants.GYM_SERVICE;

const GymApiLibrary = {
  async getJournal() {
    return FetchWrapper.get(SERVICE_URL, "journal");
  },

  async postJournal(
    exercise: string,
    reps: string,
    weight: string,
    unit: string,
    style: string,
    stance: string,
    equipment: string,
    position: string,
  ) {
    const body: Record<string, string> = {};
    if (exercise) body.exercise = exercise;
    if (reps) body.reps = reps;
    if (weight) body.weight = weight;
    if (unit) body.unit = unit;
    if (style) body.style = style;
    if (stance) body.stance = stance;
    if (equipment) body.equipment = equipment;
    if (position) body.position = position;
    return FetchWrapper.post(SERVICE_URL, "journal", body);
  },
};

export default GymApiLibrary;
