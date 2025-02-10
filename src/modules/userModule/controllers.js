const pug = require("pug");
const jwt = require("jsonwebtoken");
const path = require("path");
const moment = require("moment-timezone");
const { User } = require("../../models/user");
const {
  errorResponseWithoutData,
  successResponseData,
  successResponseWithoutData,
} = require("../../services/responses");
const { messages } = require("./messages");
const {
  userRegisterSchema,
  userLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateUserProfileSchema,
} = require("./validations");
const {
  findOneUser,
  generateForgotPasswordToken,
  removeWhitespaces,
  createUser,
} = require("./helpers");
const { emailTransport } = require("../../services/mailTransport");
const { link, forgotPasswordSubject } = require("./constants");

const registerUser = async (req, res) => {
  try {
    const validationResponse = userRegisterSchema(req.body, res);
    if (validationResponse !== false) return;

    const { email, password, usertype, timezone } = req.body;
    let username = req.body.username;

    username = removeWhitespaces(username);

    const existedUser = await findOneUser({ email });

    if (existedUser) {
      return errorResponseWithoutData(res, messages.userAlreadyExists, 400);
    }

    const isValid = moment.tz.names().includes(timezone);

    if (isValid === false) {
      return errorResponseWithoutData(res, messages.invalidTimeZone, 400);
    }

    let userObject = {
      username,
      email,
      password,
      usertype,
      timezone,
    };

    const user = await createUser(userObject);

    if (!user) {
      return errorResponseWithoutData(
        res,
        messages.somethingWentWrongRegisteringUser,
        500
      );
    }

    return successResponseData(
      res,
      user,
      200,
      messages.userRegisterSuccessfull
    );
  } catch (error) {
    return errorResponseWithoutData(res, messages.errorWhileUserRegister, 400);
  }
};

const userLogin = async (req, res) => {
  try {
    const validationResponse = userLoginSchema(req.body, res);
    if (validationResponse !== false) return;

    const { email, password } = req.body;

    const user = await findOneUser({ email });

    if (!user) {
      return errorResponseWithoutData(res, messages.userNotExist, 400);
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      return errorResponseWithoutData(res, messages.invalidCredentials, 400);
    }

    const accessToken = await user.generateAccessToken();

    return successResponseData(res, user, 200, messages.userLoginSuccessfully, {
      token: accessToken,
    });
  } catch (error) {
    return errorResponseWithoutData(res, messages.errorWhileUserLogin, 400);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const validationResponse = forgotPasswordSchema(req.body, res);
    if (validationResponse !== false) return;

    const currentTime = Date.now();
    const { email } = req.body;

    const user = await findOneUser({ email });

    if (!user) {
      return errorResponseWithoutData(res, messages.userNotExist, 400);
    }

    if (
      user.forgotPasswordTime &&
      currentTime - user.forgotPasswordTime < 1000 * 60 * 60
    ) {
      return errorResponseWithoutData(res, messages.tryAgainLater, 400);
    }

    const forgotPasswordToken = await generateForgotPasswordToken(email);

    const url = `${link}${forgotPasswordToken}`;

    successResponseWithoutData(res, messages.resetPasswordMail, 200, {
      token: forgotPasswordToken,
    });

    user.forgotPasswordTime = currentTime;
    await user.save();

    const html = pug.renderFile(
      path.join(__dirname, "./view/forgotPassword.pug"),
      { url }
    );

    await emailTransport(
      process.env.ADMIN_EMAIL,
      email,
      forgotPasswordSubject,
      html
    );
  } catch (error) {
    return errorResponseWithoutData(
      res,
      messages.errorSendingForgotPasswordMail,
      400
    );
  }
};

const resetPassword = async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) {
      return errorResponseWithoutData(res, messages.invalidRequest, 400);
    }

    const decodedToken = await jwt.verify(
      token,
      process.env.FORGOTPASSWORD_TOKEN_SECRET
    );

    if (!decodedToken) {
      return errorResponseWithoutData(res, messages.invalidRequest, 400);
    }

    const user = await findOneUser({ email: decodedToken.email });

    if (!user) {
      return errorResponseWithoutData(
        res,
        messages.somethingWentWrongResetingPassword,
        400
      );
    }

    const validationResponse = resetPasswordSchema(req.body);
    if (validationResponse !== false) return;

    const { newPassword } = req.body;

    user.password = newPassword;
    user.forgotPasswordTime = null;

    await user.save();

    return successResponseWithoutData(res, messages.resetPasswordSuccess, 200);
  } catch (error) {
    return errorResponseWithoutData(
      res,
      `${messages.somethingWentWrongResetingPassword}: ${error}`,
      400
    );
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const validationResponse = updateUserProfileSchema(req.body, res);
    if (validationResponse !== false) return;

    const { username, email } = req.body;

    if (username?.trim() === "") {
      return errorResponseWithoutData(res, messages.valueCannotBeEmpty, 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        username,
        email,
      },
      {
        new: true,
      }
    );

    if (!user) {
      return errorResponseWithoutData(
        res,
        messages.errorUpdatingUserProfile,
        400
      );
    }

    return successResponseData(
      res,
      user,
      200,
      messages.updateUserProfileSuccessfull
    );
  } catch (error) {
    console.log(messages.errorUpdatingUserProfile, error);

    return errorResponseWithoutData(
      res,
      `${messages.errorUpdatingUserProfile} : ${error}`,
      400
    );
  }
};

module.exports = {
  registerUser,
  userLogin,
  forgotPassword,
  resetPassword,
  updateUserProfile,
};
