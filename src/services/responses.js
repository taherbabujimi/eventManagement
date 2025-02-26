"use strict";

const successResponseData = (res, data, code = 1, message, extras) => {
  const response = {
    data,
    meta: {
      code,
      message,
    },
  };
  if (extras) {
    Object.keys(extras).forEach((key) => {
      if ({}.hasOwnProperty.call(extras, key)) {
        response.meta[key] = extras[key];
      }
    });
  }

  return res.send(response);
};

const successResponseWithoutData = (res, message, code = 1, extras) => {
  const response = {
    data: null,
    meta: {
      code,
      message,
    },
  };
  if (extras) {
    Object.keys(extras).forEach((key) => {
      if ({}.hasOwnProperty.call(extras, key)) {
        response.meta[key] = extras[key];
      }
    });
  }
  return res.send(response);
};

const errorResponseWithoutData = (res, message, code = 0, metaData = {}) => {
  const response = {
    data: null,
    meta: {
      code,
      message,
      ...metaData,
    },
  };
  return res.status(code).send(response);
};

module.exports = {
  successResponseData,
  successResponseWithoutData,
  errorResponseWithoutData,
};
