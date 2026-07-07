import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ToastContainer } from './components/ui/Toast';
import { GlobalSearch } from './components/GlobalSearch';
import { Skeleton } from './components/ui/Skeleton';

const Home = lazy(() => import('./pages/Home'));
const Find = lazy(() => import('./pages/Find'));
const Jobs = lazy(() => import('./pages/Jobs'));
const JobDetail = lazy(() => import('./pages/JobDetail'));
const PostJob = lazy(() => import('./pages/PostJob'));
const Chat = lazy(() => import('./pages/Chat'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Shops = lazy(() => import('./pages/Shops'));
const ShopDetail = lazy(() => import('./pages/ShopDetail'));
const Kyc = lazy(() => import('./pages/Kyc'));
const KycStatus = lazy(() => import('./pages/KycStatus'));
const Escrow = lazy(() => import('./pages/Escrow'));
const PaymentVerify = lazy(() => import('./pages/PaymentVerify'));
const DashTech = lazy(() => import('./pages/DashTech'));
const DashStore = lazy(() => import('./pages/DashStore'));
const Admin = lazy(() => import('./pages/Admin'));
const Subscribe = lazy(() => import('./pages/Subscribe'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();

  const isChatPage = location.pathname.startsWith('/chat/');
  const isAuthPage = location.pathname.startsWith('/auth/');

  return (
    <>
      {!isAuthPage && <Navbar />}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={isAuthPage ? '' : 'pt-[60px] pb-16 md:pb-0'}
        >
          <Suspense fallback={<PageLoader />}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/find" element={<Find />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/jobs/post" element={<PostJob />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:jobId" element={<Chat />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/shops" element={<Shops />} />
              <Route path="/shops/:id" element={<ShopDetail />} />
              <Route path="/kyc" element={<Kyc />} />
              <Route path="/kyc/status" element={<KycStatus />} />
              <Route path="/payment/escrow/:jobId" element={<Escrow />} />
              <Route path="/payment/verify" element={<PaymentVerify />} />
              <Route path="/dashboard/technician" element={<DashTech />} />
              <Route path="/dashboard/client" element={<DashTech />} />
              <Route path="/dashboard/store" element={<DashStore />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/subscribe" element={<Subscribe />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
      {!isAuthPage && !isChatPage && <Footer />}
      {!isAuthPage && <MobileBottomNav />}
      <ToastContainer />
      <GlobalSearch />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
