const { Event } = require("../../models/event");

const findOne = async (value) => {
  const event = await Event.findOne(value);
  return event;
};

module.exports = {
  findOne,
};
