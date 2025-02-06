const USERTYPE = ["eventManager", "attendee"];
const SUBSCRIPTION = ["threeMonth", "oneYear"];
const STATUS = ["available", "booked", "reserved"];
const EVENTTYPE = ["trial"];
const MODELNAMES = {
  user: "User",
  event: "Event",
  seat: "Seat",
  booking: "Booking",
  subscription: "Subscription",
};

module.exports = {
  USERTYPE,
  SUBSCRIPTION,
  STATUS,
  EVENTTYPE,
  MODELNAMES,
};
