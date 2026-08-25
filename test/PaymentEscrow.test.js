import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("PaymentEscrow", () => {
  let escrow;
  let arbiter;
  let sender;
  let beneficiary;
  let other;

  const paymentId = ethers.id("payment-1");
  const amount = ethers.parseEther("1");

  beforeEach(async () => {
    [arbiter, sender, beneficiary, other] = await ethers.getSigners();
    escrow = await ethers.deployContract("PaymentEscrow", [arbiter.address]);
  });

  describe("createPayment", () => {
    it("creates a payment in Pending status", async () => {
      await expect(escrow.connect(sender).createPayment(paymentId, beneficiary.address))
        .to.emit(escrow, "PaymentCreated")
        .withArgs(paymentId, sender.address, beneficiary.address);

      const payment = await escrow.getPayment(paymentId);
      expect(payment.sender).to.equal(sender.address);
      expect(payment.beneficiary).to.equal(beneficiary.address);
      expect(payment.amount).to.equal(0);
      expect(payment.status).to.equal(0n); // Pending
    });

    it("rejects a zero-address beneficiary", async () => {
      await expect(
        escrow.connect(sender).createPayment(paymentId, ethers.ZeroAddress)
      ).to.be.revertedWith("Beneficiary cannot be the zero address");
    });

    it("rejects a duplicate payment ID", async () => {
      await escrow.connect(sender).createPayment(paymentId, beneficiary.address);

      await expect(
        escrow.connect(other).createPayment(paymentId, beneficiary.address)
      ).to.be.revertedWith("Payment ID already exists");
    });
  });

  describe("fundPayment", () => {
    beforeEach(async () => {
      await escrow.connect(sender).createPayment(paymentId, beneficiary.address);
    });

    it("funds a pending payment and moves it to Funded", async () => {
      await expect(escrow.connect(sender).fundPayment(paymentId, { value: amount }))
        .to.emit(escrow, "PaymentFunded")
        .withArgs(paymentId, amount);

      const payment = await escrow.getPayment(paymentId);
      expect(payment.amount).to.equal(amount);
      expect(payment.status).to.equal(1n); // Funded
    });

    it("rejects funding from anyone other than the sender", async () => {
      await expect(
        escrow.connect(other).fundPayment(paymentId, { value: amount })
      ).to.be.revertedWith("Only the sender can fund this payment");
    });

    it("rejects funding a nonexistent payment", async () => {
      await expect(
        escrow.connect(sender).fundPayment(ethers.id("does-not-exist"), { value: amount })
      ).to.be.revertedWith("Payment does not exist");
    });

    it("rejects a zero-value funding", async () => {
      await expect(
        escrow.connect(sender).fundPayment(paymentId, { value: 0 })
      ).to.be.revertedWith("Funding amount must be greater than zero");
    });

    it("rejects funding a payment twice", async () => {
      await escrow.connect(sender).fundPayment(paymentId, { value: amount });

      await expect(
        escrow.connect(sender).fundPayment(paymentId, { value: amount })
      ).to.be.revertedWith("Payment is not pending");
    });
  });

  describe("releasePayment", () => {
    beforeEach(async () => {
      await escrow.connect(sender).createPayment(paymentId, beneficiary.address);
      await escrow.connect(sender).fundPayment(paymentId, { value: amount });
    });

    it("rejects release from anyone other than the arbiter", async () => {
      await expect(
        escrow.connect(sender).releasePayment(paymentId)
      ).to.be.revertedWith("Only the arbiter can call this function");
    });

    it("credits the beneficiary's withdrawable balance and marks Released", async () => {
      await expect(escrow.connect(arbiter).releasePayment(paymentId))
        .to.emit(escrow, "PaymentReleased")
        .withArgs(paymentId, beneficiary.address, amount);

      const payment = await escrow.getPayment(paymentId);
      expect(payment.status).to.equal(2n); // Released
      expect(await escrow.pendingWithdrawals(beneficiary.address)).to.equal(amount);
    });

    it("rejects releasing a payment that isn't funded", async () => {
      await escrow.connect(arbiter).releasePayment(paymentId);

      await expect(
        escrow.connect(arbiter).releasePayment(paymentId)
      ).to.be.revertedWith("Payment is not funded");
    });
  });

  describe("refundPayment", () => {
    beforeEach(async () => {
      await escrow.connect(sender).createPayment(paymentId, beneficiary.address);
      await escrow.connect(sender).fundPayment(paymentId, { value: amount });
    });

    it("rejects refund from anyone other than the arbiter", async () => {
      await expect(
        escrow.connect(sender).refundPayment(paymentId)
      ).to.be.revertedWith("Only the arbiter can call this function");
    });

    it("credits the sender's withdrawable balance and marks Refunded", async () => {
      await expect(escrow.connect(arbiter).refundPayment(paymentId))
        .to.emit(escrow, "PaymentRefunded")
        .withArgs(paymentId, sender.address, amount);

      const payment = await escrow.getPayment(paymentId);
      expect(payment.status).to.equal(3n); // Refunded
      expect(await escrow.pendingWithdrawals(sender.address)).to.equal(amount);
    });
  });

  describe("withdraw", () => {
    it("pays out a released beneficiary's credited balance", async () => {
      await escrow.connect(sender).createPayment(paymentId, beneficiary.address);
      await escrow.connect(sender).fundPayment(paymentId, { value: amount });
      await escrow.connect(arbiter).releasePayment(paymentId);

      const tx = await escrow.connect(beneficiary).withdraw();
      await expect(tx).to.changeEtherBalance(ethers, beneficiary, amount);
      expect(await escrow.pendingWithdrawals(beneficiary.address)).to.equal(0);
    });

    it("pays out a refunded sender's credited balance", async () => {
      await escrow.connect(sender).createPayment(paymentId, beneficiary.address);
      await escrow.connect(sender).fundPayment(paymentId, { value: amount });
      await escrow.connect(arbiter).refundPayment(paymentId);

      const tx = await escrow.connect(sender).withdraw();
      await expect(tx).to.changeEtherBalance(ethers, sender, amount);
      expect(await escrow.pendingWithdrawals(sender.address)).to.equal(0);
    });

    it("rejects withdrawal when there is nothing to withdraw", async () => {
      await expect(escrow.connect(other).withdraw()).to.be.revertedWith(
        "No funds available for withdrawal"
      );
    });
  });
});
