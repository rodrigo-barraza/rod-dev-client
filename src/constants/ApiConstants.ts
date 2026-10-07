const ApiConstants = {
  ROD_DEV_SERVICE_URL: process.env.NEXT_PUBLIC_ROD_DEV_SERVICE_URL,
  // The browser never calls prism-service itself: this site's server
  // relays to it with the service secret (src/app/api/prism).
  PRISM_API: "/api/prism",
  SESSIONS_API: "/api/sessions",
  RENDER_SERVICE: "render-service",
  FAVORITE_SERVICE: "favorite-service",
  LIKE_SERVICE: "like-service",
  GUEST_SERVICE: "guest-service",
  GYM_SERVICE: "gym-service",
};

export default ApiConstants;
