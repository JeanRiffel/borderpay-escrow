import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PaymentEscrowModule", (m) => {
  // Defaults to the deploying account acting as arbiter; override with
  // `--parameters` (e.g. { "PaymentEscrowModule": { "arbiter": "0x..." } })
  // to point at a dedicated arbiter address (e.g. the backend's operator wallet).
  const arbiter = m.getParameter("arbiter", m.getAccount(0));
  const paymentEscrow = m.contract("PaymentEscrow", [arbiter]);

  return { paymentEscrow };
});
