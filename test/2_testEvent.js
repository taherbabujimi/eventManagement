const chai = require("chai");
const expect = chai.expect;
const request = require("request");
const { closeServer } = require("./0_testUser");
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

  after(function (done) {
    closeServer();
    done();
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
              console.log("EVENT BODY: ", body);
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

  // describe("Update Event API Tests", function () {
  //   const makeUpdateEventRequest = (loginToken, updateEventData, callback) => {
  //     request.put(
  //       `http://localhost:3000/v1/events/updateEvent?eventId=${eventId}`,
  //       {
  //         json: updateEventData,
  //       },
  //       (error, response, body) => {
  //         if (error) {
  //           callback(error);
  //           return;
  //         }
  //         callback(null, { response, body });
  //       }
  //     );
  //   };

  //   const updateEventData = {
  //     name: "dhonievent22",
  //     title: "dhonievent22",
  //     image:
  //       "http://res.cloudinary.com/dztt4qqb8/image/upload/v1738328713/prycz5bjglebopc6ztmo.jpg",
  //     description: "very good concert",
  //     location: "Pune, Maharashtra",
  //   };

  //   describe("Update Event Successfully", function () {
  //     it("should successfully update event", function (done) {
  //       makeUpdateEventRequest(
  //         tokenWithOneYearSubscription,
  //         updateEventData,
  //         (error, result) => {
  //           if (error) {
  //             done(error);
  //             return;
  //           }


  //         }
  //       );
  //     });
  //   });
  // });
});
