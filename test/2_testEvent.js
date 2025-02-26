const chai = require("chai");
const expect = chai.expect;
const request = require("request");

const moment = require("moment");
const { messages } = require("../src/modules/eventModule/messages");
const { Event } = require("../src/models/event");
const { User } = require("../src/models/user");
const { Subscription } = require("../src/models/subscription");
const mongoose = require("mongoose");

describe("Event API Tests", function () {
  let tokenWithOneYearSubscription;
  let tokenWithThreeMonthSubscription;
  let tokenWithoutSubscription;
  let tokenAttendee;
  let tokenAttendeeWithoutSavedEvents;
  let userWithSubscriptionId;
  let UserWithThreeMonthSubscriptionId;
  let eventId;

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

        userWithSubscriptionId = body.data._id;

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
          email: "babujitaher7@gmail.com",
          password: "password123",
        },
      },
      (error, response, body) => {
        if (error) {
          done(error);
        }

        UserWithThreeMonthSubscriptionId = body.data._id;

        tokenWithThreeMonthSubscription = body.meta.token;
      }
    );

    request.post(
      "http://localhost:3000/v1/users/userLogin",
      {
        json: {
          email: "unsubscribedUser@example.com",
          password: "password123",
        },
      },
      (error, response, body) => {
        if (error) {
          done(error);
        }

        tokenWithoutSubscription = body.meta.token;

        done();
      }
    );
  });

  describe("Get Upload Signature API Tests", function () {
    beforeEach(function (done) {
      Event.deleteMany({})
        .then(() => done())
        .catch(done);
    });
    const makeUploadSignatureRequest = (loginToken, callback) => {
      request.get(
        "http://localhost:3000/v1/events/getUploadSignature",
        {
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

    describe("Get Signature Successfully", function () {
      it("should successfully provide the upload signature", function (done) {
        makeUploadSignatureRequest(
          tokenWithOneYearSubscription,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;

              const data = JSON.parse(response.body);

              expect(data.meta.code).to.equal(200);
              expect(data.timestamp).to.not.be.null;
              expect(data.signature).to.not.be.null;
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

  describe("Add Event API Tests", function () {
    const makeAddEventRequest = (loginToken, validEventData, callback) => {
      request.post(
        "http://localhost:3000/v1/events/addEvent",
        {
          json: validEventData,
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

    const validEventData = {
      name: "taherevent1",
      title: "taherevent1",
      image:
        "http://res.cloudinary.com/dztt4qqb8/image/upload/v1738317550/k8bc2t3dwbldmjf6vpp8.jpg",
      dateTime: moment(Date.now()).add(15, "day"),
      description: "concert",
      location: "Sola, MindInventory, Ahmedabad",
    };

    const invalidEventData = {
      name: "ta",
      title: "ta",
      image:
        "http://res.cloudinary.com/dztt4qqb8/image/upload/v1738317550/k8bc2t3dwbldmjf6vpp8.jpg",
      dateTime: moment(Date.now()).add(15, "day"),
      description: "concert",
      location: "Sola, MindInventory, Ahmedabad",
    };

    describe("Add Event Successfully", function () {
      it("should successfully add event", function (done) {
        makeAddEventRequest(
          tokenWithOneYearSubscription,
          validEventData,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;
              eventId = body.data._id;
              expect(body.meta.code).to.equal(200);
              expect(body.meta.message).to.equal(messages.addEventSuccess);
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
      it("should return error if event already exists with provided title", function (done) {
        makeAddEventRequest(
          tokenWithOneYearSubscription,
          validEventData,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;
              expect(body.meta.code).to.equal(400);
              expect(response.statusCode).to.equal(400);
              expect(body.meta.message).to.equal(messages.eventExists);
              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });

      it("should return error if the provided data is not valid", function (done) {
        makeAddEventRequest(
          tokenWithOneYearSubscription,
          invalidEventData,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;
              expect(response.statusCode).to.equal(400);
              expect(body.meta.code).to.equal(400);
              expect(body.data).to.equal(null);
              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });

      it("should create trial events successfully if user have not subscribed and user still have trial period", function (done) {
        makeAddEventRequest(
          tokenWithoutSubscription,
          { ...validEventData, name: "taherevent2", title: "taherevent2" },
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;
              expect(body.meta.code).to.equal(200);
              expect(body.meta.message).to.equal(messages.addEventSuccess);
              expect(body.data.eventType).to.equal("trial");
              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });

      it("should not create trial events with the same title", function (done) {
        makeAddEventRequest(
          tokenWithoutSubscription,
          { ...validEventData, name: "taherevent2", title: "taherevent2" },
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;
              expect(body.meta.code).to.equal(400);
              expect(body.meta.message).to.equal(messages.eventExists);
              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });

      it("should provide error if user is not subscribed and user's free trial is completed", async function () {
        let user = await User.findOne({
          email: "unsubscribedUser@example.com",
        });

        user.createdAt = moment(Date.now())
          .subtract(5, "days")
          .format("DD-MM-YYYY");

        await user.save();

        const result = await new Promise((resolve, reject) => {
          makeAddEventRequest(
            tokenWithoutSubscription,
            validEventData,
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
        expect(body.meta.message).to.equal(messages.trialCompleted);
        expect(body.meta.code).to.equal(400);
      });

      it("should return error if user's subscription is expired", async function () {
        await Subscription.findOneAndUpdate(
          { userId: userWithSubscriptionId },
          {
            expiry: moment(Date.now()).subtract(5, "days"),
          }
        );

        const result = await new Promise((resolve, reject) => {
          makeAddEventRequest(
            tokenWithOneYearSubscription,
            {
              ...validEventData,
              name: "taherevent3",
              title: "taherevent3",
            },
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
        expect(body.meta.message).to.equal(messages.subscriptionExpired);
        expect(body.meta.code).to.equal(400);
      });

      it("should return error if user have three month subscription and user have already added ten events", async function () {
        await Event.create([
          {
            userId: UserWithThreeMonthSubscriptionId,
            name: "taherevent0",
            title: "taherevent0",
            image:
              "http://res.cloudinary.com/dztt4qqb8/image/upload/v1738317550/k8bc2t3dwbldmjf6vpp8.jpg",
            dateTime: moment(Date.now()).add(15, "day"),
            description: "concert",
            location: "Sola, MindInventory, Ahmedabad",
          },
          {
            userId: UserWithThreeMonthSubscriptionId,
            name: "taherevent20",
            title: "taherevent20",
            image:
              "http://res.cloudinary.com/dztt4qqb8/image/upload/v1738317550/k8bc2t3dwbldmjf6vpp8.jpg",
            dateTime: moment(Date.now()).add(15, "day"),
            description: "concert",
            location: "Sola, MindInventory, Ahmedabad",
          },
          {
            userId: UserWithThreeMonthSubscriptionId,
            name: "taherevent3",
            title: "taherevent3",
            image:
              "http://res.cloudinary.com/dztt4qqb8/image/upload/v1738317550/k8bc2t3dwbldmjf6vpp8.jpg",
            dateTime: moment(Date.now()).add(15, "day"),
            description: "concert",
            location: "Sola, MindInventory, Ahmedabad",
          },
          {
            userId: UserWithThreeMonthSubscriptionId,
            name: "taherevent4",
            title: "taherevent4",
            image:
              "http://res.cloudinary.com/dztt4qqb8/image/upload/v1738317550/k8bc2t3dwbldmjf6vpp8.jpg",
            dateTime: moment(Date.now()).add(15, "day"),
            description: "concert",
            location: "Sola, MindInventory, Ahmedabad",
          },
          {
            userId: UserWithThreeMonthSubscriptionId,
            name: "taherevent5",
            title: "taherevent5",
            image:
              "http://res.cloudinary.com/dztt4qqb8/image/upload/v1738317550/k8bc2t3dwbldmjf6vpp8.jpg",
            dateTime: moment(Date.now()).add(15, "day"),
            description: "concert",
            location: "Sola, MindInventory, Ahmedabad",
          },
          {
            userId: UserWithThreeMonthSubscriptionId,
            name: "taherevent6",
            title: "taherevent6",
            image:
              "http://res.cloudinary.com/dztt4qqb8/image/upload/v1738317550/k8bc2t3dwbldmjf6vpp8.jpg",
            dateTime: moment(Date.now()).add(15, "day"),
            description: "concert",
            location: "Sola, MindInventory, Ahmedabad",
          },
          {
            userId: UserWithThreeMonthSubscriptionId,
            name: "taherevent7",
            title: "taherevent7",
            image:
              "http://res.cloudinary.com/dztt4qqb8/image/upload/v1738317550/k8bc2t3dwbldmjf6vpp8.jpg",
            dateTime: moment(Date.now()).add(15, "day"),
            description: "concert",
            location: "Sola, MindInventory, Ahmedabad",
          },
          {
            userId: UserWithThreeMonthSubscriptionId,
            name: "taherevent8",
            title: "taherevent8",
            image:
              "http://res.cloudinary.com/dztt4qqb8/image/upload/v1738317550/k8bc2t3dwbldmjf6vpp8.jpg",
            dateTime: moment(Date.now()).add(15, "day"),
            description: "concert",
            location: "Sola, MindInventory, Ahmedabad",
          },
          {
            userId: UserWithThreeMonthSubscriptionId,
            name: "taherevent9",
            title: "taherevent9",
            image:
              "http://res.cloudinary.com/dztt4qqb8/image/upload/v1738317550/k8bc2t3dwbldmjf6vpp8.jpg",
            dateTime: moment(Date.now()).add(15, "day"),
            description: "concert",
            location: "Sola, MindInventory, Ahmedabad",
          },
          {
            userId: UserWithThreeMonthSubscriptionId,
            name: "taherevent10",
            title: "taherevent10",
            image:
              "http://res.cloudinary.com/dztt4qqb8/image/upload/v1738317550/k8bc2t3dwbldmjf6vpp8.jpg",
            dateTime: moment(Date.now()).add(15, "day"),
            description: "concert",
            location: "Sola, MindInventory, Ahmedabad",
          },
        ]);

        const result = await new Promise((resolve, reject) => {
          makeAddEventRequest(
            tokenWithThreeMonthSubscription,
            {
              ...validEventData,
              name: "taherevent12",
              title: "taherevent12",
            },
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
        expect(body.meta.message).to.equal(messages.NoOfAllowedEventsCompleted);
        expect(body.meta.code).to.equal(400);
      });
    });
  });

  describe("Get Upcoming Events API Tests", function () {
    const makeGetUpcomingEventsRequest = (loginToken, callback) => {
      request.get(
        "http://localhost:3000/v1/events/getUpcomingEvents",
        {
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

    describe("Get Upcoming Events Successfully", function () {
      it("should successfully provide the upcoming events", function (done) {
        makeGetUpcomingEventsRequest(tokenAttendee, (error, result) => {
          if (error) {
            done(error);
            return;
          }

          const { response, body } = result;
          let data = JSON.parse(response.body);

          expect(response.statusCode).to.equal(200);
          expect(data.meta.code).to.equal(200);
          expect(data.meta.message).to.equal(messages.fetchedUpcomingEvents);
          done();
        });
      });
    });
  });

  describe("Get Upcoming Events By Event Manager API Tests", function () {
    const makeGetEventsByManagerRequest = (loginToken, callback) => {
      request.get(
        "http://localhost:3000/v1/events/getUpcomingEventsByUser",
        {
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

    describe("Get Upcoming Events By Manager Successfully", function () {
      it("should successfully provide upcoming evets by manager", function (done) {
        makeGetEventsByManagerRequest(
          tokenWithThreeMonthSubscription,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            const { response, body } = result;
            let data = JSON.parse(response.body);

            expect(response.statusCode).to.equal(200);
            expect(data.meta.code).to.equal(200);
            expect(data.meta.message).to.equal(messages.allEventsByUserFetched);
            done();
          }
        );
      });
    });
  });

  describe("Update Event API Tests", function () {
    const makeUpdateEventRequest = (loginToken, updateEventData, callback) => {
      request.put(
        `http://localhost:3000/v1/events/updateEvent?eventId=${eventId}`,
        {
          json: updateEventData,
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

    const updateEventData = {
      name: "dhonievent22",
      title: "dhonievent22",
      image:
        "http://res.cloudinary.com/dztt4qqb8/image/upload/v1738328713/prycz5bjglebopc6ztmo.jpg",
      description: "very good concert",
      location: "Pune, Maharashtra",
    };

    const invalidUpdateEventData = {
      name: "dhonievent22",
      title: "dhonievent22",
      image: "    ",
      location: "    ",
    };

    const invalidUpdateEventData2 = {
      name: "dhonievent22",
      title: "dhonievent22",
      image: "",
      location: "",
    };

    describe("Update Event Successfully", function () {
      it("should successfully update event", function (done) {
        makeUpdateEventRequest(
          tokenWithOneYearSubscription,
          updateEventData,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            const { response, body } = result;

            expect(response.statusCode).to.equal(200);
            expect(body.meta.code).to.equal(200);
            expect(body.meta.message).to.equal(
              messages.userUpdatedSuccessfully
            );

            done();
          }
        );
      });
    });

    describe("Edge Cases", function () {
      it("should return error if any user is trying to update event which does not belong to them", function (done) {
        makeUpdateEventRequest(
          tokenWithThreeMonthSubscription,
          updateEventData,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            const { response, body } = result;
            expect(response.statusCode).to.equal(400);
            expect(body.meta.code).to.equal(400);
            expect(body.meta.message).to.equal(messages.eventAccessNotAllowed);

            done();
          }
        );
      });

      it("should return error if any empty key is there in the data", function (done) {
        makeUpdateEventRequest(
          tokenWithOneYearSubscription,
          invalidUpdateEventData,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            const { response, body } = result;
            expect(response.statusCode).to.equal(400);
            expect(body.meta.code).to.equal(400);
            expect(body.meta.message).to.equal(messages.valueCannotBeEmpty);

            done();
          }
        );
      });

      it("should return validation error if any string value have less than three characters", function (done) {
        makeUpdateEventRequest(
          tokenWithOneYearSubscription,
          invalidUpdateEventData2,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            const { response, body } = result;
            expect(response.statusCode).to.equal(400);
            expect(body.meta.code).to.equal(400);

            done();
          }
        );
      });
    });
  });

  describe("Save Event API Tests", function () {
    const makeSaveEventRequest = (eventId, loginToken, callback) => {
      request.post(
        `http://localhost:3000/v1/events/saveEvent?eventId=${eventId}`,
        { headers: { Authorization: `Bearer ${loginToken}` } },
        (error, response, body) => {
          if (error) {
            callback(error);
            return;
          }
          callback(null, { response, body });
        }
      );
    };

    describe("Save Event Successfully", function () {
      it("should successfully save event", function (done) {
        makeSaveEventRequest(eventId, tokenAttendee, (error, result) => {
          if (error) {
            done(error);
            return;
          }

          const { response, body } = result;
          expect(response.statusCode).to.equal(200);
          let data = JSON.parse(response.body);
          expect(data.data).to.equal(null);
          expect(data.meta.code).to.equal(200);
          expect(data.meta.message).to.equal(messages.successSavingEvent);
          done();
        });
      });
    });

    describe("Edge Cases", function () {
      it("should return error if user have already saved the selected event", function (done) {
        makeSaveEventRequest(eventId, tokenAttendee, (error, result) => {
          if (error) {
            done(error);
            return;
          }

          const { response, body } = result;
          expect(response.statusCode).to.equal(200);
          let data = JSON.parse(response.body);
          expect(data.data).to.equal(null);
          expect(data.meta.code).to.equal(200);
          expect(data.meta.message).to.equal(messages.eventAlreadySaved);
          done();
        });
      });

      it("should return error if the event does not exist", function (done) {
        makeSaveEventRequest(
          "67af0b2022258e7c59118366",
          tokenAttendee,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            const { response, body } = result;
            expect(response.statusCode).to.equal(400);
            let data = JSON.parse(response.body);
            expect(data.meta.code).to.equal(400);
            expect(data.meta.message).to.equal(messages.eventNotExists);
            done();
          }
        );
      });
    });
  });

  describe("Get Saved Events API Tests", function () {
    const makeGetSavedEventsRequest = (loginToken, callback) => {
      request.get(
        "http://localhost:3000/v1/events//getSavedEvents",
        {
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

    describe("Get Saved Events Successfully", function () {
      it("should get all saved events successfully", (done) => {
        makeGetSavedEventsRequest(tokenAttendee, (error, result) => {
          if (error) {
            done(error);
            return;
          }

          const { response, body } = result;
          let data = JSON.parse(response.body);
          expect(response.statusCode).to.equal(200);
          expect(data.meta.code).to.equal(200);
          expect(data.meta.message).to.equal(
            messages.successfullyFetchedSavedEvents
          );
          done();
        });
      });
    });

    describe("Edge Cases", function () {
      it("should return a message, if user have not saved any events previously", (done) => {
        makeGetSavedEventsRequest(
          tokenAttendeeWithoutSavedEvents,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            const { response, body } = result;
            let data = JSON.parse(response.body);
            expect(response.statusCode).to.equal(200);
            expect(data.meta.code).to.equal(200);
            expect(data.meta.message).to.equal(messages.zeroSavedEvents);
            done();
          }
        );
      });
    });
  });

  describe("Get Past Events Created By Event Manager Successfully", function () {
    const makeGetPastEventsCreatedByEventManagerRequest = (
      loginToken,
      callback
    ) => {
      request.get(
        "http://localhost:3000/v1/events/getPastEventsByUser",
        {
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

    describe("Get Past Events Successfully", function () {
      it("should get all the past events of the event manager", async () => {
        await Event.create({
          name: "taherevent23",
          title: "taherevent23",
          image:
            "http://res.cloudinary.com/dztt4qqb8/image/upload/v1738317550/k8bc2t3dwbldmjf6vpp8.jpg",
          dateTime: "2025-02-05T10:30:00.000+00:00",
          description: "concert",
          location: "Sola, MindInventory, Ahmedabad",
          userId: userWithSubscriptionId,
        });

        const result = await new Promise((resolve, reject) => {
          makeGetPastEventsCreatedByEventManagerRequest(
            tokenWithOneYearSubscription,
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

        let data = JSON.parse(body);

        expect(response.statusCode).to.equal(200);
        expect(data.meta.code).to.equal(200);
        expect(data.meta.message).to.equal(
          messages.pastEventByManagerFetchedSuccess
        );
      });
    });

    describe("Edge Cases", function () {
      it("should return success response, if user don't have any previous events", function (done) {
        makeGetPastEventsCreatedByEventManagerRequest(
          tokenWithThreeMonthSubscription,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            const { response, body } = result;
            const data = JSON.parse(response.body);
            expect(response.statusCode).to.equal(200);
            expect(data.meta.code).to.equal(200);
            expect(data.meta.message).to.equal(messages.zeroPastEventByManager);
            done();
          }
        );
      });
    });
  });
});
