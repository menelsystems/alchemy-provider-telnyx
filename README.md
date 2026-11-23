# alchemy-provider-telnyx

> [!WARNING]
> **Experimental, community-maintained.** Not an official Telnyx or Alchemy product. The
> resources are tested against a fake of the Telnyx API, not yet against a live account;
> expect API mismatches, and pin a version.

Telnyx for [Alchemy](https://alchemy.run) v2. It is built the way first-party Alchemy
providers are built: on a [distilled](https://github.com/alchemy-run/distilled) Effect SDK,
with resources that reconcile through typed SDK calls.

- **165 resources**, the same set [terraform-provider-telnyx](https://github.com/RomansWorks/terraform-provider-telnyx)
  manages, each with `.lookup()`.
- **Every Telnyx API operation (~1,550)** as a typed Effect function. Lists, reads and one-shot
  calls are just SDK operations: `alchemy-provider-telnyx/api/<module>`. That is a superset of the
  Terraform provider's data sources, lists, actions and ephemeral reads.
- **Deploy-time API calls** (Terraform's "actions") through Alchemy's own `Action` primitive:
  `Telnyx.Call(id, operation, input)`.

Requires `alchemy@>=2.0.0-beta.87` and `effect@^4.1.4`.

## Setup

```ts
import * as Alchemy from "alchemy";
import * as Effect from "effect/Effect";
import * as Telnyx from "alchemy-provider-telnyx";

export default Alchemy.Stack(
  "MyApp",
  { providers: Telnyx.providers(), state: Alchemy.localState() },
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

    return { texmlApplicationId: app.id, messagingProfileId: sms.id };
  }),
);
```

Combine with other providers: `providers: Layer.mergeAll(Cloudflare.providers(), Telnyx.providers())`.

### Credentials

Alchemy's standard auth flow, in this order:

1. `TELNYX_API_KEY` (and optionally `TELNYX_API_BASE_URL`) in the environment or `.env`
2. The selected Alchemy profile: run `alchemy profile edit` and pick **Telnyx**

To pass them explicitly: `Telnyx.providers({ credentials: Telnyx.Credentials.fromApiKey({ apiKey: Redacted.make(key) }) })`.

## Usage

### Resources

Props and attributes are the Telnyx API's own field names and types, straight from the SDK.
Props are each resource's create (and update) request; attributes are the object as the API
returns it. Every prop accepts an Output from another resource. Secrets are `Redacted`.

Reconcile reads the live object, creates it if missing, then sends only the fields that differ
from it. Props removed since the last deploy are cleared with `null`. Changing a create-only
prop (listed in each resource's docs) replaces the object.

```ts
const existing = Telnyx.Messaging.Profile.lookup({ id: "400174e4-..." });
```

### Any API operation

```ts
import * as Search from "alchemy-provider-telnyx/api/phone_number_search";
import * as Profiles from "alchemy-provider-telnyx/api/profiles";
import * as Telnyx from "alchemy-provider-telnyx";

// One call, typed request and response.
const available = yield* Search.listAvailablePhoneNumbers({ filter_country_code_: "US" });

// Every page of a list operation.
const profiles = yield* Telnyx.Paging.all(Profiles.listMessagingProfiles, {});
```

Operations need `Credentials` and an `HttpClient`. `Telnyx.providers()` makes both available
to stack code, and in a script you provide `Telnyx.Credentials.CredentialsFromEnv` and
`FetchHttpClient.layer`. Failures are typed (`NotFound`, `UnprocessableEntity`, …), and
messages carry Telnyx's error codes.

### Deploy-time calls

One-shot operations such as revetting a 10DLC brand, starting an IP warm-up, or submitting a
porting order run as an Alchemy `Action`. It runs during deploy whenever its resolved input
changes, and its input can reference other resources:

```ts
import * as Brands from "alchemy-provider-telnyx/api/brands";

const brand = yield* Telnyx.TenDLC.Brand("Brand", { /* ... */ });
yield* Telnyx.Call("RevetBrand", Brands.revetBrand, { brandId: brand.brandId });
```

### Destroy behaviour

- Objects the API can't delete (avatars, number orders, shared campaigns, …) are removed from
  state with a warning.
- Phone numbers, SIM cards, hosted numbers and calendar connections stay in your account unless
  `release_on_destroy: true`.
- Email domains, IP pools, dedicated IPs and unsubscribe groups take `force_destroy: true`.
- Account singletons (`Account.AutoRechargePreferences`, `Account.UserProfile`, …) are updated in
  place.

## Coverage

| Service | Resources |
|---|---|
| `Account` | AccessIPAddress, AccessIPRange, AuthenticationProvider, AutoRechargePreferences, BillingGroup, CalendarConnection, IntegrationSecret, ManagedAccount, NotificationChannel, NotificationProfile, NotificationSetting, OAuthClient, SpendLimit, TrafficPolicyProfile, UserProfile |
| `AgentGateway` | AgentGateway, API, Guardrail, Key, KeyToolPermissions, MCPServer, Policy, PolicyAttachment, Team, TeamToolPermissions |
| `AI` | Assistant, AssistantCanaryDeploy, AssistantTag, AssistantTest, Avatar, Collection, CollectionSource, ConversationInsight, ConversationInsightGroup, ConversationInsightGroupAssignment, GatewayTokenGroup, GatewayTokenKey, MCPServer, MemoryNamespace, MemoryNamespaceSettings, Mission, PronunciationDictionary, TestAgent, TestMetric, TestScenario, TestSchedule, Tool, VoiceClone, VoiceDesign |
| `Compliance` | Address, DisplayIdentityRecord, DisplayIdentityRecordPhoneNumber, Document, DynamicEmergencyAddress, DynamicEmergencyEndpoint, Enterprise, EnterpriseReputation, EnterpriseReputationNumber, RequirementGroup, UserAddress |
| `Compute` | FunctionLogExport |
| `Email` | DedicatedIP, Domain, DomainWebhook, Inbox, InboxSenderFilters, IPPool, IPPoolIP, Suppression, Template, UnsubscribeGroup, UnsubscribeGroupSuppression |
| `Messaging` | AlphanumericSenderID, HostedNumber, HostedNumberOrder, MobilePushCredential, Profile, ProfileAutoResponse, RCSAgent, RCSAgentTestDevice, RCSBrand, ShortCodeSettings, TollfreeVerificationRequest, VerifiedNumber |
| `Networking` | GlobalIP, GlobalIPAssignment, GlobalIPHealthCheck, Network, NetworkDefaultGateway, NetworkRoute, PublicInternetGateway, TailscaleSubnetRouter, Tunnel, VirtualCrossConnect, WireGuardInterface, WireGuardPeer |
| `Numbers` | AdvancedNumberOrder, InexplicitNumberOrder, MobilePhoneNumber, NumberBlockOrder, NumberOrder, NumberReservation, PhoneNumber, PhoneNumberMessagingSettings, PhoneNumberVoicemail, PhoneNumberVoiceSettings |
| `Porting` | LOAConfiguration, Order, OrderAdditionalDocument, OrderAssociatedPhoneNumber, OrderPhoneNumberBlock, OrderPhoneNumberExtension |
| `Storage` | BucketSSLCertificate, CloudFSFilesystem, KVKey, KVNamespace, Migration, MigrationSource, SQLDatabase |
| `TenDLC` | Brand, Campaign, PhoneNumberCampaign, SharedCampaign |
| `Verify` | Profile, ProfileMessageTemplate |
| `Video` | Room |
| `Voice` | CallControlApplication, CredentialConnection, CustomStorageCredential, DialogflowConnection, ExternalConnection, FaxApplication, FQDN, FQDNConnection, FQDNConnectionAuthentication, InboundVoiceChannelSettings, IP, IPConnection, Media, MobileVoiceConnection, OutboundVoiceProfile, PayConnector, Queue, SiprecConnector, TelephonyCredential, TeXMLApplication, TeXMLQueue, TeXMLSecret, UACConnection, VoiceChannelZone |
| `WhatsApp` | BusinessAccountSettings, MessageTemplate, PhoneNumber, PhoneNumberCallingRouting, PhoneNumberCallingSettings, PhoneNumberConversationalComponents, PhoneNumberProfile, UserData |
| `Wireless` | Blocklist, PrivateWirelessGateway, SIMCard, SIMCardDataUsageNotification, SIMCardGroup, SIMCardOrder |

## How it's built

| Layer | Where | Reuses |
|---|---|---|
| Telnyx SDK | `vendor/distilled-telnyx/` | distilled's OpenAPI → Smithy → SDK pipeline and `@distilled.cloud/core` (transport, retries, typed errors, `Redacted` secrets, multipart) |
| Auth | `src/AuthProvider.ts`, `src/Credentials.ts` | Alchemy's `makeStoredAuthProvider` and `lazyCredentials` |
| Reconcile | `src/Crud.ts` | `alchemy/Diff` `isResolved`, `alchemy/Util` `subsetDiffers` and `stableStringify` |
| Waits, uploads | `src/Hooks.ts` | `alchemy/Util` `poll` and `sha256`, Effect `FileSystem` |
| Paging | `src/Paging.ts` | Effect `Stream.paginate` |
| Deploy-time calls | `src/Call.ts` | Alchemy `Action` |
| Resources | `src/<Service>/<Resource>.ts` | SDK request/response types as Props/Attributes |

Telnyx isn't in distilled upstream, so we run distilled's generator ourselves and vendor the
result; see [`vendor/distilled-telnyx/README.md`](vendor/distilled-telnyx/README.md). Regenerate
with `bun run sdk:regenerate`. Two SDK-level fixes live there as distilled-style config rather
than resource code: a Smithy patch for the KV value's raw request body, and expanding OpenAPI
`deepObject` query parameters into the bracketed `page[number]` / `filter[...]` form Telnyx
expects.

Each resource file is plain source: its Props/Attributes types (from the SDK), the typed SDK
calls for get/create/update/delete/list, and any special behaviour (uploads, waits, reshaped
responses, If-Match headers, settings routed to their own endpoints) inline.

## Development

```sh
bun install
bun run check            # typecheck, format check, unit + stack tests
bun run test:live        # needs TELNYX_API_KEY; creates and deletes free objects
bun run sdk:regenerate   # regenerate the vendored SDK (needs git, Node 24+, pnpm)
```

`test/unit` runs resources against an in-memory fake of the Telnyx API, through the real SDK.
`test/stack` deploys, updates and destroys a stack through Alchemy's real engine.

## License

Apache-2.0. See [NOTICE](NOTICE).
