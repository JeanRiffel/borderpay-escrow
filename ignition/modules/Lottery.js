import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LotteryModule", (m) => {
  const lottery = m.contract("Lottery");

  return { lottery };
});
