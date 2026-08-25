// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PaymentEscrow {
    enum Status {
        Pending,
        Funded,
        Released,
        Refunded
    }

    struct Payment {
        address sender;
        address beneficiary;
        uint256 amount;
        Status status;
    }

    address public arbiter;
    mapping(bytes32 => Payment) public payments;
    mapping(address => uint256) public pendingWithdrawals;

    event PaymentCreated(bytes32 indexed paymentId, address indexed sender, address indexed beneficiary);
    event PaymentFunded(bytes32 indexed paymentId, uint256 amount);
    event PaymentReleased(bytes32 indexed paymentId, address indexed beneficiary, uint256 amount);
    event PaymentRefunded(bytes32 indexed paymentId, address indexed sender, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);

    modifier onlyArbiter() {
        require(msg.sender == arbiter, "Only the arbiter can call this function");
        _;
    }

    constructor(address _arbiter) {
        require(_arbiter != address(0), "Arbiter cannot be the zero address");
        arbiter = _arbiter;
    }

    /// @notice Opens a new escrow payment. Must be funded separately via fundPayment().
    function createPayment(bytes32 paymentId, address beneficiary) external {
        require(beneficiary != address(0), "Beneficiary cannot be the zero address");
        require(payments[paymentId].sender == address(0), "Payment ID already exists");

        payments[paymentId] = Payment({
            sender: msg.sender,
            beneficiary: beneficiary,
            amount: 0,
            status: Status.Pending
        });

        emit PaymentCreated(paymentId, msg.sender, beneficiary);
    }

    /// @notice Funds a previously created payment. Only the original sender may fund it.
    function fundPayment(bytes32 paymentId) external payable {
        Payment storage payment = payments[paymentId];

        require(payment.sender != address(0), "Payment does not exist");
        require(payment.status == Status.Pending, "Payment is not pending");
        require(msg.sender == payment.sender, "Only the sender can fund this payment");
        require(msg.value > 0, "Funding amount must be greater than zero");

        payment.amount = msg.value;
        payment.status = Status.Funded;

        emit PaymentFunded(paymentId, msg.value);
    }

    /// @notice Releases a funded payment to its beneficiary. Restricted to the arbiter,
    /// who confirms off-chain that the underlying transfer has settled.
    function releasePayment(bytes32 paymentId) external onlyArbiter {
        Payment storage payment = payments[paymentId];

        require(payment.status == Status.Funded, "Payment is not funded");

        payment.status = Status.Released;
        pendingWithdrawals[payment.beneficiary] += payment.amount;

        emit PaymentReleased(paymentId, payment.beneficiary, payment.amount);
    }

    /// @notice Refunds a funded payment back to its sender. Restricted to the arbiter,
    /// who confirms off-chain that the underlying transfer failed or was cancelled.
    function refundPayment(bytes32 paymentId) external onlyArbiter {
        Payment storage payment = payments[paymentId];

        require(payment.status == Status.Funded, "Payment is not funded");

        payment.status = Status.Refunded;
        pendingWithdrawals[payment.sender] += payment.amount;

        emit PaymentRefunded(paymentId, payment.sender, payment.amount);
    }

    /// @notice Pull-payment withdrawal. Released/refunded funds are credited to an account's
    /// balance rather than pushed directly, so a misbehaving beneficiary or sender can never
    /// block release/refund of other payments.
    function withdraw() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds available for withdrawal");

        pendingWithdrawals[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    function getPayment(bytes32 paymentId) external view returns (Payment memory) {
        return payments[paymentId];
    }

    function contractName() public pure returns (string memory) {
        return "The PaymentEscrow Contract is OnLine";
    }
}
