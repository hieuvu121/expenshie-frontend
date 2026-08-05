import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Create Account | Expenshie"
        description="Create an Expenshie account to start splitting household expenses."
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
