const chai = require("chai");
const expect = chai.expect;
const request = require("request");
const { Subscription } = require("../src/models/subscription");
const { messages } = require("../src/modules/subscriptionModule/messages");

describe("Subscribe API Tests", function () {
  let loginTokenUserThreeMonth;
  let loginTokenUserOneYear;

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

        loginTokenUserThreeMonth = body.meta.token;
      }
    );

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

        loginTokenUserOneYear = body.meta.token;

        done();
      }
    );
  });

  describe("Purchase Subscription API Tests", function () {
    before(function (done) {
      Subscription.deleteMany({})
        .then(() => done())
        .catch(done);
    });

    const makePurchaseSubscriptionRequest = (
      loginToken,
      subscriptionPlan,
      callback
    ) => {
      request.post(
        "http://localhost:3000/v1/subscriptions/purchaseSubscription",
        {
          json: subscriptionPlan,
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

    const threeMonthSubscriptionPlan = {
      subscriptionPlan: "threeMonth",
    };

    const oneYearSubscriptionPlan = {
      subscriptionPlan: "oneYear",
    };

    describe("Purchase Subscription Successfully", function () {
      it("should successfully add entry for three months subscription", function (done) {
        makePurchaseSubscriptionRequest(
          loginTokenUserThreeMonth,
          threeMonthSubscriptionPlan,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;

              expect(body.data.subscriptionPlan).to.equal(
                threeMonthSubscriptionPlan.subscriptionPlan
              );
              expect(body.meta.code).to.equal(200);
              expect(body.meta.message).to.equal(
                messages.successPurchaseSubscription
              );
              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });

      it("should successfully add entry for one year subscription", function (done) {
        makePurchaseSubscriptionRequest(
          loginTokenUserOneYear,
          oneYearSubscriptionPlan,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;

              expect(body.data.subscriptionPlan).to.equal(
                oneYearSubscriptionPlan.subscriptionPlan
              );
              expect(body.meta.code).to.equal(200);
              expect(body.meta.message).to.equal(
                messages.successPurchaseSubscription
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
      it("should return error if user already have one year subscription and it is still not expired", function (done) {
        makePurchaseSubscriptionRequest(
          loginTokenUserOneYear,
          oneYearSubscriptionPlan,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;
              expect(body.meta.code).to.equal(400);
              expect(body.meta.message).to.equal(
                messages.userAlreadySubscribed
              );
              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });

      it("should return error if user already have three month subscription and it is still not expired and have not published ten events, and user wants to purchase three month subscription again", function (done) {
        makePurchaseSubscriptionRequest(
          loginTokenUserThreeMonth,
          threeMonthSubscriptionPlan,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;
              expect(body.meta.code).to.equal(400);
              expect(body.meta.message).to.equal(
                messages.userAlreadySubscribedAndHaveRemainingEvents
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
  });
});
