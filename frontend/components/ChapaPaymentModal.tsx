"use client"

import { useAppContext } from "@/contexts/AppContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CreditCard, Upload, CheckCircle, Clock, DollarSign, FileImage, Shield, Info } from "lucide-react"
import { toast } from "sonner"

// Ethiopian flag colors
const ethiopianColors = {
  green: "#009639",
  yellow: "#FFDE00",
  red: "#DA020E",
}

export function ChapaPaymentModal({ booking, onClose, onPaymentComplete }) {
  const { state, dispatch } = useAppContext()
  const { paymentData, paymentStep, paymentMethod, uploadProgress, paymentErrors, isProcessing } = state

  const paymentMethods = [
    { value: "mobile_money", label: "Mobile Money (Telebirr, M-Birr)", icon: "📱" },
    { value: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
    { value: "chapa_card", label: "Chapa Card Payment", icon: "💳" },
  ]

  const validateStep1 = () => {
    const newErrors = {}
    if (!paymentData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!paymentData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!paymentData.email.trim()) newErrors.email = "Email is required"
    if (!paymentData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required"

    dispatch({ type: "SET_PAYMENT_ERRORS", payload: newErrors })
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}
    if (!paymentData.chapaTransactionId.trim()) {
      newErrors.chapaTransactionId = "Transaction ID is required"
    }
    if (!paymentData.paymentProof && !paymentData.paymentProofUrl) {
      newErrors.paymentProof = "Payment proof screenshot is required"
    }

    dispatch({ type: "SET_PAYMENT_ERRORS", payload: newErrors })
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field, value) => {
    dispatch({
      type: "UPDATE_PAYMENT_DATA",
      payload: { [field]: value },
    })

    if (paymentErrors[field]) {
      const newErrors = { ...paymentErrors }
      delete newErrors[field]
      dispatch({ type: "SET_PAYMENT_ERRORS", payload: newErrors })
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB")
        return
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file")
        return
      }

      dispatch({
        type: "UPDATE_PAYMENT_DATA",
        payload: { paymentProof: file },
      })

      // Simulate upload progress
      dispatch({ type: "SET_UPLOAD_PROGRESS", payload: 0 })
      const interval = setInterval(() => {
        dispatch({ type: "INCREMENT_UPLOAD_PROGRESS" })
        if (uploadProgress >= 100) {
          clearInterval(interval)
          const mockUrl = `/uploads/payment-proof-${Date.now()}.jpg`
          dispatch({
            type: "UPDATE_PAYMENT_DATA",
            payload: { paymentProofUrl: mockUrl },
          })
          toast.success("Payment proof uploaded successfully!")
        }
      }, 100)
    }
  }

  const nextStep = () => {
    if (paymentStep === 1 && validateStep1()) {
      dispatch({ type: "SET_PAYMENT_STEP", payload: 2 })
    } else if (paymentStep === 2 && validateStep2()) {
      dispatch({ type: "SET_PAYMENT_STEP", payload: 3 })
    }
  }

  const prevStep = () => {
    dispatch({ type: "SET_PAYMENT_STEP", payload: paymentStep - 1 })
  }

  const processPayment = async () => {
    dispatch({ type: "SET_PROCESSING", payload: true })

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const completedPayment = {
        ...paymentData,
        status: "pending_verification",
        paymentMethod,
        timestamp: new Date().toISOString(),
      }

      onPaymentComplete(completedPayment)
      toast.success("Payment submitted successfully! Awaiting verification.")
      onClose()
    } catch (error) {
      toast.error("Payment processing failed. Please try again.")
    } finally {
      dispatch({ type: "SET_PROCESSING", payload: false })
    }
  }

  const getStepTitle = () => {
    switch (paymentStep) {
      case 1:
        return "Payment Details"
      case 2:
        return "Complete Payment"
      case 3:
        return "Confirm & Submit"
      default:
        return "Payment"
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <div
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(45deg, ${ethiopianColors.green}, ${ethiopianColors.yellow}, ${ethiopianColors.red})`,
              }}
            >
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
            <span>{getStepTitle()}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-4 sm:mb-6 px-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                  i <= paymentStep ? "text-white" : "bg-muted text-muted-foreground"
                }`}
                style={{
                  backgroundColor: i <= paymentStep ? ethiopianColors.green : undefined,
                }}
              >
                {i < paymentStep ? <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" /> : i}
              </div>
              {i < 3 && (
                <div
                  className={`w-8 sm:w-12 h-0.5 sm:h-1 mx-1 sm:mx-2 rounded ${i < paymentStep ? "bg-green-500" : "bg-muted"}`}
                  style={{
                    backgroundColor: i < paymentStep ? ethiopianColors.green : undefined,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="mb-4 sm:mb-6 border-2" style={{ borderColor: `${ethiopianColors.green}30` }}>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">Lesson Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-muted-foreground">Tutor</p>
                <p className="font-medium truncate">{booking.tutorName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Language</p>
                <p className="font-medium">{booking.language}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Lesson Type</p>
                <p className="font-medium">{booking.lessonType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-bold text-base sm:text-lg" style={{ color: ethiopianColors.green }}>
                  ${booking.paymentAmount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ScrollArea className="flex-1 px-1">
          <div className="pr-3">
            {/* Step 1: Payment Details */}
            {paymentStep === 1 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      value={paymentData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Enter your first name"
                      className={`mt-1 h-10 sm:h-11 ${paymentErrors.firstName ? "border-red-500" : ""}`}
                    />
                    {paymentErrors.firstName && <p className="text-red-500 text-xs mt-1">{paymentErrors.firstName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      value={paymentData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Enter your last name"
                      className={`mt-1 h-10 sm:h-11 ${paymentErrors.lastName ? "border-red-500" : ""}`}
                    />
                    {paymentErrors.lastName && <p className="text-red-500 text-xs mt-1">{paymentErrors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={paymentData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your@email.com"
                    className={`mt-1 h-10 sm:h-11 ${paymentErrors.email ? "border-red-500" : ""}`}
                  />
                  {paymentErrors.email && <p className="text-red-500 text-xs mt-1">{paymentErrors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="phoneNumber" className="text-sm">
                    Phone Number *
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={paymentData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    placeholder="+251-9XX-XXXXXX"
                    className={`mt-1 h-10 sm:h-11 ${paymentErrors.phoneNumber ? "border-red-500" : ""}`}
                  />
                  {paymentErrors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1">{paymentErrors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm">Payment Method</Label>
                  <div className="grid grid-cols-1 gap-2 sm:gap-3 mt-2">
                    {paymentMethods.map((method) => (
                      <Card
                        key={method.value}
                        className={`cursor-pointer transition-all duration-200 ${
                          paymentMethod === method.value ? "border-2 shadow-md" : "border hover:shadow-sm"
                        }`}
                        style={{
                          borderColor: paymentMethod === method.value ? ethiopianColors.green : undefined,
                        }}
                        onClick={() => dispatch({ type: "SET_PAYMENT_METHOD", payload: method.value })}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg sm:text-2xl">{method.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base truncate">{method.label}</p>
                              {method.value === "mobile_money" && (
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  Most popular for Ethiopian users
                                </p>
                              )}
                            </div>
                            {paymentMethod === method.value && (
                              <CheckCircle
                                className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"
                                style={{ color: ethiopianColors.green }}
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-xs sm:text-sm">
                    Your payment information is secure and encrypted. We use Chapa's secure payment gateway.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 2: Complete Payment */}
            {paymentStep === 2 && (
              <div className="space-y-4 sm:space-y-6">
                <Alert className="border-2" style={{ borderColor: `${ethiopianColors.yellow}50` }}>
                  <Info className="h-4 w-4" style={{ color: ethiopianColors.red }} />
                  <AlertDescription className="text-xs sm:text-sm">
                    <strong>Payment Instructions:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>
                        Complete your payment using {paymentMethods.find((m) => m.value === paymentMethod)?.label}
                      </li>
                      <li>Copy the transaction ID from your payment confirmation</li>
                      <li>Take a screenshot of your payment confirmation</li>
                      <li>Upload the screenshot and enter the transaction ID below</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <Card className="p-3 sm:p-4 bg-muted/50">
                  <div className="text-center space-y-2">
                    <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 mx-auto" style={{ color: ethiopianColors.green }} />
                    <p className="text-xs sm:text-sm text-muted-foreground">Amount to Pay</p>
                    <p className="text-xl sm:text-2xl font-bold" style={{ color: ethiopianColors.green }}>
                      ${booking.paymentAmount} USD
                    </p>
                    <p className="text-xs text-muted-foreground">Approximately {booking.paymentAmount * 120} ETB</p>
                  </div>
                </Card>

                <div>
                  <Label htmlFor="transactionId" className="text-sm">
                    Chapa Transaction ID *
                  </Label>
                  <Input
                    id="transactionId"
                    value={paymentData.chapaTransactionId}
                    onChange={(e) => handleInputChange("chapaTransactionId", e.target.value)}
                    placeholder="TX123456789"
                    className={`mt-1 h-10 sm:h-11 ${paymentErrors.chapaTransactionId ? "border-red-500" : ""}`}
                  />
                  {paymentErrors.chapaTransactionId && (
                    <p className="text-red-500 text-xs mt-1">{paymentErrors.chapaTransactionId}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Find this in your payment confirmation message or receipt
                  </p>
                </div>

                <div>
                  <Label className="text-sm">Payment Proof Screenshot *</Label>
                  <div className="mt-2">
                    {!paymentData.paymentProofUrl ? (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-6 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="payment-proof"
                        />
                        <label htmlFor="payment-proof" className="cursor-pointer">
                          <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs sm:text-sm font-medium">Click to upload screenshot</p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                        </label>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-3 sm:p-4 bg-muted/50">
                        <div className="flex items-center space-x-3">
                          <FileImage
                            className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0"
                            style={{ color: ethiopianColors.green }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium">Payment proof uploaded</p>
                            <p className="text-xs text-muted-foreground truncate">{paymentData.paymentProof?.name}</p>
                          </div>
                          <CheckCircle
                            className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"
                            style={{ color: ethiopianColors.green }}
                          />
                        </div>
                      </div>
                    )}

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-2">
                        <Progress value={uploadProgress} className="h-1 sm:h-2" />
                        <p className="text-xs text-muted-foreground mt-1">Uploading... {uploadProgress}%</p>
                      </div>
                    )}

                    {paymentErrors.paymentProof && (
                      <p className="text-red-500 text-xs mt-1">{paymentErrors.paymentProof}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-sm">
                    Additional Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={paymentData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Any additional information about your payment..."
                    rows={3}
                    className="resize-none mt-1 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {paymentStep === 3 && (
              <div className="space-y-4 sm:space-y-6">
                <Alert className="border-2" style={{ borderColor: `${ethiopianColors.green}50` }}>
                  <CheckCircle className="h-4 w-4" style={{ color: ethiopianColors.green }} />
                  <AlertDescription className="text-xs sm:text-sm">
                    Please review your payment details before submitting for verification.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm sm:text-base">Payment Summary</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className="space-y-3">
                      <div>
                        <p className="text-muted-foreground">Student Name</p>
                        <p className="font-medium">
                          {paymentData.firstName} {paymentData.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium truncate">{paymentData.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{paymentData.phoneNumber}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-muted-foreground">Payment Method</p>
                        <p className="font-medium text-xs sm:text-sm">
                          {paymentMethods.find((m) => m.value === paymentMethod)?.label}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Transaction ID</p>
                        <p className="font-medium font-mono text-xs sm:text-sm break-all">
                          {paymentData.chapaTransactionId}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-bold text-base sm:text-lg" style={{ color: ethiopianColors.green }}>
                          ${booking.paymentAmount}
                        </p>
                      </div>
                    </div>
                  </div>

                  {paymentData.paymentProofUrl && (
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">Payment Proof</p>
                      <div className="mt-1 p-3 bg-muted/50 rounded-lg flex items-center space-x-2">
                        <FileImage className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: ethiopianColors.green }} />
                        <span className="text-xs sm:text-sm">Screenshot uploaded successfully</span>
                      </div>
                    </div>
                  )}

                  {paymentData.notes && (
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">Notes</p>
                      <p className="text-xs sm:text-sm mt-1 p-3 bg-muted/50 rounded-lg break-words">
                        {paymentData.notes}
                      </p>
                    </div>
                  )}
                </div>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription className="text-xs sm:text-sm">
                    Your payment will be verified within 24 hours. You'll receive a confirmation email once approved.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-4 sm:pt-6 border-t">
          <div className="flex flex-col sm:flex-row gap-2">
            {paymentStep > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={isProcessing}
                className="h-10 sm:h-11 bg-transparent"
              >
                Previous
              </Button>
            )}
            <Button variant="outline" onClick={onClose} disabled={isProcessing} className="h-10 sm:h-11 bg-transparent">
              Cancel
            </Button>
          </div>

          <div className="w-full sm:w-auto">
            {paymentStep < 3 ? (
              <Button
                onClick={nextStep}
                className="w-full sm:w-auto text-white h-10 sm:h-11"
                style={{ backgroundColor: ethiopianColors.green }}
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={processPayment}
                disabled={isProcessing}
                className="w-full sm:w-auto text-white h-10 sm:h-11"
                style={{ backgroundColor: ethiopianColors.green }}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  "Submit Payment"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ChapaPaymentModal
