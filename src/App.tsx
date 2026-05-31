import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import InspectionPage from "./pages/InspectionPage";
import HistoryPage from "./pages/HistoryPage";
import { useGoogleAuth } from "./hooks/useGoogleAuth";
import LoginPage from "./pages/LoginPage";
import ExtinguisherTypePage from "./pages/master/ExtinguisherTypePage";
import LocationPage from "./pages/master/LocationPage";
import ExtinguisherPage from "./pages/master/ExtinguisherPage";
import UserPage from "./pages/master/UserPage";
import { useCurrentUser } from "./hooks/useCurrentUser";

export default function App() {
  const { user, accessToken, status, login, handleLogout } = useGoogleAuth();
  const currentUser = useCurrentUser(user);

  if (status !== "allowed") {
    if (window.location.search) {
      sessionStorage.setItem("redirect_url", window.location.href);
    }
    return (
      <LoginPage
        onLogin={login}
        onLogout={handleLogout}
        status={status}
        email={user?.email}
      />
    );
  }

  return (
    <BrowserRouter>
      <MainLayout
        profile={user}
        currentUser={currentUser}
        onLogout={handleLogout}
      >
        <Routes>
          <Route
            path="/"
            element={<DashboardPage accessToken={accessToken} />}
          />
          <Route
            path="master/extinguishertype"
            element={<ExtinguisherTypePage />}
          />
          <Route path="master/location" element={<LocationPage />} />
          <Route path="master/extinguisher" element={<ExtinguisherPage />} />
          <Route path="master/user" element={<UserPage />} />
          <Route
            path="/inspection"
            element={
              <InspectionPage
                currentUser={currentUser}
                accessToken={accessToken}
              />
            }
          />
          <Route path="/history" element={<HistoryPage accessToken={accessToken} />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
