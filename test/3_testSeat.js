const chai = require("chai");
const expect = chai.expect;
const request = require("request");
const { closeServer } = require("./0_testUser");
const { Seat } = require("../src/models/seat");
const { Event } = require("../src/models/event");
const { messages } = require("../src/modules/seatModule/messages");
const { User } = require("../src/models/user");

describe("Seat API Tests", function () {
  let eventId;
  let tokenWithOneYearSubscription;
  let attendeeId;
  let tokenAttendee;
  let tokenAttendeeWithoutSavedEvents;
  let seatOneId;
  let seatTwoId;
  let seatThreeId;
  let seatFourId;
  let seatFiveId;
  let userToDelete;

  before(function (done) {
    request.post(
      "http://localhost:3000/v1/users/userLogin",
      {
        json: {
          email: "dhoni@gmail.com",
          password: "password123",
        },
      },
      (error, response, body) => {
        if (error) {
          done(error);
        }

        tokenWithOneYearSubscription = body.meta.token;
      }
    );

    request.post(
      "http://localhost:3000/v1/users/userLogin",
      {
        json: {
          email: "test4@example.com",
          password: "password123",
        },
      },
      (error, response, body) => {
        if (error) {
          done(error);
        }

        attendeeId = body.data._id;
        tokenAttendee = body.meta.token;
      }
    );

    request.post(
      "http://localhost:3000/v1/users/userLogin",
      {
        json: {
          email: "rahul@example.com",
          password: "password123",
        },
      },
      (error, response, body) => {
        if (error) {
          done(error);
        }

        tokenAttendeeWithoutSavedEvents = body.meta.token;
      }
    );

    request.post(
      "http://localhost:3000/v1/users/userLogin",
      {
        json: {
          email: "test33@example.com",
          password: "password123",
        },
      },
      (error, response, body) => {
        if (error) {
          done(error);
        }

        userToDelete = body.meta.token;

        done();
      }
    );
  });

  after(function (done) {
    closeServer();
    done();
  });

  describe("Add Seats API Tests", function () {
    before(function (done) {
      Seat.deleteMany({})
        .then(() => done())
        .catch(done);
    });

    const makeAddSeatsRequest = (
      loginToken,
      eventId,
      validSeatData,
      callback
    ) => {
      request.post(
        `http://localhost:3000/v1/seats/addSeats?eventId=${eventId}`,
        {
          json: validSeatData,
          headers: { Authorization: `Bearer ${loginToken}` },
        },
        (error, response, body) => {
          if (error) {
            callback(error);
            return;
          }
          callback(null, { response, body });
        }
      );
    };

    let validSeatsData = {
      noOfRows: 3,
      noOfSeatsInEachRow: 5,
      amount: {
        1: 500,
        2: 400,
        3: 300,
      },
    };

    let invalidSeatsData = {
      noOfRows: 1,
      noOfSeatsInEachRow: 5,
      amount: {
        1: 500,
        2: 400,
        3: 300,
      },
    };

    describe("Middleware Tests", function () {
      it("should return error if anyone tries to add event without logging in", function (done) {
        makeAddSeatsRequest(
          undefined,
          eventId,
          invalidSeatsData,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;
              expect(response.statusCode).to.equal(400);
              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });

      it("should return error if the token is there but the user was not founded", async function () {
        await User.findOneAndDelete({
          email: "test33@example.com",
        });

        const result = await new Promise((resolve, reject) => {
          makeAddSeatsRequest(
            userToDelete,
            eventId,
            validSeatsData,
            (error, result) => {
              if (error) {
                reject(error);
                return;
              }
              resolve(result);
            }
          );
        });

        const { response, body } = result;
        expect(response.statusCode).to.equal(400);
      });

      it("should return error if the user with a particular type is not allowed to access a certain resource", function (done) {
        makeAddSeatsRequest(
          tokenAttendee,
          eventId,
          invalidSeatsData,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;
              expect(response.statusCode).to.equal(400);
              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });
    });

    describe("Add Event Seats Successfully", function () {
      it("should successfully add event seats", async function () {
        let event = await Event.findOne({
          title: "dhonievent22",
        });

        eventId = event._id;

        const result = await new Promise((resolve, reject) => {
          makeAddSeatsRequest(
            tokenWithOneYearSubscription,
            eventId,
            validSeatsData,
            (error, result) => {
              if (error) {
                reject(error);
                return;
              }
              resolve(result);
            }
          );
        });

        const { response, body } = result;

        seatOneId = body.data[0]._id;
        seatTwoId = body.data[1]._id;
        seatThreeId = body.data[2]._id;
        seatFourId = body.data[3]._id;
        seatFiveId = body.data[4]._id;

        expect(response.statusCode).to.equal(200);
        expect(body.meta.message).to.equal(messages.seatsAddedSuccessfully);
        expect(body.meta.code).to.equal(200);
      });
    });

    describe("Edge Cases", function () {
      it("should return validation error if user does not provide valid data for seats", function (done) {
        makeAddSeatsRequest(
          tokenWithOneYearSubscription,
          eventId,
          invalidSeatsData,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;

              expect(response.statusCode).to.equal(400);
              expect(body.meta.code).to.equal(400);
              expect(body.meta.message).to.equal(
                'Error while validating provided values: ValidationError: "amount" must have 1 key'
              );
              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });

      it("should return error if event does not exist", function (done) {
        makeAddSeatsRequest(
          tokenWithOneYearSubscription,
          "67af3b6971ca65492d69fd11",
          validSeatsData,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;

              expect(response.statusCode).to.equal(400);
              expect(body.meta.code).to.equal(400);
              expect(body.meta.message).to.equal(messages.userDoesNotHaveEvent);
              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });
    });
  });

  describe("Select Seats API Tests", function () {
    const makeSelectSeatsRequest = (loginToken, eventId, seatIds, callback) => {
      request.put(
        `http://localhost:3000/v1/seats/selectSeats?eventId=${eventId}`,
        {
          json: seatIds,
          headers: { Authorization: `Bearer ${loginToken}` },
        },
        (error, response, body) => {
          if (error) {
            callback(error);
            return;
          }
          callback(null, { response, body });
        }
      );
    };

    let invalidSeatIds = ["67b2d62a5c2e46492a8d71ff"];

    describe("Select Seats Successfully", function () {
      it("should select the seats choosed by the user successfully", function (done) {
        makeSelectSeatsRequest(
          tokenAttendee,
          eventId,
          {
            seatIds: [seatOneId, seatTwoId, seatThreeId],
          },
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;

              expect(response.statusCode).to.equal(200);
              expect(body.meta.code).to.equal(200);
              expect(body.meta.message).to.equal(
                messages.seatsReservedSuccessfully
              );
              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });
    });

    describe("Edge Cases", function () {
      it("should return error if invalid data is provided by the user", function (done) {
        makeSelectSeatsRequest(
          tokenAttendee,
          eventId,
          invalidSeatIds,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;

              expect(response.statusCode).to.equal(400);
              expect(body.meta.message).to.equal(
                'Error while validating provided values: ValidationError: "value" must be of type object'
              );
              expect(body.meta.code).to.equal(400);
              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });

      it("should return error if someone tries to select already reserved seats", (done) => {
        makeSelectSeatsRequest(
          tokenAttendee,
          eventId,
          {
            seatIds: [seatOneId, seatTwoId, seatThreeId],
          },
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;

              expect(response.statusCode).to.equal(409);
              expect(body.meta.code).to.equal(409);
              expect(body.meta.message).to.equal(messages.seatsNotAvailable);
              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });

      it("should handle race condition when two users try to book the same seat", async function () {
        this.timeout(10000);

        try {
          // Create two separate requests that will be executed nearly simultaneously
          const request1 = new Promise((resolve, reject) => {
            request.put(
              `http://localhost:3000/v1/seats/selectSeats?eventId=${eventId}`,
              {
                json: {
                  seatIds: [seatFourId, seatFiveId],
                },
                headers: { Authorization: `Bearer ${tokenAttendee}` },
                timeout: 5000, // Add timeout to the request itself
              },
              (error, response, body) => {
                if (error) reject(error);
                else resolve({ response, body });
              }
            );
          });

          const request2 = new Promise((resolve, reject) => {
            request.put(
              `http://localhost:3000/v1/seats/selectSeats?eventId=${eventId}`,
              {
                json: {
                  seatIds: [seatFourId, seatFiveId],
                },
                headers: {
                  Authorization: `Bearer ${tokenAttendeeWithoutSavedEvents}`,
                },
                timeout: 5000, // Add timeout to the request itself
              },
              (error, response, body) => {
                if (error) reject(error);
                else resolve({ response, body });
              }
            );
          });

          // Execute both requests concurrently
          const [result1, result2] = await Promise.all([request1, request2]);

          // Now you can make assertions about the results
          const successCount = [result1, result2].filter(
            (r) => r.response.statusCode === 200
          ).length;
          const conflictCount = [result1, result2].filter(
            (r) => r.response.statusCode === 409
          ).length;

          // Exactly one request should succeed and one should fail with conflict
          expect(result1.body.meta.code).to.equal(200);
          expect(result1.body.meta.message).to.equal(
            messages.seatsReservedSuccessfully
          );
          expect(result2.body.meta.code).to.equal(409);
          expect(result2.body.meta.message).to.equal(
            messages.seatsAlreadyReserved
          );
          expect(successCount).to.equal(1);
          expect(conflictCount).to.equal(1);
        } catch (error) {
          console.error("Test failed with error:", error);
          throw error;
        }
      });
    });
  });

  describe("Book Seats API Tests", function () {
    const makeBookSeatsRequest = (
      eventId,
      userId,
      amount,
      seatIds,
      transactionId,
      callback
    ) => {
      const seatIdsJson = encodeURIComponent(JSON.stringify(seatIds));

      request.get(
        `http://localhost:3000/v1/seats/bookSeats?eventId=${eventId}&userId=${userId}&amount=${amount}&seatIds=${seatIdsJson}&transactionId=${transactionId}`,
        {},
        (error, response, body) => {
          if (error) {
            callback(error);
            return;
          }
          callback(null, { response, body });
        }
      );
    };

    describe("Book Seats Successfully", function () {
      it("should book the selected seats successfully", function (done) {
        makeBookSeatsRequest(
          eventId,
          attendeeId,
          1500,
          [seatOneId, seatTwoId, seatThreeId],
          4584940,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;
              const data = JSON.parse(response.body);

              expect(response.statusCode).to.equal(200);
              expect(data.meta.code).to.equal(200);
              expect(data.meta.message).to.equal(messages.bookingSuccessfull);

              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });
    });

    describe("Edge Cases", function () {
      it("should return error if any of the seats have status of booked or invalid given data", function (done) {
        makeBookSeatsRequest(
          eventId,
          attendeeId,
          1500,
          [seatOneId, seatTwoId, seatThreeId],
          4584940,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;
              const data = JSON.parse(response.body);

              expect(response.statusCode).to.equal(400);
              expect(data.meta.code).to.equal(400);
              expect(data.meta.message).to.equal(messages.seatsAlreadyBooked);

              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });
    });
  });
});
