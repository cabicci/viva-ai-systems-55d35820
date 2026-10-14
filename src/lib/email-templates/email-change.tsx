import * as React from "react";
import { AccountActionEmail } from "./account-action";
import type { SignupProfile } from "./signup-profile";
type Props = Partial<SignupProfile> & {
  siteName: string;
  oldEmail: string;
  email: string;
  newEmail: string;
  confirmationUrl: string;
};
export const EmailChangeEmail = (props: Props) => (
  <AccountActionEmail {...props} kind="email_change" />
);
export default EmailChangeEmail;
