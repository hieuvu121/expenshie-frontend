import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import ExpenseList from "./pages/ExpenseList/ExpenseList";
import AddExpense from "./pages/Forms/FormElements";
import EditExpense from "./pages/Forms/EditExpense";
import AppLayout from "./layout/AppLayout";
import MinimalLayout from "./layout/MinimalLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Home/Home";
import Settlements from "./pages/Settlement/Settlements";
import NoGroupsOnboarding from "./pages/NoGroupsOnboarding";

export default function App() {
  return (
    <>
      <Router basename={import.meta.env.BASE_URL}>
        <ScrollToTop />
        <Routes>
          {/* Onboarding - Minimal Layout (No Sidebar) */}
          <Route path="/onboarding" element={<MinimalLayout />}>
            <Route index element={<NoGroupsOnboarding />} />
          </Route>

          {/* Application shell */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />

            {/* Expenses */}
            <Route path="expenses" element={<ExpenseList />} />
            <Route path="expenses/new" element={<AddExpense />} />
            <Route path="expenses/edit" element={<EditExpense />} />

            {/* Settlements */}
            <Route path="settlements" element={<Settlements />} />

            {/* Account */}
            <Route path="profile" element={<UserProfiles />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
