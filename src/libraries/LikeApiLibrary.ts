import FetchWrapper from "@/wrappers/FetchWrapper";
import ApiConstants from "@/constants/ApiConstants";

const SERVICE_URL = ApiConstants.LIKE_SERVICE;

const LikeApiLibrary = {
  async postLike(renderId?: string) {
    const body: Record<string, string> = {};
    if (renderId) body.renderId = renderId;
    body.like = "true";
    return FetchWrapper.post(SERVICE_URL, "like", body);
  },

  async deleteLike(renderId?: string) {
    const body: Record<string, string> = {};
    if (renderId) body.renderId = renderId;
    body.like = "false";
    return FetchWrapper.post(SERVICE_URL, "like", body);
  },
};

export default LikeApiLibrary;
