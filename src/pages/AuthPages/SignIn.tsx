import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | Expenshie"
        description="Sign in to Expenshie to track and settle shared household expenses."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
