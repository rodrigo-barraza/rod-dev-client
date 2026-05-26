import FetchWrapper from "@/wrappers/FetchWrapper";
import ApiConstants from "@/constants/ApiConstants";

const SERVICE_URL = ApiConstants.GUEST_SERVICE;

const GuestApiLibrary = {
  async getGuest(ip?: string) {
    const headers: Record<string, string> = {};
    if (ip) headers.ip = ip;
    return FetchWrapper.get(SERVICE_URL, "guest", undefined, headers);
  },
};

export default GuestApiLibrary;
