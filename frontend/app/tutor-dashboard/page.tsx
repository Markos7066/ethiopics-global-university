"use client";
import { TutorDashboard } from "@/components/dashboards"; // Adjust path if needed

export default function Page() {
  // Placeholder props; replace with actual data
  const bookings = [];
  const onConfirmBooking = () => {};
  const feedbacks = [];
  const currentUser = {}; // Fetch from context
  const onViewProfile = () => {};
  const tutors = [];
  const setTutors = () => {};

  return (
    <TutorDashboard
      bookings={bookings}
      onConfirmBooking={onConfirmBooking}
      feedbacks={feedbacks}
      currentUser={currentUser}
      onViewProfile={onViewProfile}
      tutors={tutors}
      setTutors={setTutors}
    />
  );
}