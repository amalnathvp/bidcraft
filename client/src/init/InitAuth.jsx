import { useEffect, useRef } from "react";
// Commenting out Redux auth as we're now using React Query auth contexts
// import { useDispatch, useSelector } from "react-redux";
// import { checkAuth } from "../store/auth/authSlice";
// import LoadingScreen from "../components/LoadingScreen";

const InitAuth = ({ children }) => {
  // const dispatch = useDispatch();
  // const { loading } = useSelector((state) => state.auth);
  // const didRun = useRef(false);

  // useEffect(() => {
  //   if (!didRun.current) {
  //     dispatch(checkAuth());
  //     didRun.current = true;
  //   }
  // }, [dispatch]);

  // if (loading && !didRun.current) return <LoadingScreen />;

  // Just return children now that we use React Query auth contexts
  return children;
};

export default InitAuth;
