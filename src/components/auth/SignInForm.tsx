import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { API_BASE_URL, saveAuthToken } from "../../services/coreApi";
import { useHousehold } from "../../context/HouseholdContext";
import { householdAPI } from "../../services/householdApi";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { clearHouseholds, refreshHouseholds } = useHousehold();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = (await response.json()) as {
        token?: string;
        user?: unknown;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data?.message || "Sign in failed. Please try again.");
      }

      if (!data?.token) {
        throw new Error("Authentication token was not returned.");
      }

      // Save authentication token and user data to localStorage
      saveAuthToken(data.token);
      if (data.user) {
        localStorage.setItem("authUser", JSON.stringify(data.user));
      }

      // Determine where to send the user based on existing households
      try {
        const myHouseholds = await householdAPI.getMyHouseholds();
        console.log("SignIn: myHouseholds:", myHouseholds);
        // If user has no households, clear any stale state and send to onboarding
        if (!myHouseholds || myHouseholds.length === 0) {
          try { clearHouseholds(); } catch (e) { /* ignore */ }
          navigate("/onboarding");
        } else {
          // Populate household context and go to dashboard
          try {
            // refreshHouseholds will update context
            await refreshHouseholds();
          } catch (e) {
            console.warn("Failed to refresh households after login", e);
          }
          navigate("/");
        }
      } catch (err) {
        // Fallback to onboarding on error
        try { clearHouseholds(); } catch (e) { /* ignore */ }
        navigate("/onboarding");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign in."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="info@gmail.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Link
                    to="#!"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div>
                  <Button className="w-full" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
                {errorMessage && (
                  <p className="text-sm text-error-500">{errorMessage}</p>
                )}
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account? {""}
                <Link
                  to="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
