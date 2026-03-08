import * as yup from "yup";

/** Same as backend: upper, lower, number, special (@$!%*?&), min 8 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

export type SigninValidationMessages = {
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
};

export type SignupValidationMessages = SigninValidationMessages & {
  passwordMin: string;
  passwordPattern: string;
};

export function getSignupSchema(m: SignupValidationMessages) {
  return yup.object({
    name: yup.string().optional(),
    email: yup
      .string()
      .required(m.emailRequired)
      .email(m.emailInvalid),
    password: yup
      .string()
      .required(m.passwordRequired)
      .min(8, m.passwordMin)
      .matches(PASSWORD_REGEX, m.passwordPattern),
  });
}

export function getSigninSchema(m: SigninValidationMessages) {
  return yup.object({
    email: yup
      .string()
      .required(m.emailRequired)
      .email(m.emailInvalid),
    password: yup.string().required(m.passwordRequired),
  });
}

export type ForgotPasswordValidationMessages = {
  emailRequired: string;
  emailInvalid: string;
};

export function getForgotPasswordSchema(m: ForgotPasswordValidationMessages) {
  return yup.object({
    email: yup
      .string()
      .required(m.emailRequired)
      .email(m.emailInvalid),
  });
}

export type ResetPasswordValidationMessages = {
  newPasswordRequired: string;
  newPasswordMin: string;
  newPasswordPattern: string;
  confirmPasswordRequired: string;
  confirmPasswordMatch: string;
};

export function getResetPasswordSchema(m: ResetPasswordValidationMessages) {
  return yup.object({
    newPassword: yup
      .string()
      .required(m.newPasswordRequired)
      .min(8, m.newPasswordMin)
      .matches(PASSWORD_REGEX, m.newPasswordPattern),
    confirmPassword: yup
      .string()
      .required(m.confirmPasswordRequired)
      .oneOf([yup.ref("newPassword")], m.confirmPasswordMatch),
  });
}

export type SignupValues = yup.InferType<ReturnType<typeof getSignupSchema>>;
export type SigninValues = yup.InferType<ReturnType<typeof getSigninSchema>>;
export type ResetPasswordValues = yup.InferType<
  ReturnType<typeof getResetPasswordSchema>
>;
