import { Route } from "react-router-dom";
import { AnimationRoutes, App, BottomNavigation, Box, Button, Icon, SnackbarProvider, Spinner, Text, ZMPRouter } from "zmp-ui";
import { SessionProvider, useSession } from "../lib/session";
import HomePage from "../pages/home";
import WalletPage from "../pages/wallet";

function Gate() {
  const { loading, error, retry } = useSession();

  if (loading) {
    return (
      <Box className="kb-fullscreen kb-center">
        <Spinner />
        <Text size="small" className="kb-muted kb-mt8">
          Đang đăng nhập bằng Zalo...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="kb-fullscreen kb-center kb-pad">
        <Text className="kb-text-center">{error}</Text>
        <Button className="kb-mt8" onClick={retry}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <>
      <AnimationRoutes>
        <Route path="/" element={<HomePage />} />
        <Route path="/wallet" element={<WalletPage />} />
      </AnimationRoutes>
      <BottomNavigation fixed>
        <BottomNavigation.Item
          key="home"
          label="Dán link"
          icon={<Icon icon="zi-link" />}
          linkTo="/"
        />
        <BottomNavigation.Item
          key="wallet"
          label="Ví"
          icon={<Icon icon="zi-inbox" />}
          linkTo="/wallet"
        />
      </BottomNavigation>
    </>
  );
}

export default function Layout() {
  return (
    <App theme="light">
      <SnackbarProvider>
        <SessionProvider>
          <ZMPRouter memoryRouter>
            <Gate />
          </ZMPRouter>
        </SessionProvider>
      </SnackbarProvider>
    </App>
  );
}
