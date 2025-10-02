"use client";
import { useAppContext } from "@/context/AppContext"
import { StudentDashboard } from "@/components/dashboards";

export default function Page() {
  const { state, dispatch } = useAppContext();
  console.log("Context State:", state); // Debug log
  const {
    currentUser,
    tutors,
    bookings,
    feedbacks,
    searchQuery,
    selectedLanguage,
    selectedGender,
  } = state || {};

  const setSearchQuery = (value) => dispatch({ type: "SET_SEARCH_FILTERS", payload: { searchQuery: value } });
  const setSelectedLanguage = (value) =>
    dispatch({ type: "SET_SEARCH_FILTERS", payload: { selectedLanguage: value } });
  const setSelectedGender = (value) => dispatch({ type: "SET_SEARCH_FILTERS", payload: { selectedGender: value } });
  const onBooking = () => {};
  const onSubmitFeedback = () => {};
  const onViewProfile = () => {};

  return (
    <StudentDashboard
      tutors={tutors || []}
      searchQuery={searchQuery || ""}
      setSearchQuery={setSearchQuery}
      selectedLanguage={selectedLanguage || "all"}
      setSelectedLanguage={setSelectedLanguage}
      selectedGender={selectedGender || "all"}
      setSelectedGender={setSelectedGender}
      bookings={bookings || []}
      onBooking={onBooking}
      onSubmitFeedback={onSubmitFeedback}
      currentUser={currentUser || {}}
      onViewProfile={onViewProfile}
      feedbacks={feedbacks || []}
    />
  );
}