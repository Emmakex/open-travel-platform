import Link from "next/link";
import { redirect } from "next/navigation";
import { startDemoSession } from "@/app/account/actions";
import { identityConfig } from "@/lib/identity-config";
import { getIdentityRepository } from "@/lib/identity-repository";

export const metadata = {
  title: "Sign in",
  description: "Identity adapter demo for Open Travel Platform."
};

export default async function SignInPage() {
  const identity = await getIdentityRepository().getCurrentIdentity();

  if (identity) {
    redirect("/account");
  }

  return (
    <main className="section">
      <div className="container account-shell">
        <section className="account-panel">
          <div className="eyebrow">Identity boundary</div>
          <h1>Customer accounts without provider lock-in.</h1>
          <p className="account-lead">
            This starter keeps authentication providers behind an identity boundary. The built-in
            demo session uses no password and grants access only to fictional local account data.
          </p>

          {identityConfig.demoSessionEnabled ? (
            <form action={startDemoSession}>
              <button className="button button-primary" type="submit">
                Start demo customer session
              </button>
            </form>
          ) : (
            <div className="account-notice">
              Demo identity is disabled in this deployment. Connect a production identity provider
              by implementing the documented repository contract.
            </div>
          )}

          <div className="account-notice">
            <strong>Production note.</strong> The demo session is not a replacement for a real
            authentication provider and must never be used as an authorization boundary for real data.
          </div>

          <Link className="text-link" href="/">← Back to catalogue</Link>
        </section>
      </div>
    </main>
  );
}
