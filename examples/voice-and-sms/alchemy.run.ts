/**
 * A voice + SMS setup: an outbound voice profile, a TeXML application that
 * dials out through it, and a messaging profile restricted to US/CA.
 *
 *   TELNYX_API_KEY=... bunx alchemy deploy examples/voice-and-sms/alchemy.run.ts
 */
import * as Alchemy from "alchemy";
import * as Effect from "effect/Effect";
import * as Telnyx from "../../src/index.ts";

export default Alchemy.Stack(
  "TelnyxVoiceAndSms",
  {
    providers: Telnyx.providers(),
    state: Alchemy.localState(),
  },
  Effect.gen(function* () {
    const outbound = yield* Telnyx.Voice.OutboundVoiceProfile("Outbound", {
      name: "app-outbound",
      whitelisted_destinations: ["US", "CA"],
    });

    const app = yield* Telnyx.Voice.TeXMLApplication("Ivr", {
      friendly_name: "app-ivr",
      voice_url: "https://example.com/texml/inbound",
      outbound: { outbound_voice_profile_id: outbound.id },
    });

    const sms = yield* Telnyx.Messaging.Profile("Sms", {
      name: "app-sms",
      whitelisted_destinations: ["US", "CA"],
      webhook_url: "https://example.com/webhooks/sms",
    });

    return {
      texmlApplicationId: app.id,
      outboundVoiceProfileId: outbound.id,
      messagingProfileId: sms.id,
    };
  }),
);
