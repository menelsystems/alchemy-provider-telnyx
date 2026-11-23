import * as Contributions from "alchemy/Contributions";

export default Contributions.make({
  name: "telnyx",
  auth: Contributions.lazy(
    () => import("./AuthProvider.js"),
    (module) => module.TelnyxAuth,
  ),
});
