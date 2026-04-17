const sendSuccess = (res, data, message = null, status = 200) => {
  const body = { success: true, data };
  if (message) body.message = message;
  return res.status(status).json(body);
};

const sendCreated = (res, data, message = "Resource created successfully") =>
  sendSuccess(res, data, message, 201);

const sendError = (res, errorCode, message, status = 400, details = null) => {
  const body = { success: false, error: errorCode, message };
  if (details !== null) body.details = details;
  return res.status(status).json(body);
};

// Named error senders
const sendUnauthorized = (res, message = "Authentication required") =>
  sendError(res, "UNAUTHORIZED", message, 401);

const sendForbidden = (
  res,
  message = "You do not have permission to perform this action",
) => sendError(res, "FORBIDDEN", message, 403);

const sendNotFound = (res, resource = "Resource") =>
  sendError(res, "NOT_FOUND", `${resource} not found`, 404);

const sendConflict = (res, message) => sendError(res, "CONFLICT", message, 409);

const sendValidationError = (res, message, details = null) =>
  sendError(res, "VALIDATION_ERROR", message, 422, details);

const sendStageGateFailed = (res, stage, missing, activitiesMissingImages = undefined) => {
  const payload = {
    success: false,
    error: "STAGE_GATE_FAILED",
    stage,
    missing,
  };
  if (activitiesMissingImages !== undefined) {
    payload.activitiesMissingImages = activitiesMissingImages;
  }
  return res.status(422).json(payload);
};

const sendWrongStageDocument = (res, documentStage) =>
  res.status(400).json({
    success: false,
    error: "WRONG_STAGE_DOCUMENT",
    message: `This document belongs to Stage ${documentStage}`,
  });

module.exports = {
  sendSuccess,
  sendCreated,
  sendError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendValidationError,
  sendStageGateFailed,
  sendWrongStageDocument,
};
