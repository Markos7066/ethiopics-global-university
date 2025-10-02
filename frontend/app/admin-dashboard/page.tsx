"use client";
import { AdminDashboard } from "@/components/dashboards"; // Adjust path if needed

export default function Page() {
  // Placeholder props; replace with actual data
  const tutors = [];
  const students = [];
  const bookings = [];
  const paymentVerifications = [];
  const feedbacks = [];
  const pendingTutors = [];
  const onVerifyTutor = () => {};
  const onApproveTutor = () => {};
  const onVerifyPayment = () => {};
  const onViewProfile = () => {};
  const onApproveTutorCV = () => {};
  const onRejectTutorCV = () => {};

  return (
    <AdminDashboard
      tutors={tutors}
      students={students}
      bookings={bookings}
      paymentVerifications={paymentVerifications}
      feedbacks={feedbacks}
      pendingTutors={pendingTutors}
      onVerifyTutor={onVerifyTutor}
      onApproveTutor={onApproveTutor}
      onVerifyPayment={onVerifyPayment}
      onViewProfile={onViewProfile}
      onApproveTutorCV={onApproveTutorCV}
      onRejectTutorCV={onRejectTutorCV}
    />
  );
}