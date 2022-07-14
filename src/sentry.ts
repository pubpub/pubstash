import Sentry from "@sentry/node";
import Application from "koa";

export function installSentry(app: Application, environment = "prod") {
  const dsn = process.env.SENTRY_DSN;
  if (dsn === undefined) {
    console.warn(
      "Failed to enable monitoring: missing environment variable SENTRY_DSN"
    );
    return;
  }
  Sentry.init({ dsn, environment });
  app.on("error", (err, ctx) => {
    Sentry.withScope((scope) => {
      scope.addEventProcessor((event) =>
        Sentry.addRequestDataToEvent(event, ctx.request)
      );
      Sentry.captureException(err);
    });
  });
}
