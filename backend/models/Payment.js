const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "ETB", // Chapa primarily uses ETB
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "mobile_money", "bank_transfer", "cash"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded", "cancelled"],
      default: "pending",
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymentGateway: {
      type: String,
      enum: ["chapa", "stripe", "paypal", "square", "manual"],
      default: "chapa",
    },
    gatewayTransactionId: String,
    chapaTransactionId: String, // Specific to Chapa
    paymentLink: String, // URL for Chapa hosted payment page
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String,
    // Payment breakdown
    subtotal: Number,
    tax: Number,
    fees: Number,
    discount: Number,
    // Receipt information
    receiptUrl: String,
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate invoice number before saving
paymentSchema.pre("save", function (next) {
  if (this.isNew && !this.invoiceNumber) {
    this.invoiceNumber = `INV-${Date.now()}-${Math.round(Math.random() * 1000000)}`;
  }
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);