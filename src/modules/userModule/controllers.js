const pug = require("pug");
const jwt = require("jsonwebtoken");
const path = require("path");
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
const { findOne, generateForgotPasswordToken } = require("./helpers");
const { emailTransport } = require("../../services/mailTransport");
const { link } = require("./constants");

const registerUser = async (req, res) => {
  try {
    const validationResponse = userRegisterSchema(req.body, res);
    if (validationResponse !== false) return;

    const { username, email, password, usertype, timezone } = req.body;

    const existedUser = await findOne({ email });

    if (existedUser) {
      return errorResponseWithoutData(res, messages.userAlreadyExists, 400);
    }

    const user = await User.create({
      username,
      email,
      password,
      usertype,
      timezone,
    });

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
    console.log(messages.errorWhileUserRegister, error);
    return errorResponseWithoutData(res, messages.errorWhileUserRegister, 400);
  }
};

const userLogin = async (req, res) => {
  try {
    const validationResponse = userLoginSchema(req.body, res);
    if (validationResponse !== false) return;

    const { email, password } = req.body;

    const user = await findOne({ email });

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
    console.log(messages.errorWhileUserLogin, error);
    return errorResponseWithoutData(res, messages.errorWhileUserLogin, 400);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const validationResponse = forgotPasswordSchema(req.body, res);
    if (validationResponse !== false) return;

    const currentTime = Date.now();
    const { email } = req.body;

    const user = await findOne({ email });

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

    const link = `${link}${forgotPasswordToken}`;

    successResponseWithoutData(res, messages.resetPasswordMail, 200, {
      token: forgotPasswordToken,
    });

    user.forgotPasswordTime = currentTime;
    await user.save();

    const html = pug.renderFile(
      path.join(__dirname, "./view/forgotPassword.pug"),
      { link }
    );

    await emailTransport(
      "taher.babuji@mindinventory.com",
      email,
      "Link for Resetting your Password",
      html
    );
  } catch (error) {
    console.log(messages.errorSendingForgotPasswordMail, error);

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

    const user = await findOne({ email: decodedToken.email });

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
    console.log(messages.somethingWentWrongResetingPassword, error);

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

    if (username?.trim() === "" || email?.trim() === "") {
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
