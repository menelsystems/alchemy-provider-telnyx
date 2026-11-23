/**
 * Live tests against a real Telnyx account. They create only free objects
 * (a messaging profile, an outbound voice profile, a billing group) and
 * destroy them at the end. Skipped unless TELNYX_API_KEY is set.
 *
 *   TELNYX_API_KEY=... bun run test:live
 */
import { expect } from "@alchemy.run/test";
import * as Test from "@alchemy.run/test/Alchemy";
import * as Effect from "effect/Effect";
import * as Telnyx from "../../src/index.ts";
import * as Profiles from "../../vendor/distilled-telnyx/src/services/profiles.ts";

const { test } = Test.make({ providers: Telnyx.providers() });
const live = test.provider.skipIf(!process.env.TELNYX_API_KEY);

const stackOf = (smsName: string, destinations: string[]) =>
  Effect.gen(function* () {
    const sms = yield* Telnyx.Messaging.Profile("Sms", {
      name: smsName,
      whitelisted_destinations: destinations,
    });
    const ovp = yield* Telnyx.Voice.OutboundVoiceProfile("Ovp", { name: "alchemy-test-ovp" });
    const bg = yield* Telnyx.Account.BillingGroup("Billing", { name: "alchemy-test-billing" });
    return { smsId: sms.id, smsName: sms.name, ovpId: ovp.id, bgId: bg.id };
  });

live(
  "messaging profile, outbound voice profile and billing group lifecycle",
  (stack) =>
    Effect.gen(function* () {
      yield* stack.destroy();

      const v1 = yield* stack.deploy(stackOf("alchemy-test-sms", ["US"]));
      expect(v1.smsName).toBe("alchemy-test-sms");

      // Out-of-band check with the SDK itself.
      const got = yield* Profiles.getMessagingProfile({ id: v1.smsId as string });
      expect(got.data?.whitelisted_destinations).toEqual(["US"]);

      const v2 = yield* stack.deploy(stackOf("alchemy-test-sms-2", ["US", "CA"]));
      expect(v2.smsId).toBe(v1.smsId);
      expect(v2.smsName).toBe("alchemy-test-sms-2");

      yield* stack.destroy();
      const after = yield* Profiles.getMessagingProfile({ id: v1.smsId as string }).pipe(
        Effect.map(() => "found"),
        Effect.catchIf(Telnyx.isNotFound, () => Effect.succeed("gone")),
      );
      expect(after).toBe("gone");
    }).pipe(Effect.provide(Telnyx.Credentials.fromAuthProvider())),
  { timeout: 120_000 },
);
