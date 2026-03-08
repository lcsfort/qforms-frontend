import * as yup from "yup";

export type SigninValidationMessages = {
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
};

export type SignupValidationMessages = SigninValidationMessages & {
  passwordMin: string;
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
      .min(8, m.passwordMin),
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

export type SignupValues = yup.InferType<ReturnType<typeof getSignupSchema>>;
export type SigninValues = yup.InferType<ReturnType<typeof getSigninSchema>>;
