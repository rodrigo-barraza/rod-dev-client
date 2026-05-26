import FetchWrapper from "@/wrappers/FetchWrapper";
import ApiConstants from "@/constants/ApiConstants";

const SERVICE_URL = ApiConstants.FAVORITE_SERVICE;

const FavoriteApiLibrary = {
  async postFavorite(renderId?: string) {
    const body: Record<string, string> = {};
    if (renderId) body.renderId = renderId;
    return FetchWrapper.post(SERVICE_URL, "favorite", body);
  },

  async deleteFavorite(renderId?: string) {
    const body: Record<string, string> = {};
    if (renderId) body.renderId = renderId;
    return FetchWrapper.del(SERVICE_URL, "favorite", body);
  },
};

export default FavoriteApiLibrary;
