import * as React from "react";
import { AccountActionEmail } from "./account-action";
import type { SignupProfile } from "./signup-profile";
type Props = Partial<SignupProfile> & {
  siteName: string;
  siteUrl: string;
  confirmationUrl: string;
};
export const InviteEmail = (props: Props) => <AccountActionEmail {...props} kind="invite" />;
export default InviteEmail;
