import * as React from "react";
import { AccountActionEmail } from "./account-action";
import type { SignupProfile } from "./signup-profile";
type Props = Partial<SignupProfile> & { siteName: string; confirmationUrl: string };
export const MagicLinkEmail = (props: Props) => <AccountActionEmail {...props} kind="magiclink" />;
export default MagicLinkEmail;
