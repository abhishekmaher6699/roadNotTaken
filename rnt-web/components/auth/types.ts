import type {
  LoginFormValues,
  SignupFormValues,
} from "@/features/auth/validation";

export type FieldErrors = Partial<Record<keyof SignupFormValues, string>>;

type BaseAuthFormProps = {
  title: string;
  submitLabel: string;
  pendingLabel: string;
  footerText: string;
  footerHref: string;
  footerLinkLabel: string;
  googleLabel: string;
  onGoogleAuth: () => Promise<void>;
};

export type LoginAuthFormProps = BaseAuthFormProps & {
  mode: "login";
  onSubmit: (values: LoginFormValues) => Promise<void>;
};

export type SignupAuthFormProps = BaseAuthFormProps & {
  mode: "signup";
  onSubmit: (values: SignupFormValues) => Promise<void>;
};

export type AuthFormProps = LoginAuthFormProps | SignupAuthFormProps;
