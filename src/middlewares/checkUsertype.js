const { errorResponseWithoutData } = require("../services/responses");
const { commonMessages } = require("../services/commonMessages");

const verifyUserType = (allowedUserType) => {
  return async (req, res, next) => {
    try {
      if (!allowedUserType.includes(req.user.usertype)) {
        return errorResponseWithoutData(res, commonMessages.notAuthorized, 400);
      }

      next();
    } catch (error) {
      console.log(commonMessages.errorVerifyingUsertype, error);

      return errorResponseWithoutData(
        res,
        `${commonMessages.errorVerifyingUsertype}: ${error}`,
        400
      );
    }
  };
};

module.exports = { verifyUserType };
