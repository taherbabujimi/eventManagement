const chai = require("chai");
const expect = chai.expect;
const should = chai.should();
const request = require("request");
const { app, connectDB } = require("../index");
const { messages } = require("../src/modules/userModule/messages");
const { User } = require("../src/models/user");

describe("User Registration API Tests", function () {
  let server;

  before(function (done) {
    connectDB()
      .then(() => {
        server = app.listen(3000, done);
      })
      .catch(done);
  });

  after(function (done) {
    server.close(done);
  });

  beforeEach(function (done) {
    User.deleteMany({})
      .then(() => done())
      .catch(done);
  });

  const makeRequest = (userData, callback) => {
    request.post(
      "http://localhost:3000/v1/users/registerUser",
      { json: userData },
      (error, response, body) => {
        if (error) {
          callback(error);
          return;
        }
        callback(null, { response, body });
      }
    );
  };

  const validUserData = {
    username: "testuser",
    email: "test@example.com",
    password: "password123",
    usertype: "eventManager",
    timezone: "Asia/Kolkata",
  };

  describe("Successful Registration", function () {
    it("should successfully register a new user with valid data", function (done) {
      makeRequest(validUserData, (error, result) => {
        if (error) {
          done(error);
          return;
        }

        try {
          const { response, body } = result;
          expect(response.statusCode).to.equal(200);
          expect(body.meta.message).to.equal(messages.userRegisterSuccessfull);
          expect(body.data).to.have.property("email", validUserData.email);
          expect(body.data).to.have.property(
            "username",
            validUserData.username
          );
          expect(body.data).to.have.property(
            "usertype",
            validUserData.usertype
          );
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it("should trim whitespace from username", function (done) {
      const userDataWithSpaces = {
        ...validUserData,
        username: "  testuser  ",
        email: "test2@example.com",
      };

      makeRequest(userDataWithSpaces, (error, result) => {
        if (error) {
          done(error);
          return;
        }

        try {
          const { response, body } = result;
          expect(response.statusCode).to.equal(200);
          expect(body.data.username).to.equal("testuser");
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  describe("Validation Errors", function () {
    it("should reject registration with invalid email format", function (done) {
      const invalidEmailData = {
        ...validUserData,
        email: "invalid-email",
      };

      makeRequest(invalidEmailData, (error, result) => {
        if (error) {
          done(error);
          return;
        }

        try {
          const { response, body } = result;
          expect(response.statusCode).to.equal(400);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it("should reject registration with invalid timezone", function (done) {
      const invalidTimezoneData = {
        ...validUserData,
        timezone: "Invalid/Timezone",
      };

      makeRequest(invalidTimezoneData, (error, result) => {
        if (error) {
          done(error);
          return;
        }

        try {
          const { response, body } = result;
          expect(response.statusCode).to.equal(400);
          expect(body.meta.message).to.equal(messages.invalidTimeZone);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it("should reject registration with missing required fields", function (done) {
      const incompleteData = {
        email: "test@example.com",
        password: "password123",
      };

      makeRequest(incompleteData, (error, result) => {
        if (error) {
          done(error);
          return;
        }

        try {
          const { response, body } = result;
          expect(response.statusCode).to.equal(400);
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  describe("Duplicate User Handling", function () {
    it("should reject registration with duplicate email", function (done) {
      makeRequest(validUserData, (error, result1) => {
        if (error) {
          done(error);
          return;
        }

        // Second registration with same email
        makeRequest(
          {
            ...validUserData,
            username: "differentuser",
          },
          (error, result2) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result2;
              expect(response.statusCode).to.equal(400);
              expect(body.meta.message).to.equal(messages.userAlreadyExists);
              done();
            } catch (err) {
              done(err);
            }
          }
        );
      });
    });
  });

  describe("Edge Cases", function () {
    it("should handle long usernames and emails within limits", function (done) {
      const longData = {
        ...validUserData,
        username: "a".repeat(50),
        email: `${"a".repeat(50)}@example.com`,
      };

      makeRequest(longData, (error, result) => {
        if (error) {
          done(error);
          return;
        }

        try {
          const { response, body } = result;
          expect(response.statusCode).to.equal(400);
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  describe("Password Handling", function () {
    it("should not return password in response", function (done) {
      makeRequest(validUserData, (error, result) => {
        if (error) {
          done(error);
          return;
        }

        try {
          const { response, body } = result;
          expect(response.statusCode).to.equal(200);
          expect(body.data).to.not.have.property("password");
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });
});
