const BASIC_USER = "jhta";
const BASIC_PASS = "jhta2026";

async function handleRequest(context) {
  const authorization = context.request.headers.get("Authorization");

  if (authorization) {
    const [scheme, encoded] = authorization.split(" ");
    if (scheme === "Basic") {
      const decoded = atob(encoded);
      const [user, pass] = decoded.split(":");
      if (user === BASIC_USER && pass === BASIC_PASS) {
        return await context.next();
      }
    }
  }

  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="JHTA Tech Portal"',
    },
  });
}

export const onRequest = [handleRequest];
