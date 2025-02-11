const chai = require("chai");
const expect = chai.expect;
const request = require("request");
const { closeServer } = require("./0_testUser");

describe("Event API Tests", function () {
  let loginToken;

  before(function (done) {
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

        loginToken = body.meta.token;

        done();
      }
    );
  });

  after(function (done) {
    closeServer();
    done();
  });

  describe("Get Upload Signature API Tests", function () {
    const makeUploadSignatureRequest = (callback) => {
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
        makeUploadSignatureRequest((error, result) => {
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
        });
      });
    });
  });

  // describe("Add Event API Tests", function () {
  //   const makeAddEventRequest = (validEventData, callback) => {
  //     request.post(
  //       "http://localhost:3000/v1/events/addEvent",
  //       {
  //         json: validEventData,
  //         headers: { Authorization: `Bearer ${loginToken}` },
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

  //   const validEventData = {
  //     name: "taherevent1",
  //     title: "taherevent1",
  //     image:
  //       "http://res.cloudinary.com/dztt4qqb8/image/upload/v1738317550/k8bc2t3dwbldmjf6vpp8.jpg",
  //     dateTime: "2025-02-05T10:30:00.000+00:00",
  //     description: "concert",
  //     location: "Sola, MindInventory, Ahmedabad",
  //   };

  //   describe("Add Event Successfully", function () {
  //     it("should successfully add event", function (done) {
  //       makeAddEventRequest(validEventData, (error, result) => {
  //         if (error) {
  //           done(error);
  //           return;
  //         }

  //         try {
  //           const { response, body } = result;
  //           expect(body.meta.status).to.equal(200);
  //         } catch (error) {
  //           done(error);
  //           return;
  //         }
  //       });
  //     });
  //   });
  // });
});
