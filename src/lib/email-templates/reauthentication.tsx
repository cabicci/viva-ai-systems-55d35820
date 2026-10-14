import * as React from "react";
import { AccountActionEmail } from "./account-action";
import type { SignupProfile } from "./signup-profile";
type Props = Partial<SignupProfile> & { token: string };
export const ReauthenticationEmail = (props: Props) => (
  <AccountActionEmail {...props} kind="reauthentication" />
);
export default ReauthenticationEmail;
