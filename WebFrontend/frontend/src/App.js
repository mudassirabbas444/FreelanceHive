import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './Components/ErrorBoundary/ErrorBoundary';
import CreateGig from './Components/GigModule/CreateGig';
import ViewGigs from './Components/GigModule/ViewGigs';
import ViewGigDetails from './Components/GigModule/ViewGigDetails';
import ViewGigsSeller from './Components/GigModule/ViewGigsSeller';
import ViewGigDetailsSeller from './Components/GigModule/ViewGigDetailsSeller';
import UpdateGig from './Components/GigModule/UpdateGig';
import Login from './Components/UserModule/Login';
import Signup from './Components/UserModule/Signup';
import ViewGigsAdmin from './Components/GigModule/ViewGigsAdmin';
import ViewGigDetailsAdmin from './Components/GigModule/ViewGigDetailsAdmin';
import ViewOrders from './Components/OrderModule/ViewOrders';
import ViewOrderDetails from './Components/OrderModule/ViewOrderDetails';
import ViewProfile from './Components/UserModule/ViewProfile';
import UpdateProfile from './Components/UserModule/UpdateProfile';
import ViewUserList from './Components/UserModule/ViewUserList';
import CreateProfile from './Components/UserModule/CreateProfile';
import ViewOrderDetailsAdmin from './Components/OrderModule/ViewOrderDetailsAdmin';
import ViewOrderDetailsSeller from './Components/OrderModule/ViewOrderDetailsSeller';
import ViewOrdersSeller from './Components/OrderModule/ViewOrdersSeller';
import ViewOrdersAdmin from './Components/OrderModule/ViewOrdersAdmin';
import ForgotPassword from './Components/UserModule/ForgetPassword';
import ResetPassword from './Components/UserModule/ResetPassword';
import CreateRole from './Components/UserModule/CreateRole';
import Chat from './Components/ChatModule/Chat';
import ChatsList from './Components/ChatModule/ChatList';
import CreateBuyerRequest from './Components/BuyerRequest/CreateBuyerRequest';
import BuyerRequests from './Components/BuyerRequest/BuyerRequest';
import BuyerRequestDetail from './Components/BuyerRequest/BuyerRequestDetail';
import BuyerRequestDetailSeller from './Components/BuyerRequest/BuyerRequestDetailSeller';
import AllBuyerRequests from './Components/BuyerRequest/AllBuyerRequests';
import BuyerRequestDetailAdmin from './Components/BuyerRequest/BuyerRequestDetailAdmin';
import Ideas from './Components/IdeaPitching/Ideas';
import IdeaDetailSeller from './Components/IdeaPitching/IdeaDetailSeller';
import IdeaDetailAdmin from './Components/IdeaPitching/IdeaDetailAdmin';
import IdeaDetail from './Components/IdeaPitching/IdeaDetail';
import AllIdeas from './Components/IdeaPitching/AllIdeas';
import CreateIdea from './Components/IdeaPitching/CreateIdea';
import Meeting from './Components/ChatModule/Meeting';
import VerificationRequests from './Components/UserModule/VerificationRequests';
import VerificationForm from './Components/UserModule/VerificationForm';
import AdminTransactionView from './Components/Payment/AdminTransactionView';
import TransactionHistory from './Components/Payment/TransactionHistory';
import Wallet from './Components/Payment/Wallet';
import SellerDashboard from './Components/Dashboard/SellerDashboard';
import BuyerDashboard from './Components/Dashboard/BuyerDashboard';
import AdminDashboard from './Components/Dashboard/AdminDashboard';

// Create a wrapper component that applies ErrorBoundary to a route
const ErrorBoundaryRoute = ({ children }) => (
  <ErrorBoundary>
    {children}
  </ErrorBoundary>
);

function App() {
  return (
    <Router>
      <ErrorBoundary>
      <Routes>
          <Route path="/gigs" element={<ErrorBoundaryRoute><ViewGigs /></ErrorBoundaryRoute>} />
          <Route path="/createGig" element={<ErrorBoundaryRoute><CreateGig /></ErrorBoundaryRoute>} />
          <Route path="/" element={<ErrorBoundaryRoute><Login/></ErrorBoundaryRoute>} />
          <Route path="/forget-password" element={<ErrorBoundaryRoute><ForgotPassword /></ErrorBoundaryRoute>} />
          <Route path="/reset-password/:token" element={<ErrorBoundaryRoute><ResetPassword /></ErrorBoundaryRoute>} />
          <Route path="/orders" element={<ErrorBoundaryRoute><ViewOrders/></ErrorBoundaryRoute>} />
          <Route path="/sellerOrders" element={<ErrorBoundaryRoute><ViewOrdersSeller/></ErrorBoundaryRoute>} />
          <Route path="/adminOrders" element={<ErrorBoundaryRoute><ViewOrdersAdmin/></ErrorBoundaryRoute>} />
          <Route path="/profile" element={<ErrorBoundaryRoute><ViewProfile/></ErrorBoundaryRoute>} />
          <Route path="/createProfile" element={<ErrorBoundaryRoute><CreateProfile/></ErrorBoundaryRoute>} />
          <Route path="/profile/update/:id" element={<ErrorBoundaryRoute><UpdateProfile/></ErrorBoundaryRoute>} />
          <Route path="/users" element={<ErrorBoundaryRoute><ViewUserList/></ErrorBoundaryRoute>} />
          <Route path="/order/:id" element={<ErrorBoundaryRoute><ViewOrderDetails/></ErrorBoundaryRoute>} />
          <Route path="/adminOrder/:id" element={<ErrorBoundaryRoute><ViewOrderDetailsAdmin/></ErrorBoundaryRoute>} />
          <Route path="/sellerOrder/:id" element={<ErrorBoundaryRoute><ViewOrderDetailsSeller/></ErrorBoundaryRoute>} />
          <Route path="/signup" element={<ErrorBoundaryRoute><Signup/></ErrorBoundaryRoute>} />
          <Route path="/gigDetails/:gigId" element={<ErrorBoundaryRoute><ViewGigDetails /></ErrorBoundaryRoute>} />
          <Route path="/gigSeller/:gigId" element={<ErrorBoundaryRoute><ViewGigDetailsSeller /></ErrorBoundaryRoute>} />
          <Route path="/updateGig/:gigId" element={<ErrorBoundaryRoute><UpdateGig/></ErrorBoundaryRoute>} />
          <Route path="/sellerGigs" element={<ErrorBoundaryRoute><ViewGigsSeller/></ErrorBoundaryRoute>} />
          <Route path="/adminGigs" element={<ErrorBoundaryRoute><ViewGigsAdmin/></ErrorBoundaryRoute>} />
          <Route path="/gigAdmin/:gigId" element={<ErrorBoundaryRoute><ViewGigDetailsAdmin/></ErrorBoundaryRoute>} />
          <Route path="/role" element={<ErrorBoundaryRoute><CreateRole/></ErrorBoundaryRoute>} />
          <Route path="/chat/:receiverId" element={<ErrorBoundaryRoute><Chat/></ErrorBoundaryRoute>} />
          <Route path="/chat" element={<ErrorBoundaryRoute><ChatsList/></ErrorBoundaryRoute>} />
          <Route path="/meeting/:receiverId" element={<ErrorBoundaryRoute><Meeting/></ErrorBoundaryRoute>} />
          <Route path="/createBuyerRequest" element={<ErrorBoundaryRoute><CreateBuyerRequest /></ErrorBoundaryRoute>} />
          <Route path="/buyerRequests" element={<ErrorBoundaryRoute><BuyerRequests /></ErrorBoundaryRoute>} />
          <Route path="/buyerRequest/:requestId" element={<ErrorBoundaryRoute><BuyerRequestDetail /></ErrorBoundaryRoute>} />
          <Route path="/allBuyerRequests" element={<ErrorBoundaryRoute><AllBuyerRequests /></ErrorBoundaryRoute>} />
          <Route path="/buyerRequestSeller/:requestId" element={<ErrorBoundaryRoute><BuyerRequestDetailSeller /></ErrorBoundaryRoute>} />
          <Route path="/buyerRequestAdmin/:requestId" element={<ErrorBoundaryRoute><BuyerRequestDetailAdmin /></ErrorBoundaryRoute>} />
          <Route path="/ideas" element={<ErrorBoundaryRoute><Ideas /></ErrorBoundaryRoute>} />
          <Route path="/createIdea" element={<ErrorBoundaryRoute><CreateIdea /></ErrorBoundaryRoute>} />
          <Route path="/idea/:ideaId" element={<ErrorBoundaryRoute><IdeaDetail /></ErrorBoundaryRoute>} />
          <Route path="/ideaSeller/:ideaId" element={<ErrorBoundaryRoute><IdeaDetailSeller /></ErrorBoundaryRoute>} />
          <Route path="/allIdeas" element={<ErrorBoundaryRoute><AllIdeas /></ErrorBoundaryRoute>} />
          <Route path="/ideaAdmin/:ideaId" element={<ErrorBoundaryRoute><IdeaDetailAdmin /></ErrorBoundaryRoute>} />
          <Route path="/admin/verification" element={<ErrorBoundaryRoute><VerificationRequests /></ErrorBoundaryRoute>} />
          <Route path="/verification" element={<ErrorBoundaryRoute><VerificationForm /></ErrorBoundaryRoute>} />
          <Route path="/admin/transactions" element={<ErrorBoundaryRoute><AdminTransactionView /></ErrorBoundaryRoute>} />
          <Route path="/transactionHistory" element={<ErrorBoundaryRoute><TransactionHistory /></ErrorBoundaryRoute>} />
          <Route path="/wallet" element={<ErrorBoundaryRoute><Wallet /></ErrorBoundaryRoute>} />
          <Route path="/seller/dashboard" element={<ErrorBoundaryRoute><SellerDashboard /></ErrorBoundaryRoute>} />
          <Route path="/buyer/dashboard" element={<ErrorBoundaryRoute><BuyerDashboard /></ErrorBoundaryRoute>} />
          <Route path="/admin/dashboard" element={<ErrorBoundaryRoute><AdminDashboard /></ErrorBoundaryRoute>} />
      </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
