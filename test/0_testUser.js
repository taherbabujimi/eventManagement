const chai = require("chai");
const expect = chai.expect;
const request = require("request");
const { app, connectDB } = require("../index");
const { messages } = require("../src/modules/userModule/messages");
const { User } = require("../src/models/user");

let forgotPasswordToken;
let token;

describe("User API Tests", function () {
  let server;

  before(function (done) {
    connectDB()
      .then(() => {
        server = app.listen(3000, done);
      })
      .catch(done);
  });

  function closeServer() {
    return server.close();
  }

  module.exports = { closeServer };

  describe("User Registration API Tests", function () {
    beforeEach(function (done) {
      User.deleteMany({})
        .then(() => done())
        .catch(done);
    });

    beforeEach(function (done) {
      User.create([
        {
          username: "testuser2",
          email: "babujitaher7@gmail.com",
          password: "password123",
          usertype: "eventManager",
          timezone: "Asia/Kolkata",
        },
        {
          username: "testuser3",
          email: "test3@example.com",
          password: "password123",
          usertype: "eventManager",
          timezone: "Asia/Kolkata",
        },
        {
          username: "testuser4",
          email: "test4@example.com",
          password: "password123",
          usertype: "attendee",
          timezone: "Asia/Kolkata",
        },
        {
          username: "unsubscribedUser",
          email: "unsubscribedUser@example.com",
          password: "password123",
          usertype: "eventManager",
          timezone: "Asia/Kolkata",
        },
      ])
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
      usertype: "attendee",
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
            expect(body.meta.message).to.equal(
              messages.userRegisterSuccessfull
            );
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

  describe("User Login API Tests", function () {
    const makeLoginRequest = (userData, callback) => {
      request.post(
        "http://localhost:3000/v1/users/userLogin",
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
      email: "test3@example.com",
      password: "password123",
    };

    const notRegisteredUserData = {
      email: "test2@example.com",
      password: "password123",
    };

    describe("Successful Login", function () {
      it("should log in a user with valid credentials", function (done) {
        makeLoginRequest(validUserData, (error, result) => {
          if (error) {
            done(error);
            return;
          }

          try {
            const { response, body } = result;
            token = body.meta.token;
            expect(response.statusCode).to.equal(200);
            expect(body.meta.message).to.equal(messages.userLoginSuccessfully);
            expect(body.data).to.have.property("email", validUserData.email);
            done();
          } catch (err) {
            done(err);
          }
        });

        makeLoginRequest(validUserData, (error, result) => {
          if (error) {
            done(error);
            return;
          }
        });
      });

      it("should return a json web token", function (done) {
        makeLoginRequest(validUserData, (error, result) => {
          if (error) {
            done(error);
            return;
          }

          try {
            const { response, body } = result;
            expect(body.meta.token).to.not.have.null;
            done();
          } catch (error) {
            done(error);
            return;
          }
        });
      });
    });

    describe("validation errors", function () {
      it("should reject user login if user have not registered", function (done) {
        makeLoginRequest(notRegisteredUserData, (error, result) => {
          if (error) {
            done(error);
            return;
          }

          try {
            const { response, body } = result;
            expect(body.data).to.equal(null);
            expect(body.meta.code).to.equal(400);
            expect(body.meta.message).to.equal(messages.userNotExist);
            done();
          } catch (error) {
            done(error);
            return;
          }
        });
      });

      it("should reject user login if provided password is invalid", function (done) {
        makeLoginRequest(
          { ...validUserData, password: "password1234" },
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;
              expect(body.data).to.equal(null);
              expect(body.meta.code).to.equal(400);
              expect(body.meta.message).to.equal(messages.invalidCredentials);
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

  describe("Forgot password API Tests", function () {
    const makeForgotPasswordRequest = (email, callback) => {
      request.post(
        "http://localhost:3000/v1/users/forgotPassword",
        {
          json: email,
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

    const validEmail = {
      email: "test@example.com",
    };

    const invalidEmail = {
      email: "test1234@example.com",
    };

    describe("email sent successfully", function () {
      it("should send email to the user", function (done) {
        makeForgotPasswordRequest(validEmail, (error, result) => {
          if (error) {
            done(error);
            return;
          }

          try {
            const { response, body } = result;
            forgotPasswordToken = body.meta.token;
            expect(body.meta.message).to.equal(messages.resetPasswordMail);
            expect(body.meta.code).to.equal(200);
            expect(body.meta.token).to.not.null;
            done();
          } catch (error) {
            done(error);
            return;
          }
        });
      });
    });

    describe("validation errors", function () {
      it("should not send mail if the user does not exist in database", function (done) {
        makeForgotPasswordRequest(invalidEmail, (error, result) => {
          if (error) {
            done(error);
            return;
          }

          try {
            const { response, body } = result;
            expect(body.meta.message).to.equal(messages.userNotExist);
            expect(body.meta.code).to.equal(400);
            done();
          } catch (error) {
            done(error);
            return;
          }
        });
      });

      it("should not send mail if user have already requested a forgot password email within the last hour", function (done) {
        makeForgotPasswordRequest(validEmail, (error, result) => {
          if (error) {
            done(error);
            return;
          }

          try {
            const { response, body } = result;
            expect(body.meta.message).to.equal(messages.tryAgainLater);
            expect(body.meta.code).to.equal(400);
            done();
          } catch (error) {
            done(error);
            return;
          }
        });
      });
    });
  });

  describe("Reset Password API Tests", function () {
    const makeResetPasswordRequest = (newPassword, token, callback) => {
      request.post(
        `http://localhost:3000/v1/users/resetPassword?token=${token}`,
        { json: newPassword },
        (error, response, body) => {
          if (error) {
            callback(error);
            return;
          }
          callback(null, { response, body });
        }
      );
    };

    const validPassword = {
      newPassword: "taher",
    };

    describe("reset password successful", function () {
      it("should reset the password of user", function (done) {
        makeResetPasswordRequest(
          validPassword,
          forgotPasswordToken,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;
              expect(body.meta.message).to.equal(messages.resetPasswordSuccess);
              expect(body.meta.code).to.equal(200);
              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });
    });

    describe("validation errors", async function () {
      it("should return a error if the token is empty", function (done) {
        request.post(
          `http://localhost:3000/v1/users/resetPassword`,
          { json: { newPassword: "taher" } },
          (error, response, body) => {
            if (error) {
              done(error);
              return;
            }

            try {
              expect(body.meta.message).to.equal(messages.invalidRequest);
              expect(body.meta.code).to.equal(400);
              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });

      it("should return a error if the token is not decoded", function (done) {
        process.env.FORGOTPASSWORD_TOKEN_SECRET = "empty";
        makeResetPasswordRequest(
          validPassword,
          forgotPasswordToken,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;
              expect(body.meta.message).to.equal(
                "Something went wrong while reseting password: JsonWebTokenError: invalid signature"
              );
              expect(response.statusCode).to.equal(400);
              done();
            } catch (error) {
              done(error);
              return;
            }
          }
        );
      });

      it("should return error if user does not exist in the database", async function () {
        await User.deleteOne({ email: "test@example.com" });

        process.env.FORGOTPASSWORD_TOKEN_SECRET = "forgotpassword";

        const result = await new Promise((resolve, reject) => {
          makeResetPasswordRequest(
            validPassword,
            forgotPasswordToken,
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
        expect(body.meta.message).to.equal(
          messages.somethingWentWrongResetingPassword
        );
        expect(response.statusCode).to.equal(400);
      });
    });
  });

  describe("Update User Profile API Tests", function () {
    const makeUpdateUserProfileRequest = (userData, token, callback) => {
      request.put(
        "http://localhost:3000/v1/users/updateUserProfile",
        {
          json: userData,
          headers: { Authorization: `Bearer ${token}` },
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

    const userData = {
      username: "dhoni",
      email: "dhoni@gmail.com",
    };

    const invalidUserData = {
      username: "   ",
      email: "dhoni@gmail.com",
    };

    describe("update user profile successful", function () {
      it("should update the profile of user", function (done) {
        makeUpdateUserProfileRequest(userData, token, (error, result) => {
          if (error) {
            done(error);
            return;
          }

          try {
            const { response, body } = result;
            expect(body.meta.message).to.equal(
              messages.updateUserProfileSuccessfull
            );
            expect(body.meta.code).to.equal(200);
            done();
          } catch (error) {
            done(error);
            return;
          }
        });
      });
    });

    describe("validation errors", function () {
      it("should return error if only whitespaces are provided instead of valid data", function (done) {
        makeUpdateUserProfileRequest(
          invalidUserData,
          token,
          (error, result) => {
            if (error) {
              done(error);
              return;
            }

            try {
              const { response, body } = result;
              expect(body.meta.message).to.equal(messages.valueCannotBeEmpty);
              expect(body.meta.code).to.equal(400);
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
